import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import type { FinancialProposal } from '../../domain/contracts/financial-proposal/financial-proposal.contract.js';
import type { FinancialProposalReader } from '../../domain/contracts/financial-proposal/financial-proposal-reader.contract.js';
import type { IntegrationProposal } from '../../domain/contracts/integration-proposal.contract.js';
import type { ProviderRuntimeOptions } from '../../application/provider-engine.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { createModuleLogger } from '../../../../shared/logger.js';
import {
  listNovaPromotoraProposals,
  testNovaPromotoraConnection,
} from './nova-promotora.client.js';
import {
  mapNovaPromotoraFinancialProposalsPayload,
  mapNovaPromotoraProposalsPayload,
} from './nova-promotora.mapper.js';
import { analyzeNovaPromotoraPayload } from './nova-promotora.payload-diagnostics.js';
import {
  NOVA_PROMOTORA_PROVIDER_KEY,
  type NovaPromotoraConnectionStatus,
  type NovaPromotoraProposalsRequestResult,
  type NovaPromotoraRequestResult,
} from './nova-promotora.types.js';

const logger = createModuleLogger('integrations.nova-promotora');

const logConnectionResult = (result: NovaPromotoraRequestResult) => {
  const meta = {
    providerKey: result.providerKey,
    status: result.statusCode ?? result.externalStatus,
    durationMs: result.durationMs,
    success: result.success,
  };

  if (result.success) {
    logger.info('Provider health check completed', meta);
    return;
  }

  logger.warn('Provider health check failed', meta);
};

const logProposalsResult = (result: NovaPromotoraProposalsRequestResult) => {
  const meta = {
    providerKey: result.providerKey,
    status: result.statusCode ?? result.externalStatus,
    durationMs: result.durationMs,
    success: result.success,
  };

  if (result.success) {
    logger.info('Provider proposals discovery completed', meta);
    return;
  }

  logger.warn('Provider proposals discovery failed', meta);
};

export class NovaPromotoraService
  implements IntegrationProvider, FinancialProposalReader
{
  constructor(private readonly runtime?: ProviderRuntimeOptions) {}

  bindRuntime(runtime: ProviderRuntimeOptions): IntegrationProvider {
    return new NovaPromotoraService(runtime);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();

      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<NovaPromotoraConnectionStatus> {
    const result = await testNovaPromotoraConnection({
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
      ...(this.runtime?.providerRetryPolicy
        ? { providerRetryPolicy: this.runtime.providerRetryPolicy }
        : {}),
    });

    logConnectionResult(result);

    if (!result.success) {
      throw new ProviderConnectionError(NOVA_PROMOTORA_PROVIDER_KEY);
    }

    return {
      connected: true,
      status: result.statusCode,
    };
  }

  async listProposals(): Promise<IntegrationProposal[]> {
    const result = await this.loadProposalsResult();
    return mapNovaPromotoraProposalsPayload(result.data);
  }

  async listFinancialProposals(): Promise<FinancialProposal[]> {
    const result = await this.loadProposalsResult();
    return mapNovaPromotoraFinancialProposalsPayload(result.data);
  }

  async getPayloadDiagnostics(): Promise<ReturnType<typeof analyzeNovaPromotoraPayload>> {
    const result = await this.loadProposalsResult();
    return analyzeNovaPromotoraPayload(result.data);
  }

  private async loadProposalsResult(): Promise<Extract<NovaPromotoraProposalsRequestResult, { success: true }>> {
    const result = await listNovaPromotoraProposals({
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
      ...(this.runtime?.providerRetryPolicy
        ? { providerRetryPolicy: this.runtime.providerRetryPolicy }
        : {}),
    });

    logProposalsResult(result);

    if (!result.success) {
      if (result.error.code === 'NOVA_PROMOTORA_CONFIGURATION_ERROR') {
        throw new ProviderConfigurationError(NOVA_PROMOTORA_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(NOVA_PROMOTORA_PROVIDER_KEY);
    }

    return result;
  }
}
