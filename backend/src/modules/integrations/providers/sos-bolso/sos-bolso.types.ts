import type {
  MarginInquiryInput,
  MarginInquiryResult,
} from '../../domain/contracts/provider-capabilities.contract.js';
import type { IntegrationConnectionStatus } from '../../domain/contracts/provider.contract.js';
import type { ProviderExecutionContext } from '../../application/provider-execution-context.js';
import type { ProviderHealthTracker } from '../../application/provider-health-tracker.js';
import type { ProviderRetryPolicy } from '../../application/provider-retry-policy.js';

export const SOS_BOLSO_PROVIDER_KEY = 'sos-bolso' as const;

export type SosBolsoProviderKey = typeof SOS_BOLSO_PROVIDER_KEY;

export type SosBolsoExternalStatus =
  | 'available'
  | 'configuration_error'
  | 'network_error'
  | 'timeout'
  | 'unavailable';

export type SosBolsoExternalErrorCode =
  | 'SOS_BOLSO_CONFIGURATION_ERROR'
  | 'SOS_BOLSO_AUTHENTICATION_ERROR'
  | 'SOS_BOLSO_HTTP_ERROR'
  | 'SOS_BOLSO_NETWORK_ERROR'
  | 'SOS_BOLSO_TIMEOUT'
  | 'SOS_BOLSO_NOT_IMPLEMENTED';

export type SosBolsoSanitizedExternalError = {
  code: SosBolsoExternalErrorCode;
  message: string;
  status?: number;
};

export type SosBolsoRequestResult =
  | {
      providerKey: SosBolsoProviderKey;
      success: true;
      externalStatus: 'available';
      statusCode: number;
      durationMs: number;
    }
  | {
      providerKey: SosBolsoProviderKey;
      success: false;
      externalStatus: Exclude<SosBolsoExternalStatus, 'available'>;
      statusCode?: number;
      durationMs: number;
      error: SosBolsoSanitizedExternalError;
    };

export type SosBolsoMarginRequestInput = {
  convenioCnpj: string;
  customerCpf: string;
  enrollmentId: string;
};

export type SosBolsoMarginRequestResult =
  | {
      providerKey: SosBolsoProviderKey;
      success: true;
      data: MarginInquiryResult;
      durationMs: number;
    }
  | {
      providerKey: SosBolsoProviderKey;
      success: false;
      durationMs: number;
      error: SosBolsoSanitizedExternalError;
    };

export type SosBolsoClientOptions = {
  enabled?: boolean;
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  signedJwt?: string; // legacy bridge for existing tests/providers
  timeoutMs?: number;
  fetcher?: typeof fetch;
  healthPath?: string;
  tokenPath?: string;
  marginPath?: string;
  requestId?: string;
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
  providerRetryPolicy?: ProviderRetryPolicy;
};

export type SosBolsoConnectionStatus = IntegrationConnectionStatus;

export type SosBolsoMarginInput = MarginInquiryInput;

export type SosBolsoAuthenticateResult =
  | {
      providerKey: SosBolsoProviderKey;
      success: true;
      accessToken: string;
      expiresIn: number;
      expiresAt: number;
      durationMs: number;
    }
  | {
      providerKey: SosBolsoProviderKey;
      success: false;
      durationMs: number;
      statusCode?: number;
      error: SosBolsoSanitizedExternalError;
    };
