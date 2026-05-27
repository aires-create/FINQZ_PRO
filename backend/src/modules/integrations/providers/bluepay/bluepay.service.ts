import type { CommissionPayoutProvider, CommissionPayoutInput, CommissionPayoutResult } from '../../domain/contracts/commission-payout.contract.js';
import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import type { ProviderRuntimeOptions } from '../../application/provider-engine.js';
import { ProviderCapabilityNotSupportedError } from '../../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { createModuleLogger } from '../../../../shared/logger.js';
import {
  createBluepayCommissionPayout,
  getBluepayCommissionPayoutStatus,
  listBluepayCommissionPayouts,
  testBluepayConnection,
} from './bluepay.client.js';
import { BLUEPAY_PROVIDER_KEY, type BluepayConnectionStatus } from './bluepay.types.js';

const logger = createModuleLogger('integrations.bluepay');

export class BluepayService
  implements IntegrationProvider, CommissionPayoutProvider
{
  constructor(private readonly runtime?: ProviderRuntimeOptions) {}

  bindRuntime(runtime: ProviderRuntimeOptions): IntegrationProvider {
    return new BluepayService(runtime);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<BluepayConnectionStatus> {
    const result = await testBluepayConnection({
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
      ...(this.runtime?.providerRetryPolicy
        ? { providerRetryPolicy: this.runtime.providerRetryPolicy }
        : {}),
    });

    if (!result.success) {
      logger.warn('Provider health check failed', {
        providerKey: result.providerKey,
        durationMs: result.durationMs,
        errorCode: result.error.code,
      });

      if (
        result.error.code === 'BLUEPAY_CONFIGURATION_ERROR' ||
        result.error.code === 'BLUEPAY_PROVIDER_DISABLED'
      ) {
        throw new ProviderConfigurationError(BLUEPAY_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(BLUEPAY_PROVIDER_KEY);
    }

    return {
      connected: true,
      status: result.statusCode,
    };
  }

  async createCommissionPayout(input: CommissionPayoutInput): Promise<CommissionPayoutResult> {
    const runtimeContext = this.runtime?.context
      ? {
          ...this.runtime.context,
          providerKey: BLUEPAY_PROVIDER_KEY,
          capability: 'commissionPayout',
          operation: 'createCommissionPayout',
          startedAt: new Date(),
        }
      : undefined;
    const result = await createBluepayCommissionPayout(input, {
      ...(runtimeContext ? { context: runtimeContext } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
      ...(this.runtime?.providerRetryPolicy
        ? { providerRetryPolicy: this.runtime.providerRetryPolicy }
        : {}),
    });

    if (!result.success) {
      logger.warn('Provider commission payout failed', {
        providerKey: result.providerKey,
        durationMs: result.durationMs,
        errorCode: result.error.code,
      });

      if (
        result.error.code === 'BLUEPAY_CONFIGURATION_ERROR' ||
        result.error.code === 'BLUEPAY_PROVIDER_DISABLED'
      ) {
        throw new ProviderConfigurationError(BLUEPAY_PROVIDER_KEY);
      }

      throw new ProviderCapabilityNotSupportedError(
        BLUEPAY_PROVIDER_KEY,
        'commissionPayout',
      );
    }

    return result.data;
  }

  async getCommissionPayoutStatus(payoutBatchId: string): Promise<CommissionPayoutResult> {
    const result = await getBluepayCommissionPayoutStatus(payoutBatchId);
    if (!result.success) {
      throw new ProviderCapabilityNotSupportedError(
        BLUEPAY_PROVIDER_KEY,
        'commissionPayout',
      );
    }
    return result.data;
  }

  async listCommissionPayouts(filters?: Record<string, unknown>): Promise<CommissionPayoutResult> {
    const result = await listBluepayCommissionPayouts(filters);
    if (!result.success) {
      throw new ProviderCapabilityNotSupportedError(
        BLUEPAY_PROVIDER_KEY,
        'commissionPayout',
      );
    }
    return result.data;
  }
}
