import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker, ProviderHealthStatus } from '../../application/provider-health-tracker.js';
import { mapProviderError } from '../../application/provider-error-mapper.js';
import { sanitizeProviderError } from '../../application/provider-sanitizer.js';
import { HANDMAIS_PROVIDER_KEY, type HandmaisConnectionResult } from './handmais.types.js';

type HandmaisClientOptions = {
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
};

const DEFAULT_TIMEOUT_MS = 15000;
const SAFE_CONNECTIVITY_TIMEOUT_MS = 7000;
const HEALTH_PATH = '/health';

const toPositiveTimeout = (rawValue: string | undefined): number => {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
};

const getEnvironment = (value: string | undefined): string =>
  value?.trim() || 'sandbox';

const clampConnectivityTimeout = (timeoutMs: number): number =>
  Math.max(1_000, Math.min(timeoutMs, SAFE_CONNECTIVITY_TIMEOUT_MS));

const resolveConnectivityUrls = (baseUrl: string): string[] => {
  const normalized = baseUrl.trim().replace(/\/+$/g, '');
  if (!normalized) {
    return [];
  }

  const urls: string[] = [];
  if (/^https?:\/\//i.test(normalized)) {
    urls.push(`${normalized}${HEALTH_PATH}`);
    urls.push(normalized);
  }

  return Array.from(new Set(urls));
};

const isTimeoutError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

const normalizeHandmaisError = (
  error: unknown,
): {
  code:
    | 'HANDMAIS_TIMEOUT_ERROR'
    | 'HANDMAIS_NETWORK_ERROR'
    | 'HANDMAIS_PROVIDER_UNAVAILABLE'
    | 'HANDMAIS_INVALID_RESPONSE';
  normalizedProviderError: string;
  timeoutStatus: 'timeout' | 'ok';
} => {
  if (isTimeoutError(error)) {
    return {
      code: 'HANDMAIS_TIMEOUT_ERROR',
      normalizedProviderError: 'PROVIDER_TIMEOUT_ERROR',
      timeoutStatus: 'timeout',
    };
  }

  if (error instanceof Error) {
    const mappedCode = mapProviderError(error);
    if (mappedCode === 'PROVIDER_CONNECTION_ERROR') {
      return {
        code: 'HANDMAIS_NETWORK_ERROR',
        normalizedProviderError: mappedCode,
        timeoutStatus: 'ok',
      };
    }
  }

  return {
    code: 'HANDMAIS_INVALID_RESPONSE',
    normalizedProviderError: mapProviderError(error),
    timeoutStatus: 'ok',
  };
};

const updateHealth = (
  options: HandmaisClientOptions,
  status: ProviderHealthStatus,
  errorCode?: string,
) => {
  if (!options.healthTracker) {
    return;
  }

  options.healthTracker.set(HANDMAIS_PROVIDER_KEY, 'healthCheck', {
    status,
    updatedAt: new Date(),
    ...(errorCode ? { sanitizedErrorCode: errorCode } : {}),
  });
};

export const testHandmaisConnection = async (
  options: HandmaisClientOptions = {},
): Promise<HandmaisConnectionResult> => {
  const baseUrl = process.env.HANDMAIS_BASE_URL?.trim();
  const apiKey = process.env.HANDMAIS_API_KEY?.trim();
  const timeoutRaw = process.env.HANDMAIS_TIMEOUT?.trim();
  const timeoutMs = toPositiveTimeout(timeoutRaw);
  const environment = getEnvironment(process.env.HANDMAIS_ENV);

  const diagnosticsBase = {
    providerKey: HANDMAIS_PROVIDER_KEY,
    ...(options.context?.requestId ? { requestId: options.context.requestId } : {}),
    authConfigured: Boolean(apiKey),
    authValidated: false,
    connectivityStatus: 'down' as const,
    timeoutStatus: 'ok' as const,
    timeoutMs,
    endpoint: baseUrl ?? '',
    environment,
    externalCall: true,
  };

  if (!baseUrl) {
    updateHealth(options, 'down', 'HANDMAIS_CONFIGURATION_ERROR');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        ...diagnosticsBase,
        externalCall: false,
      },
      error: { code: 'HANDMAIS_CONFIGURATION_ERROR' },
    };
  }

  if (!apiKey) {
    updateHealth(options, 'down', 'HANDMAIS_AUTH_INVALID');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        ...diagnosticsBase,
        endpoint: baseUrl,
        externalCall: false,
      },
      error: { code: 'HANDMAIS_AUTH_INVALID' },
    };
  }

  if (timeoutRaw && (!Number.isFinite(Number(timeoutRaw)) || Number(timeoutRaw) <= 0)) {
    updateHealth(options, 'down', 'HANDMAIS_TIMEOUT_INVALID');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        ...diagnosticsBase,
        timeoutStatus: 'invalid',
        endpoint: baseUrl,
        externalCall: false,
      },
      error: { code: 'HANDMAIS_TIMEOUT_INVALID' },
    };
  }

  const targetUrls = resolveConnectivityUrls(baseUrl);
  if (targetUrls.length === 0) {
    updateHealth(options, 'down', 'HANDMAIS_CONFIGURATION_ERROR');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        ...diagnosticsBase,
        endpoint: baseUrl,
        externalCall: false,
      },
      error: { code: 'HANDMAIS_CONFIGURATION_ERROR' },
    };
  }

  const timeoutForConnectivityMs = clampConnectivityTimeout(timeoutMs);
  const startedAt = Date.now();
  const requestId = options.context?.requestId;
  let lastFailure:
    | {
        code:
          | 'HANDMAIS_TIMEOUT_ERROR'
          | 'HANDMAIS_NETWORK_ERROR'
          | 'HANDMAIS_PROVIDER_UNAVAILABLE'
          | 'HANDMAIS_INVALID_RESPONSE';
        normalizedProviderError: string;
        timeoutStatus: 'timeout' | 'ok';
      }
    | undefined;
  let lastStatus: number | undefined;

  for (const endpoint of targetUrls) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutForConnectivityMs);
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          ...(requestId ? { 'X-Request-ID': requestId, 'X-Correlation-ID': requestId } : {}),
        },
        signal: controller.signal,
      });
      lastStatus = response.status;

      if (response.status === 401 || response.status === 403) {
        updateHealth(options, 'down', 'HANDMAIS_AUTH_INVALID');
        return {
          success: false,
          providerKey: HANDMAIS_PROVIDER_KEY,
          diagnostics: {
            ...diagnosticsBase,
            authValidated: false,
            connectivityStatus: 'down',
            timeoutStatus: 'ok',
            timeoutMs: timeoutForConnectivityMs,
            endpoint,
            httpStatus: response.status,
            latencyMs: Date.now() - startedAt,
            normalizedProviderError: 'PROVIDER_AUTHENTICATION_ERROR',
          },
          error: { code: 'HANDMAIS_AUTH_INVALID' },
        };
      }

      if (response.status >= 500) {
        lastFailure = {
          code: 'HANDMAIS_PROVIDER_UNAVAILABLE',
          normalizedProviderError: 'PROVIDER_CONNECTION_ERROR',
          timeoutStatus: 'ok',
        };
        continue;
      }

      if (!response.ok) {
        lastFailure = {
          code: 'HANDMAIS_INVALID_RESPONSE',
          normalizedProviderError: 'PROVIDER_UNKNOWN_ERROR',
          timeoutStatus: 'ok',
        };
        continue;
      }

      updateHealth(options, 'ok');
      return {
        success: true,
        providerKey: HANDMAIS_PROVIDER_KEY,
        statusCode: response.status,
        diagnostics: {
          ...diagnosticsBase,
          authValidated: true,
          connectivityStatus: 'ok',
          timeoutStatus: 'ok',
          timeoutMs: timeoutForConnectivityMs,
          endpoint,
          httpStatus: response.status,
          latencyMs: Date.now() - startedAt,
        },
        message: 'HANDMAIS connectivity validated with read-only endpoint',
      };
    } catch (error) {
      const normalized = normalizeHandmaisError(error);
      lastFailure = normalized;
      continue;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  const sanitized = sanitizeProviderError(lastFailure);
  const normalizedProviderError =
    sanitized.code ??
    lastFailure?.normalizedProviderError ??
    (lastStatus ? mapProviderError({ status: lastStatus }) : 'PROVIDER_UNKNOWN_ERROR');

  const errorCode = lastFailure?.code ?? 'HANDMAIS_PROVIDER_UNAVAILABLE';
  const timeoutStatus = lastFailure?.timeoutStatus ?? 'ok';
  const healthStatus: ProviderHealthStatus =
    errorCode === 'HANDMAIS_TIMEOUT_ERROR' ||
    errorCode === 'HANDMAIS_NETWORK_ERROR' ||
    errorCode === 'HANDMAIS_PROVIDER_UNAVAILABLE'
      ? 'degraded'
      : 'down';

  updateHealth(options, healthStatus, normalizedProviderError);
  return {
    success: false,
    providerKey: HANDMAIS_PROVIDER_KEY,
    diagnostics: {
      ...diagnosticsBase,
      authValidated: false,
      connectivityStatus: healthStatus === 'down' ? 'down' : 'degraded',
      timeoutStatus,
      timeoutMs: timeoutForConnectivityMs,
      endpoint: targetUrls[0] ?? baseUrl,
      ...(lastStatus ? { httpStatus: lastStatus } : {}),
      latencyMs: Date.now() - startedAt,
      normalizedProviderError,
    },
    error: { code: errorCode },
  };
};
