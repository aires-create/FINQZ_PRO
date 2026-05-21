import {
  NOVA_PROMOTORA_PROVIDER_KEY,
  type NovaPromotoraClientOptions,
  type NovaPromotoraExternalErrorCode,
  type NovaPromotoraRequestResult,
} from './nova-promotora.types.js';

const novaPromotoraHealthPath = '/api';
const defaultTimeoutMs = 5_000;

const getDurationMs = (startedAt: number) => Date.now() - startedAt;

const getConfiguredTimeoutMs = (timeoutMs?: number) => {
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }

  const envTimeoutMs = Number(process.env.NOVA_PROMOTORA_TIMEOUT_MS);

  return Number.isFinite(envTimeoutMs) && envTimeoutMs > 0
    ? envTimeoutMs
    : defaultTimeoutMs;
};

const buildHealthUrl = (baseUrl: string) =>
  new URL(novaPromotoraHealthPath, baseUrl).toString();

const isAbortError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
};

const buildFailureResult = (params: {
  code: NovaPromotoraExternalErrorCode;
  durationMs: number;
  externalStatus: Exclude<NovaPromotoraRequestResult['externalStatus'], 'available'>;
  message: string;
  statusCode?: number;
}): NovaPromotoraRequestResult => ({
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

export async function testNovaPromotoraConnection(
  options: NovaPromotoraClientOptions = {},
): Promise<NovaPromotoraRequestResult> {
  const startedAt = Date.now();
  const baseUrl = (options.baseUrl ?? process.env.NOVA_PROMOTORA_BASE_URL)?.trim();
  const apiKey = (options.apiKey ?? process.env.NOVA_PROMOTORA_API_KEY)?.trim();

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
    url = buildHealthUrl(baseUrl);
  } catch {
    return buildFailureResult({
      code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is invalid',
    });
  }

  const timeoutMs = getConfiguredTimeoutMs(options.timeoutMs);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeoutHandle);
  }
}
