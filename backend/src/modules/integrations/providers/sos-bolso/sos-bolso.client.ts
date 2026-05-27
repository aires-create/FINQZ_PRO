import { ProviderHttpClient } from '../../application/provider-http-client.js';
import { TokenManager, type TokenPayload } from '../../application/token-manager.js';
import { config as appConfig } from '../../../../config/app.js';
import { mapMarginInquiryInputToSosBolsoRequest, mapSosBolsoMarginResponseToDomain } from './sos-bolso.mapper.js';
import {
  SOS_BOLSO_PROVIDER_KEY,
  type SosBolsoAuthenticateResult,
  type SosBolsoClientOptions,
  type SosBolsoExternalErrorCode,
  type SosBolsoMarginInput,
  type SosBolsoMarginRequestResult,
  type SosBolsoRequestResult,
} from './sos-bolso.types.js';

const defaultTimeoutMs = 5_000;
const defaultTokenPath = '/oauth/token';
const defaultMarginPath = '/consulta-margem';
const defaultHealthPath = '/oauth/token';

const tokenManagerRegistry = new Map<string, TokenManager>();

const getDurationMs = (startedAt: number) => Date.now() - startedAt;

const buildFailureResult = (params: {
  code: SosBolsoExternalErrorCode;
  durationMs: number;
  externalStatus: Exclude<SosBolsoRequestResult['externalStatus'], 'available'>;
  message: string;
  statusCode?: number;
}): Extract<SosBolsoRequestResult, { success: false }> => ({
  providerKey: SOS_BOLSO_PROVIDER_KEY,
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

const buildAuthFailureResult = (params: {
  code: SosBolsoExternalErrorCode;
  durationMs: number;
  message: string;
  statusCode?: number;
}): Extract<SosBolsoAuthenticateResult, { success: false }> => ({
  providerKey: SOS_BOLSO_PROVIDER_KEY,
  success: false,
  durationMs: params.durationMs,
  ...(params.statusCode !== undefined ? { statusCode: params.statusCode } : {}),
  error: {
    code: params.code,
    message: params.message,
    ...(params.statusCode !== undefined ? { status: params.statusCode } : {}),
  },
});

const buildMarginFailureResult = (params: {
  code: SosBolsoExternalErrorCode;
  durationMs: number;
  message: string;
  statusCode?: number;
}): Extract<SosBolsoMarginRequestResult, { success: false }> => ({
  providerKey: SOS_BOLSO_PROVIDER_KEY,
  success: false,
  durationMs: params.durationMs,
  error: {
    code: params.code,
    message: params.message,
    ...(params.statusCode !== undefined ? { status: params.statusCode } : {}),
  },
});

const isAbortError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
};

const getTimeoutMs = (timeoutMs?: number) => {
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }

  return defaultTimeoutMs;
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
  const normalizedPath = [basePath, normalizePath(path)].filter(Boolean).join('/');
  parsedUrl.pathname = normalizedPath ? `/${normalizedPath}` : '/';
  return parsedUrl.toString();
};

const buildRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `sos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

type SosBolsoResolvedConfig = {
  enabled: boolean;
  baseUrl: string;
  clientId?: string;
  clientSecret?: string;
  signedJwt?: string;
  timeoutMs: number;
  tokenPath: string;
  marginPath: string;
  healthPath: string;
  fetcher: typeof fetch | undefined;
  requestId: string;
  context?: SosBolsoClientOptions['context'];
  healthTracker?: SosBolsoClientOptions['healthTracker'];
  providerRetryPolicy?: SosBolsoClientOptions['providerRetryPolicy'];
};

const resolveConfig = (options: SosBolsoClientOptions): SosBolsoResolvedConfig | null => {
  const central = appConfig.integrations.sosBolso;
  const enabled = options.enabled ?? central.enabled ?? false;
  if (!enabled && !options.baseUrl && !options.clientId && !options.clientSecret && !options.signedJwt) {
    return null;
  }

  const baseUrl = (options.baseUrl ?? central.baseUrl ?? process.env.SOS_BOLSO_BASE_URL)?.trim();
  const clientId = (options.clientId ?? central.clientId ?? process.env.SOS_BOLSO_CLIENT_ID)?.trim();
  const clientSecret = (options.clientSecret ?? central.clientSecret ?? process.env.SOS_BOLSO_CLIENT_SECRET)?.trim();
  const signedJwt = (options.signedJwt ?? central.signedJwt ?? process.env.SOS_BOLSO_SIGNED_JWT)?.trim();
  const tokenPath = (options.tokenPath ?? central.tokenPath ?? process.env.SOS_BOLSO_TOKEN_PATH ?? defaultTokenPath)?.trim();
  const marginPath = (options.marginPath ?? central.marginPath ?? process.env.SOS_BOLSO_MARGIN_PATH ?? defaultMarginPath)?.trim();
  const healthPath = (options.healthPath ?? process.env.SOS_BOLSO_HEALTH_PATH ?? defaultHealthPath)?.trim();
  const timeoutMs = getTimeoutMs(options.timeoutMs ?? central.timeoutMs);

  const hasClientCredentials = Boolean(clientId && clientSecret);
  const hasLegacyJwt = Boolean(signedJwt);

  if (!baseUrl || !tokenPath || !marginPath || !healthPath || (!hasClientCredentials && !hasLegacyJwt)) {
    return null;
  }

  return {
    enabled,
    baseUrl,
    ...(clientId ? { clientId } : {}),
    ...(clientSecret ? { clientSecret } : {}),
    ...(signedJwt ? { signedJwt } : {}),
    tokenPath,
    marginPath,
    healthPath,
    fetcher: options.fetcher,
    timeoutMs,
    requestId: options.requestId?.trim() || buildRequestId(),
    ...(options.context ? { context: options.context } : {}),
    ...(options.healthTracker ? { healthTracker: options.healthTracker } : {}),
    ...(options.providerRetryPolicy ? { providerRetryPolicy: options.providerRetryPolicy } : {}),
  };
};

const createHttpClient = (config: SosBolsoResolvedConfig) => {
  const options = {
    timeoutMs: config.timeoutMs,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 150,
      maxDelayMs: 750,
    },
    ...(config.fetcher ? { fetcher: config.fetcher } : {}),
    ...(config.context ? { context: config.context } : {}),
    ...(config.healthTracker ? { healthTracker: config.healthTracker } : {}),
    ...(config.providerRetryPolicy ? { providerRetryPolicy: config.providerRetryPolicy } : {}),
  };

  return new ProviderHttpClient(options);
};

const authenticateWithConfig = async (
  config: SosBolsoResolvedConfig,
): Promise<SosBolsoAuthenticateResult> => {
  const startedAt = Date.now();
  const httpClient = createHttpClient(config);
  const tokenUrl = buildProviderUrl(config.baseUrl, config.tokenPath);

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Request-ID': config.requestId,
  };
  const authPayload: Record<string, string> = {
    grant_type: 'client_credentials',
  };

  if (config.clientId && config.clientSecret) {
    authPayload.client_id = config.clientId;
    authPayload.client_secret = config.clientSecret;
  } else if (config.signedJwt) {
    authHeaders.Authorization = `Bearer ${config.signedJwt}`;
  }

  try {
    const response = await httpClient.request(tokenUrl, {
      method: 'POST',
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      capability: 'authentication',
      ...(config.context ? { context: config.context } : {}),
      headers: authHeaders,
      body: JSON.stringify(authPayload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return buildAuthFailureResult({
          code: 'SOS_BOLSO_AUTHENTICATION_ERROR',
          durationMs: getDurationMs(startedAt),
          message: 'Provider authentication failed',
          statusCode: response.status,
        });
      }

      return buildAuthFailureResult({
        code: 'SOS_BOLSO_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        message: 'Provider authentication request failed',
        statusCode: response.status,
      });
    }

    const payload = await response.json().catch(() => null) as {
      access_token?: string;
      expires_in?: number;
    } | null;
    const accessToken = payload?.access_token?.trim();
    const expiresIn = Number(payload?.expires_in ?? 3600);

    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      return buildAuthFailureResult({
        code: 'SOS_BOLSO_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        message: 'Provider authentication response is invalid',
        statusCode: response.status,
      });
    }

    return {
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      success: true,
      accessToken,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1_000,
      durationMs: getDurationMs(startedAt),
    };
  } catch (error) {
    if (isAbortError(error)) {
      return buildAuthFailureResult({
        code: 'SOS_BOLSO_TIMEOUT',
        durationMs: getDurationMs(startedAt),
        message: 'Provider authentication timed out',
      });
    }

    return buildAuthFailureResult({
      code: 'SOS_BOLSO_NETWORK_ERROR',
      durationMs: getDurationMs(startedAt),
      message: 'Provider authentication request failed',
    });
  }
};

const getTokenManager = (config: SosBolsoResolvedConfig): TokenManager => {
  const identity = config.clientId
    ? `cid:${config.clientId}`
    : `jwt:${(config.signedJwt ?? '').slice(0, 8)}`;
  const key = `${config.baseUrl}|${config.tokenPath}|${identity}`;
  const existing = tokenManagerRegistry.get(key);
  if (existing) {
    return existing;
  }

  const manager = new TokenManager(async (): Promise<TokenPayload> => {
    const authResult = await authenticateWithConfig(config);
    if (!authResult.success) {
      const error = new Error(authResult.error.message);
      error.name =
        authResult.error.code === 'SOS_BOLSO_AUTHENTICATION_ERROR'
          ? 'SosBolsoAuthenticationError'
          : 'SosBolsoTokenError';
      throw error;
    }

    return {
      accessToken: authResult.accessToken,
      expiresAt: authResult.expiresAt,
    };
  });

  tokenManagerRegistry.set(key, manager);
  return manager;
};

export async function authenticateSosBolso(
  options: SosBolsoClientOptions = {},
): Promise<SosBolsoAuthenticateResult> {
  const config = resolveConfig(options);
  if (!config) {
    return buildAuthFailureResult({
      code: 'SOS_BOLSO_CONFIGURATION_ERROR',
      durationMs: 0,
      message: 'Provider configuration is incomplete',
    });
  }

  return authenticateWithConfig(config);
}

export async function testSosBolsoConnection(
  options: SosBolsoClientOptions = {},
): Promise<SosBolsoRequestResult> {
  const startedAt = Date.now();
  const config = resolveConfig(options);

  if (!config) {
    return buildFailureResult({
      code: 'SOS_BOLSO_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is incomplete',
    });
  }

  const tokenManager = getTokenManager(config);

  try {
    await tokenManager.getToken();

    return {
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      success: true,
      externalStatus: 'available',
      statusCode: 200,
      durationMs: getDurationMs(startedAt),
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'SosBolsoAuthenticationError'
    ) {
      return buildFailureResult({
        code: 'SOS_BOLSO_AUTHENTICATION_ERROR',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'unavailable',
        message: 'Provider authentication failed',
      });
    }

    return buildFailureResult({
      code: 'SOS_BOLSO_NETWORK_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'network_error',
      message: 'Provider health check request failed',
    });
  }
}

export async function inquireSosBolsoMargin(
  input: SosBolsoMarginInput,
  options: SosBolsoClientOptions = {},
): Promise<SosBolsoMarginRequestResult> {
  const startedAt = Date.now();
  const config = resolveConfig(options);

  if (!config) {
    return buildMarginFailureResult({
      code: 'SOS_BOLSO_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      message: 'Provider configuration is incomplete',
    });
  }

  const requestDto = mapMarginInquiryInputToSosBolsoRequest(input);
  const httpClient = createHttpClient(config);
  const tokenManager = getTokenManager(config);

  try {
    const accessToken = await tokenManager.getToken();
    const response = await httpClient.request(buildProviderUrl(config.baseUrl, config.marginPath), {
      method: 'POST',
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      capability: 'marginInquiry',
      ...(config.context ? { context: config.context } : {}),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Request-ID': config.requestId,
      },
      body: JSON.stringify({
        cnpj_convenio: requestDto.convenioCnpj,
        cpf_cliente: requestDto.customerCpf,
        matricula_cliente: requestDto.enrollmentId,
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        tokenManager.clear();
        return buildMarginFailureResult({
          code: 'SOS_BOLSO_AUTHENTICATION_ERROR',
          durationMs: getDurationMs(startedAt),
          message: 'Provider authentication failed',
          statusCode: response.status,
        });
      }

      return buildMarginFailureResult({
        code: 'SOS_BOLSO_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        message: 'Provider margin inquiry request failed',
        statusCode: response.status,
      });
    }

    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return buildMarginFailureResult({
        code: 'SOS_BOLSO_HTTP_ERROR',
        durationMs: getDurationMs(startedAt),
        message: 'Provider margin inquiry response is invalid',
        statusCode: response.status,
      });
    }

    return {
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      success: true,
      durationMs: getDurationMs(startedAt),
      data: mapSosBolsoMarginResponseToDomain(payload as Record<string, unknown>),
    };
  } catch (error) {
    if (isAbortError(error)) {
      return buildMarginFailureResult({
        code: 'SOS_BOLSO_TIMEOUT',
        durationMs: getDurationMs(startedAt),
        message: 'Provider margin inquiry timed out',
      });
    }

    return buildMarginFailureResult({
      code: 'SOS_BOLSO_NETWORK_ERROR',
      durationMs: getDurationMs(startedAt),
      message: 'Provider margin inquiry request failed',
    });
  }
}

export const __resetSosBolsoTokenCacheForTests = (): void => {
  tokenManagerRegistry.clear();
};
