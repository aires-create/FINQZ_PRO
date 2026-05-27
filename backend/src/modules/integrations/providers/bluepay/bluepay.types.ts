import type {
  CommissionPayoutInput,
  CommissionPayoutResult,
} from '../../domain/contracts/commission-payout.contract.js';
import type { IntegrationConnectionStatus } from '../../domain/contracts/provider.contract.js';
import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker } from '../../application/provider-health-tracker.js';
import type { ProviderIdempotencyContract } from '../../application/provider-idempotency-contract.js';
import type { ProviderRetryPolicy } from '../../application/provider-retry-policy.js';

export const BLUEPAY_PROVIDER_KEY = 'bluepay' as const;

export type BluepayProviderKey = typeof BLUEPAY_PROVIDER_KEY;

export type BluepayExternalStatus =
  | 'available'
  | 'configuration_error'
  | 'disabled'
  | 'not_implemented';

export type BluepayExternalErrorCode =
  | 'BLUEPAY_CONFIGURATION_ERROR'
  | 'BLUEPAY_PROVIDER_DISABLED'
  | 'BLUEPAY_AUTHENTICATION_NOT_IMPLEMENTED'
  | 'BLUEPAY_NOT_IMPLEMENTED';

export type BluepaySanitizedExternalError = {
  code: BluepayExternalErrorCode;
  message: string;
  status?: number;
};

export type BluepayRequestResult =
  | {
      providerKey: BluepayProviderKey;
      success: true;
      externalStatus: 'available';
      statusCode: number;
      durationMs: number;
    }
  | {
      providerKey: BluepayProviderKey;
      success: false;
      externalStatus: Exclude<BluepayExternalStatus, 'available'>;
      durationMs: number;
      error: BluepaySanitizedExternalError;
    };

export type BluepayClientOptions = {
  enabled?: boolean;
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  requestId?: string;
  healthPath?: string;
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
  providerRetryPolicy?: ProviderRetryPolicy;
  idempotencyContract?: ProviderIdempotencyContract;
};

export type BluepayConnectionStatus = IntegrationConnectionStatus;

export type BluepayAuthenticateResult =
  | {
      providerKey: BluepayProviderKey;
      success: true;
      accessToken: string;
      expiresIn: number;
      expiresAt: number;
      durationMs: number;
    }
  | {
      providerKey: BluepayProviderKey;
      success: false;
      durationMs: number;
      error: BluepaySanitizedExternalError;
    };

export type BluepayCommissionPayoutInput = CommissionPayoutInput;

export type BluepayCommissionPayoutResult =
  | {
      providerKey: BluepayProviderKey;
      success: true;
      data: CommissionPayoutResult;
      durationMs: number;
    }
  | {
      providerKey: BluepayProviderKey;
      success: false;
      durationMs: number;
      error: BluepaySanitizedExternalError;
    };
