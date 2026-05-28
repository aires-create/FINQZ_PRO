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

export type HandmaisInitialSimulationRequest = {
  cpf: string;
  matricula: string;
};

export type HandmaisNormalizedInitialSimulationResult = {
  cpfMasked: string;
  matricula: string;
  cnpj?: string;
  availableMargin?: number;
  providerStatusCode: number;
  providerMessage?: string;
  requestId?: string;
  consultedAt: string;
};

export type HandmaisInitialSimulationDiagnostics = {
  providerKey: HandmaisProviderKey;
  requestId?: string;
  endpoint: string;
  externalCall: true;
  latencyMs?: number;
  authValidated: boolean;
  connectivityStatus: 'ok' | 'degraded' | 'down';
  timeoutStatus: 'ok' | 'timeout';
  providerStatusCode?: number;
  normalizedProviderError?: string;
};

export type HandmaisInitialSimulationErrorCode =
  | 'HANDMAIS_INVALID_CPF'
  | 'HANDMAIS_INVALID_MATRICULA'
  | 'HANDMAIS_TIMEOUT_ERROR'
  | 'HANDMAIS_AUTH_INVALID'
  | 'HANDMAIS_NETWORK_ERROR'
  | 'HANDMAIS_PROVIDER_UNAVAILABLE'
  | 'HANDMAIS_INVALID_RESPONSE';

export type HandmaisInitialSimulationResult =
  | {
      success: true;
      providerKey: HandmaisProviderKey;
      data: HandmaisNormalizedInitialSimulationResult;
      diagnostics: HandmaisInitialSimulationDiagnostics;
    }
  | {
      success: false;
      providerKey: HandmaisProviderKey;
      diagnostics: HandmaisInitialSimulationDiagnostics;
      error: {
        code: HandmaisInitialSimulationErrorCode;
      };
    };
