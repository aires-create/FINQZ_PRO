import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker, ProviderHealthStatus } from '../../application/provider-health-tracker.js';
import { mapProviderError } from '../../application/provider-error-mapper.js';
import { sanitizeProviderError } from '../../application/provider-sanitizer.js';
import {
  HANDMAIS_PROVIDER_KEY,
  type HandmaisConnectionResult,
  type HandmaisInitialSimulationRequest,
  type HandmaisInitialSimulationResult,
} from './handmais.types.js';

type HandmaisClientOptions = {
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
};

const DEFAULT_TIMEOUT_MS = 15000;
const SAFE_CONNECTIVITY_TIMEOUT_MS = 7000;
const HEALTH_PATH = '/health';
const INITIAL_SIMULATION_PATH = '/uy3/simulacao_clt';

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

const cpfDigits = (cpf: string): string => cpf.replace(/\D+/g, '');
const maskCpf = (cpf: string): string => {
  const digits = cpfDigits(cpf);
  if (digits.length < 4) {
    return '***';
  }
  return `***${digits.slice(-4)}`;
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const resolveInitialSimulationUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed.replace(/\/+$/g, '')}${INITIAL_SIMULATION_PATH}`;
};

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

export const runHandmaisInitialSimulation = async (
  input: HandmaisInitialSimulationRequest,
  options: HandmaisClientOptions = {},
): Promise<HandmaisInitialSimulationResult> => {
  const baseUrl = process.env.HANDMAIS_BASE_URL?.trim();
  const apiKey = process.env.HANDMAIS_API_KEY?.trim();
  const timeoutRaw = process.env.HANDMAIS_TIMEOUT?.trim();
  const timeoutMs = clampConnectivityTimeout(toPositiveTimeout(timeoutRaw));
  const requestId = options.context?.requestId;

  const invalidCpf = cpfDigits(input.cpf).length !== 11;
  if (invalidCpf) {
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        providerKey: HANDMAIS_PROVIDER_KEY,
        ...(requestId ? { requestId } : {}),
        endpoint: '',
        externalCall: true,
        authValidated: false,
        connectivityStatus: 'down',
        timeoutStatus: 'ok',
        normalizedProviderError: 'PROVIDER_UNKNOWN_ERROR',
      },
      error: { code: 'HANDMAIS_INVALID_CPF' },
    };
  }

  if (!input.matricula || !input.matricula.trim()) {
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        providerKey: HANDMAIS_PROVIDER_KEY,
        ...(requestId ? { requestId } : {}),
        endpoint: '',
        externalCall: true,
        authValidated: false,
        connectivityStatus: 'down',
        timeoutStatus: 'ok',
        normalizedProviderError: 'PROVIDER_UNKNOWN_ERROR',
      },
      error: { code: 'HANDMAIS_INVALID_MATRICULA' },
    };
  }

  if (!baseUrl || !apiKey) {
    updateHealth(options, 'down', 'HANDMAIS_CONFIGURATION_ERROR');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        providerKey: HANDMAIS_PROVIDER_KEY,
        ...(requestId ? { requestId } : {}),
        endpoint: baseUrl ?? '',
        externalCall: true,
        authValidated: false,
        connectivityStatus: 'down',
        timeoutStatus: 'ok',
        normalizedProviderError: 'PROVIDER_CONFIGURATION_ERROR',
      },
      error: { code: 'HANDMAIS_AUTH_INVALID' },
    };
  }

  const endpoint = resolveInitialSimulationUrl(baseUrl);
  const startedAt = Date.now();
  const body = {
    cpf: cpfDigits(input.cpf),
    matricula: input.matricula.trim(),
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        ...(requestId ? { 'X-Request-ID': requestId, 'X-Correlation-ID': requestId } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;

    if (response.status === 401 || response.status === 403) {
      updateHealth(options, 'down', 'PROVIDER_AUTHENTICATION_ERROR');
      return {
        success: false,
        providerKey: HANDMAIS_PROVIDER_KEY,
        diagnostics: {
          providerKey: HANDMAIS_PROVIDER_KEY,
          ...(requestId ? { requestId } : {}),
          endpoint,
          externalCall: true,
          latencyMs,
          authValidated: false,
          connectivityStatus: 'down',
          timeoutStatus: 'ok',
          providerStatusCode: response.status,
          normalizedProviderError: 'PROVIDER_AUTHENTICATION_ERROR',
        },
        error: { code: 'HANDMAIS_AUTH_INVALID' },
      };
    }

    if (response.status >= 500) {
      updateHealth(options, 'degraded', 'PROVIDER_CONNECTION_ERROR');
      return {
        success: false,
        providerKey: HANDMAIS_PROVIDER_KEY,
        diagnostics: {
          providerKey: HANDMAIS_PROVIDER_KEY,
          ...(requestId ? { requestId } : {}),
          endpoint,
          externalCall: true,
          latencyMs,
          authValidated: true,
          connectivityStatus: 'degraded',
          timeoutStatus: 'ok',
          providerStatusCode: response.status,
          normalizedProviderError: 'PROVIDER_CONNECTION_ERROR',
        },
        error: { code: 'HANDMAIS_PROVIDER_UNAVAILABLE' },
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (!payload || typeof payload !== 'object') {
      updateHealth(options, 'down', 'PROVIDER_UNKNOWN_ERROR');
      return {
        success: false,
        providerKey: HANDMAIS_PROVIDER_KEY,
        diagnostics: {
          providerKey: HANDMAIS_PROVIDER_KEY,
          ...(requestId ? { requestId } : {}),
          endpoint,
          externalCall: true,
          latencyMs,
          authValidated: response.ok,
          connectivityStatus: 'down',
          timeoutStatus: 'ok',
          providerStatusCode: response.status,
          normalizedProviderError: 'PROVIDER_UNKNOWN_ERROR',
        },
        error: { code: 'HANDMAIS_INVALID_RESPONSE' },
      };
    }

    const objectPayload = payload as Record<string, unknown>;
    const availableMargin =
      parseOptionalNumber(objectPayload.valor_margem) ??
      parseOptionalNumber(objectPayload.availableMargin) ??
      parseOptionalNumber(objectPayload.margem);
    const providerMessage =
      (typeof objectPayload.mensagem === 'string' ? objectPayload.mensagem : undefined) ??
      (typeof objectPayload.message === 'string' ? objectPayload.message : undefined);
    const cnpj = typeof objectPayload.cnpj === 'string' ? objectPayload.cnpj : undefined;
    const responseMatricula =
      (typeof objectPayload.matricula === 'string' ? objectPayload.matricula : undefined) ??
      body.matricula;
    const responseRequestId =
      (typeof objectPayload.requestId === 'string' ? objectPayload.requestId : undefined) ??
      requestId;

    updateHealth(options, 'ok');
    return {
      success: true,
      providerKey: HANDMAIS_PROVIDER_KEY,
      data: {
        cpfMasked: maskCpf(body.cpf),
        matricula: responseMatricula,
        ...(cnpj ? { cnpj } : {}),
        ...(availableMargin !== undefined ? { availableMargin } : {}),
        providerStatusCode: response.status,
        ...(providerMessage ? { providerMessage } : {}),
        ...(responseRequestId ? { requestId: responseRequestId } : {}),
        consultedAt: new Date().toISOString(),
      },
      diagnostics: {
        providerKey: HANDMAIS_PROVIDER_KEY,
        ...(requestId ? { requestId } : {}),
        endpoint,
        externalCall: true,
        latencyMs,
        authValidated: true,
        connectivityStatus: 'ok',
        timeoutStatus: 'ok',
        providerStatusCode: response.status,
      },
    };
  } catch (error) {
    const timeoutStatus = isTimeoutError(error) ? 'timeout' : 'ok';
    const normalizedProviderError = sanitizeProviderError(error).code ?? mapProviderError(error);
    const isNetwork = error instanceof Error && !isTimeoutError(error);

    updateHealth(
      options,
      isTimeoutError(error) || isNetwork ? 'degraded' : 'down',
      normalizedProviderError,
    );

    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics: {
        providerKey: HANDMAIS_PROVIDER_KEY,
        ...(requestId ? { requestId } : {}),
        endpoint,
        externalCall: true,
        latencyMs: Date.now() - startedAt,
        authValidated: false,
        connectivityStatus: isTimeoutError(error) || isNetwork ? 'degraded' : 'down',
        timeoutStatus,
        normalizedProviderError,
      },
      error: {
        code: isTimeoutError(error)
          ? 'HANDMAIS_TIMEOUT_ERROR'
          : isNetwork
            ? 'HANDMAIS_NETWORK_ERROR'
            : 'HANDMAIS_INVALID_RESPONSE',
      },
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
};
