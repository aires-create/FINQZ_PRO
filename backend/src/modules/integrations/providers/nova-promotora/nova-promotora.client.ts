import {
  NOVA_PROMOTORA_PROVIDER_KEY,
  type NovaPromotoraClientOptions,
  type NovaPromotoraExternalErrorCode,
  type NovaPromotoraProposalsRequestResult,
  type NovaPromotoraRequestResult,
} from './nova-promotora.types.js';
import { config } from '../../../../config/app.js';
import { ProviderHttpClient } from '../../application/provider-http-client.js';

const defaultTimeoutMs = 5_000;

const getDurationMs = (startedAt: number) => Date.now() - startedAt;

const getConfiguredTimeoutMs = (timeoutMs?: number) => {
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }

  const configTimeoutMs = config.integrations.novaPromotora.timeoutMs;

  if (
    typeof configTimeoutMs === 'number' &&
    Number.isFinite(configTimeoutMs) &&
    configTimeoutMs > 0
  ) {
    return configTimeoutMs;
  }

  const envTimeoutMs = Number(process.env.NOVA_PROMOTORA_TIMEOUT_MS);

  return Number.isFinite(envTimeoutMs) && envTimeoutMs > 0
    ? envTimeoutMs
    : defaultTimeoutMs;
};

const normalizePath = (path: string) =>
  path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

const buildProviderUrl = (baseUrl: string, path: string) => {
  const parsedUrl = new URL(baseUrl);
  const basePath = normalizePath(parsedUrl.pathname);
  const normalizedPath = [basePath, normalizePath(path)]
    .filter(Boolean)
    .join('/');

  parsedUrl.pathname = normalizedPath ? `/${normalizedPath}` : '/';

  return parsedUrl.toString();
};

const isAbortError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

type NovaPromotoraFailureResult = Extract<
  NovaPromotoraRequestResult,
  { success: false }
>;

const buildFailureResult = (params: {
  code: NovaPromotoraExternalErrorCode;
  durationMs: number;
  externalStatus: Exclude<NovaPromotoraRequestResult['externalStatus'], 'available'>;
  message: string;
  statusCode?: number;
}): NovaPromotoraFailureResult => ({
  providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
  success: false,
  externalStatus: params.externalStatus,
  durationMs: params.durationMs,
  ...(params.statusCode !== undefined ? { statusCode: params.statusCode } : {}),
  error: {
    code: params.code,
    message: params.message,
    ...(params.statusCode !== undefined ? { status: params.statusCode } : {}),
  },
});

const createHttpClient = (options: NovaPromotoraClientOptions): ProviderHttpClient =>
  new ProviderHttpClient({
    timeoutMs: getConfiguredTimeoutMs(options.timeoutMs),
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 150,
      maxDelayMs: 750,
    },
    ...(options.fetcher ? { fetcher: options.fetcher } : {}),
    ...(options.context ? { context: options.context } : {}),
    ...(options.healthTracker ? { healthTracker: options.healthTracker } : {}),
    ...(options.providerRetryPolicy ? { providerRetryPolicy: options.providerRetryPolicy } : {}),
  });

export async function testNovaPromotoraConnection(
  options: NovaPromotoraClientOptions = {},
): Promise<NovaPromotoraRequestResult> {
  const startedAt = Date.now();
  const healthPathSource =
    options.healthPath ??
    process.env.NOVA_PROMOTORA_HEALTH_PATH ??
    config.integrations.novaPromotora.healthPath;
  const healthPath = healthPathSource?.trim();
  const normalizedHealthPath = healthPath ? normalizePath(healthPath) : '';

  if (!healthPath || !normalizedHealthPath) {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is incomplete',
    });
  }

  const baseUrl = (
    options.baseUrl ??
    config.integrations.novaPromotora.baseUrl ??
    process.env.NOVA_PROMOTORA_BASE_URL
  )?.trim();
  const apiKey = (
    options.apiKey ??
    config.integrations.novaPromotora.apiKey ??
    process.env.NOVA_PROMOTORA_API_KEY
  )?.trim();
  if (!baseUrl || !apiKey) {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is incomplete',
    });
  }

  let url: string;

  try {
    url = buildProviderUrl(baseUrl, healthPath);
  } catch {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is invalid',
    });
  }

  const httpClient = createHttpClient(options);

  try {
    const response = await httpClient.request(url, {
      method: 'GET',
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      capability: 'healthCheck',
      ...(options.context ? { context: options.context } : {}),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return buildFailureResult({
        code: 'NOVA_PROMOTORA_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'unavailable',
        message: 'Provider health check returned unsuccessful status',
        statusCode: response.status,
      });
    }

    return {
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      success: true,
      externalStatus: 'available',
      statusCode: response.status,
      durationMs: getDurationMs(startedAt),
    };
  } catch (error) {
    if (isAbortError(error)) {
      return buildFailureResult({
        code: 'NOVA_PROMOTORA_TIMEOUT',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'timeout',
        message: 'Provider health check timed out',
      });
    }

    return buildFailureResult({
      code: 'NOVA_PROMOTORA_NETWORK_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'network_error',
      message: 'Provider health check request failed',
    });
  }
}

export async function listNovaPromotoraProposals(
  options: NovaPromotoraClientOptions = {},
): Promise<NovaPromotoraProposalsRequestResult> {
  const startedAt = Date.now();
  const baseUrl = (
    options.baseUrl ??
    config.integrations.novaPromotora.baseUrl ??
    process.env.NOVA_PROMOTORA_BASE_URL
  )?.trim();
  const apiKey = (
    options.apiKey ??
    config.integrations.novaPromotora.apiKey ??
    process.env.NOVA_PROMOTORA_API_KEY
  )?.trim();
  const proposalsPath = (
    options.proposalsPath ??
    config.integrations.novaPromotora.proposalsPath ??
    process.env.NOVA_PROMOTORA_PROPOSALS_PATH
  )?.trim();

  if (!baseUrl || !apiKey || !proposalsPath) {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is incomplete',
    });
  }

  let url: string;

  try {
    url = buildProviderUrl(baseUrl, proposalsPath);
  } catch {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is invalid',
    });
  }

  const httpClient = createHttpClient(options);

  try {
    const response = await httpClient.request(url, {
      method: 'GET',
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      capability: 'proposalDiscovery',
      ...(options.context ? { context: options.context } : {}),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return buildFailureResult({
        code: 'NOVA_PROMOTORA_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'unavailable',
        message: 'Provider proposals request returned unsuccessful status',
        statusCode: response.status,
      });
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      return buildFailureResult({
        code: 'NOVA_PROMOTORA_RESPONSE_ERROR',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'unavailable',
        message: 'Provider proposals response is invalid',
        statusCode: response.status,
      });
    }

    return {
      providerKey: NOVA_PROMOTORA_PROVIDER_KEY,
      success: true,
      externalStatus: 'available',
      statusCode: response.status,
      durationMs: getDurationMs(startedAt),
      data,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return buildFailureResult({
        code: 'NOVA_PROMOTORA_TIMEOUT',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'timeout',
        message: 'Provider proposals request timed out',
      });
    }

    return buildFailureResult({
      code: 'NOVA_PROMOTORA_NETWORK_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'network_error',
      message: 'Provider proposals request failed',
    });
  }
}
