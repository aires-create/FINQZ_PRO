export const HANDMAIS_PROVIDER_KEY = 'handmais' as const;

export type HandmaisProviderKey = typeof HANDMAIS_PROVIDER_KEY;

export type HandmaisConnectionErrorCode =
  | 'HANDMAIS_CONFIGURATION_ERROR'
  | 'HANDMAIS_TIMEOUT_INVALID'
  | 'HANDMAIS_AUTH_INVALID'
  | 'HANDMAIS_TIMEOUT_ERROR'
  | 'HANDMAIS_NETWORK_ERROR'
  | 'HANDMAIS_INVALID_RESPONSE'
  | 'HANDMAIS_PROVIDER_UNAVAILABLE';

export type HandmaisConnectionDiagnostics = {
  providerKey: HandmaisProviderKey;
  requestId?: string;
  authConfigured: boolean;
  authValidated: boolean;
  connectivityStatus: 'ok' | 'degraded' | 'down';
  timeoutStatus: 'ok' | 'invalid' | 'timeout';
  timeoutMs: number;
  latencyMs?: number;
  endpoint: string;
  httpStatus?: number;
  normalizedProviderError?: string;
  environment: string;
  externalCall: boolean;
};

export type HandmaisConnectionResult =
  | {
      success: true;
      providerKey: HandmaisProviderKey;
      statusCode: number;
      diagnostics: HandmaisConnectionDiagnostics;
      message: string;
    }
  | {
      success: false;
      providerKey: HandmaisProviderKey;
      diagnostics: HandmaisConnectionDiagnostics;
      error: {
        code: HandmaisConnectionErrorCode;
      };
    };
