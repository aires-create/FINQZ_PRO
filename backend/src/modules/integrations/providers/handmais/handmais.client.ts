import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker, ProviderHealthStatus } from '../../application/provider-health-tracker.js';
import { HANDMAIS_PROVIDER_KEY, type HandmaisConnectionResult } from './handmais.types.js';

type HandmaisClientOptions = {
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
};

const DEFAULT_TIMEOUT_MS = 15000;

const toPositiveTimeout = (rawValue: string | undefined): number => {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
};

const getEnvironment = (value: string | undefined): string =>
  value?.trim() || 'sandbox';

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

  const diagnostics = {
    providerKey: HANDMAIS_PROVIDER_KEY,
    ...(options.context?.requestId ? { requestId: options.context.requestId } : {}),
    authConfigured: Boolean(apiKey),
    timeoutMs,
    environment,
    externalCall: false as const,
  };

  if (!baseUrl) {
    updateHealth(options, 'down', 'HANDMAIS_CONFIGURATION_ERROR');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics,
      error: { code: 'HANDMAIS_CONFIGURATION_ERROR' },
    };
  }

  if (!apiKey) {
    updateHealth(options, 'down', 'HANDMAIS_AUTH_INVALID');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics,
      error: { code: 'HANDMAIS_AUTH_INVALID' },
    };
  }

  if (timeoutRaw && (!Number.isFinite(Number(timeoutRaw)) || Number(timeoutRaw) <= 0)) {
    updateHealth(options, 'down', 'HANDMAIS_TIMEOUT_INVALID');
    return {
      success: false,
      providerKey: HANDMAIS_PROVIDER_KEY,
      diagnostics,
      error: { code: 'HANDMAIS_TIMEOUT_INVALID' },
    };
  }

  // Skeleton-only connectivity prep: no external request is executed in this phase.
  updateHealth(options, 'degraded', 'HANDMAIS_EXPERIMENTAL_RUNTIME');
  return {
    success: true,
    providerKey: HANDMAIS_PROVIDER_KEY,
    statusCode: 200,
    diagnostics,
    message: 'HANDMAIS connectivity skeleton ready (no external call executed)',
  };
};

