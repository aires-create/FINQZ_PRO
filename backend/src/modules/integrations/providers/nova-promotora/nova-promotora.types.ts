import type { IntegrationConnectionStatus } from '../../domain/contracts/provider.contract.js';

export const NOVA_PROMOTORA_PROVIDER_KEY = 'nova-promotora' as const;

export type NovaPromotoraProviderKey = typeof NOVA_PROMOTORA_PROVIDER_KEY;

export type NovaPromotoraExternalStatus =
  | 'available'
  | 'configuration_error'
  | 'network_error'
  | 'timeout'
  | 'unavailable';

export type NovaPromotoraExternalErrorCode =
  | 'NOVA_PROMOTORA_CONFIGURATION_ERROR'
  | 'NOVA_PROMOTORA_HTTP_ERROR'
  | 'NOVA_PROMOTORA_NETWORK_ERROR'
  | 'NOVA_PROMOTORA_TIMEOUT';

export type NovaPromotoraSanitizedExternalError = {
  code: NovaPromotoraExternalErrorCode;
  message: string;
  status?: number;
};

export type NovaPromotoraRequestResult =
  | {
      providerKey: NovaPromotoraProviderKey;
      success: true;
      externalStatus: 'available';
      statusCode: number;
      durationMs: number;
    }
  | {
      providerKey: NovaPromotoraProviderKey;
      success: false;
      externalStatus: Exclude<NovaPromotoraExternalStatus, 'available'>;
      statusCode?: number;
      durationMs: number;
      error: NovaPromotoraSanitizedExternalError;
    };

export type NovaPromotoraClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
  healthPath?: string;
  timeoutMs?: number;
};

export type NovaPromotoraConnectionStatus = IntegrationConnectionStatus;
