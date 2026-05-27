import { config as appConfig } from '../../../../config/app.js';
import { FinancialExecutionRuntime } from '../../application/financial-execution-runtime.js';
import { DefaultProviderIdempotencyContract } from '../../application/provider-idempotency-contract.js';
import { ProviderHttpClient } from '../../application/provider-http-client.js';
import { DefaultFinancialExecutionPolicy } from '../../domain/contracts/financial-execution.contract.js';
import {
  BLUEPAY_PROVIDER_KEY,
  type BluepayAuthenticateResult,
  type BluepayClientOptions,
  type BluepayCommissionPayoutInput,
  type BluepayCommissionPayoutResult,
  type BluepayExternalErrorCode,
  type BluepayRequestResult,
} from './bluepay.types.js';

const defaultTimeoutMs = 5_000;

type BluepayResolvedConfig = {
  enabled: boolean;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeoutMs: number;
  healthPath?: string;
};

const getDurationMs = (startedAt: number) => Date.now() - startedAt;

const buildFailureResult = (params: {
  code: BluepayExternalErrorCode;
  durationMs: number;
  externalStatus: Exclude<BluepayRequestResult['externalStatus'], 'available'>;
  message: string;
}): Extract<BluepayRequestResult, { success: false }> => ({
  providerKey: BLUEPAY_PROVIDER_KEY,
  success: false,
  externalStatus: params.externalStatus,
  durationMs: params.durationMs,
  error: {
    code: params.code,
    message: params.message,
  },
});

const buildAuthFailureResult = (params: {
  code: BluepayExternalErrorCode;
  durationMs: number;
  message: string;
}): Extract<BluepayAuthenticateResult, { success: false }> => ({
  providerKey: BLUEPAY_PROVIDER_KEY,
  success: false,
  durationMs: params.durationMs,
  error: {
    code: params.code,
    message: params.message,
  },
});

const buildPayoutFailureResult = (params: {
  code: BluepayExternalErrorCode;
  durationMs: number;
  message: string;
}): Extract<BluepayCommissionPayoutResult, { success: false }> => ({
  providerKey: BLUEPAY_PROVIDER_KEY,
  success: false,
  durationMs: params.durationMs,
  error: {
    code: params.code,
    message: params.message,
  },
});

const resolveConfig = (
  options: BluepayClientOptions,
): BluepayResolvedConfig | { disabled: true } | null => {
  const central = appConfig.integrations.bluepay;
  const enabled = options.enabled ?? central.enabled ?? false;

  if (!enabled) {
    return { disabled: true };
  }

  const baseUrl = (
    options.baseUrl ??
    central.baseUrl ??
    process.env.BLUEPAY_BASE_URL
  )?.trim();
  const clientId = (
    options.clientId ??
    central.clientId ??
    process.env.BLUEPAY_CLIENT_ID
  )?.trim();
  const clientSecret = (
    options.clientSecret ??
    central.clientSecret ??
    process.env.BLUEPAY_CLIENT_SECRET
  )?.trim();

  const timeoutMs =
    (typeof options.timeoutMs === 'number' && options.timeoutMs > 0
      ? options.timeoutMs
      : central.timeoutMs) ?? defaultTimeoutMs;

  if (!baseUrl || !clientId || !clientSecret) {
    return null;
  }

  return {
    enabled,
    baseUrl,
    clientId,
    clientSecret,
    timeoutMs,
    ...(options.healthPath?.trim()
      ? { healthPath: options.healthPath.trim() }
      : process.env.BLUEPAY_HEALTH_PATH?.trim()
        ? { healthPath: process.env.BLUEPAY_HEALTH_PATH.trim() }
        : {}),
  };
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

const createHttpClient = (options: BluepayClientOptions, timeoutMs: number): ProviderHttpClient =>
  new ProviderHttpClient({
    timeoutMs,
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

const updateHealth = (
  options: BluepayClientOptions,
  capability: string,
  status: 'disabled' | 'degraded' | 'down' | 'ok',
  code?: string,
) => {
  const providerKey = options.context?.providerKey ?? BLUEPAY_PROVIDER_KEY;
  const healthCapability = options.context?.capability ?? capability;
  if (!options.healthTracker) {
    return;
  }

  options.healthTracker.set(providerKey, healthCapability, {
    status,
    ...(code ? { sanitizedErrorCode: code } : {}),
    ...(status === 'ok' ? { lastSuccessAt: new Date() } : { lastFailureAt: new Date() }),
  });
};

export async function authenticateBluepay(
  options: BluepayClientOptions = {},
): Promise<BluepayAuthenticateResult> {
  const startedAt = Date.now();
  const resolved = resolveConfig(options);

  if (!resolved) {
    return buildAuthFailureResult({
      code: 'BLUEPAY_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      message: 'Provider configuration is incomplete',
    });
  }

  if ('disabled' in resolved) {
    return buildAuthFailureResult({
      code: 'BLUEPAY_PROVIDER_DISABLED',
      durationMs: getDurationMs(startedAt),
      message: 'Provider is disabled',
    });
  }

  return buildAuthFailureResult({
    code: 'BLUEPAY_AUTHENTICATION_NOT_IMPLEMENTED',
    durationMs: getDurationMs(startedAt),
    message:
      'BluePay OAuth2 client_credentials runtime is not implemented yet in this environment',
  });
}

export async function testBluepayConnection(
  options: BluepayClientOptions = {},
): Promise<BluepayRequestResult> {
  const startedAt = Date.now();
  const resolved = resolveConfig(options);

  if (!resolved) {
    updateHealth(options, 'healthCheck', 'down', 'BLUEPAY_CONFIGURATION_ERROR');
    return buildFailureResult({
      code: 'BLUEPAY_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'configuration_error',
      message: 'Provider configuration is incomplete',
    });
  }

  if ('disabled' in resolved) {
    updateHealth(options, 'healthCheck', 'disabled', 'BLUEPAY_PROVIDER_DISABLED');
    return buildFailureResult({
      code: 'BLUEPAY_PROVIDER_DISABLED',
      durationMs: getDurationMs(startedAt),
      externalStatus: 'disabled',
      message: 'Provider is disabled',
    });
  }

  if (resolved.healthPath) {
    try {
      const httpClient = createHttpClient(options, resolved.timeoutMs);
      const response = await httpClient.request(
        buildProviderUrl(resolved.baseUrl, resolved.healthPath),
        {
          method: 'GET',
          providerKey: BLUEPAY_PROVIDER_KEY,
          capability: 'healthCheck',
          ...(options.context ? { context: options.context } : {}),
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${resolved.clientId}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        updateHealth(options, 'healthCheck', 'ok');
        return {
          providerKey: BLUEPAY_PROVIDER_KEY,
          success: true,
          externalStatus: 'available',
          statusCode: response.status,
          durationMs: getDurationMs(startedAt),
        };
      }

      updateHealth(options, 'healthCheck', 'degraded', 'BLUEPAY_NOT_IMPLEMENTED');
    } catch {
      updateHealth(options, 'healthCheck', 'down', 'BLUEPAY_CONFIGURATION_ERROR');
      return buildFailureResult({
        code: 'BLUEPAY_CONFIGURATION_ERROR',
        durationMs: getDurationMs(startedAt),
        externalStatus: 'configuration_error',
        message: 'Provider configuration is incomplete',
      });
    }
  } else {
    updateHealth(options, 'healthCheck', 'degraded', 'BLUEPAY_NOT_IMPLEMENTED');
  }

  return buildFailureResult({
    code: 'BLUEPAY_NOT_IMPLEMENTED',
    durationMs: getDurationMs(startedAt),
    externalStatus: 'not_implemented',
    message: 'BluePay runtime foundation is not implemented yet',
  });
}

export async function createBluepayCommissionPayout(
  input: BluepayCommissionPayoutInput,
  options: BluepayClientOptions = {},
): Promise<BluepayCommissionPayoutResult> {
  const startedAt = Date.now();
  const resolved = resolveConfig(options);

  if (!resolved) {
    updateHealth(options, 'commissionPayout', 'down', 'BLUEPAY_CONFIGURATION_ERROR');
    return buildPayoutFailureResult({
      code: 'BLUEPAY_CONFIGURATION_ERROR',
      durationMs: getDurationMs(startedAt),
      message: 'Provider configuration is incomplete',
    });
  }

  if ('disabled' in resolved) {
    updateHealth(options, 'commissionPayout', 'disabled', 'BLUEPAY_PROVIDER_DISABLED');
    return buildPayoutFailureResult({
      code: 'BLUEPAY_PROVIDER_DISABLED',
      durationMs: getDurationMs(startedAt),
      message: 'Provider is disabled',
    });
  }

  const externalReference = input.commissionExternalIds
    .map((item) => item.trim())
    .filter(Boolean)
    .sort()
    .join('|');
  const idempotencyContract = options.idempotencyContract ?? new DefaultProviderIdempotencyContract();
  const runtime = new FinancialExecutionRuntime(
    new DefaultFinancialExecutionPolicy(),
    idempotencyContract,
  );
  const executionContext = {
    tenantId: options.context?.tenantId ?? '',
    providerKey: BLUEPAY_PROVIDER_KEY,
    executionType: 'commission_payout' as const,
    operation: 'createCommissionPayout',
    startedAt: new Date(),
    ...(externalReference ? { externalReference } : {}),
    ...(options.context?.metadata ? { metadata: options.context.metadata } : {}),
  };
  const idempotencyKey = runtime.createIdempotencyKey(executionContext);
  const runtimeResult = runtime.execute({
    ...executionContext,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  });

  if (!runtimeResult.allowed) {
    updateHealth(
      options,
      'commissionPayout',
      'degraded',
      runtimeResult.diagnostics.sanitizedErrorCode ?? 'BLUEPAY_NOT_IMPLEMENTED',
    );
    return buildPayoutFailureResult({
      code: 'BLUEPAY_NOT_IMPLEMENTED',
      durationMs: getDurationMs(startedAt),
      message: 'Commission payout runtime is not implemented yet',
    });
  }

  updateHealth(options, 'commissionPayout', 'degraded', 'BLUEPAY_NOT_IMPLEMENTED');

  return buildPayoutFailureResult({
    code: 'BLUEPAY_NOT_IMPLEMENTED',
    durationMs: getDurationMs(startedAt),
    message: 'Commission payout runtime is not implemented yet',
  });
}

export async function getBluepayCommissionPayoutStatus(
  _payoutBatchId: string,
  options: BluepayClientOptions = {},
): Promise<BluepayCommissionPayoutResult> {
  return createBluepayCommissionPayout(
    { commissionExternalIds: [] },
    options,
  );
}

export async function listBluepayCommissionPayouts(
  _filters?: Record<string, unknown>,
  options: BluepayClientOptions = {},
): Promise<BluepayCommissionPayoutResult> {
  return createBluepayCommissionPayout(
    { commissionExternalIds: [] },
    options,
  );
}
