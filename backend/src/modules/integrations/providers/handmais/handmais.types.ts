export const HANDMAIS_PROVIDER_KEY = 'handmais' as const;

export type HandmaisProviderKey = typeof HANDMAIS_PROVIDER_KEY;

export type HandmaisConnectionErrorCode =
  | 'HANDMAIS_CONFIGURATION_ERROR'
  | 'HANDMAIS_TIMEOUT_INVALID'
  | 'HANDMAIS_AUTH_INVALID';

export type HandmaisConnectionDiagnostics = {
  providerKey: HandmaisProviderKey;
  requestId?: string;
  authConfigured: boolean;
  timeoutMs: number;
  environment: string;
  externalCall: false;
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

