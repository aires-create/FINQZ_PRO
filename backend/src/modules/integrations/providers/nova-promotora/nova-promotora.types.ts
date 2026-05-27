import type { IntegrationConnectionStatus } from '../../domain/contracts/provider.contract.js';
import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker } from '../../application/provider-health-tracker.js';
import type { ProviderRetryPolicy } from '../../application/provider-retry-policy.js';

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
  | 'NOVA_PROMOTORA_RESPONSE_ERROR'
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

export type NovaPromotoraProposalsRequestResult =
  | {
      providerKey: NovaPromotoraProviderKey;
      success: true;
      externalStatus: 'available';
      statusCode: number;
      durationMs: number;
      data: unknown;
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
  proposalsPath?: string;
  timeoutMs?: number;
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
  providerRetryPolicy?: ProviderRetryPolicy;
};

export type NovaPromotoraConnectionStatus = IntegrationConnectionStatus;
