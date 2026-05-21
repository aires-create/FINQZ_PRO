import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import type { IntegrationProposal } from '../../domain/contracts/integration-proposal.contract.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { createModuleLogger } from '../../../../shared/logger.js';
import {
  listNovaPromotoraProposals,
  testNovaPromotoraConnection,
} from './nova-promotora.client.js';
import { mapNovaPromotoraProposalsPayload } from './nova-promotora.mapper.js';
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

export class NovaPromotoraService implements IntegrationProvider {
  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();

      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<NovaPromotoraConnectionStatus> {
    const result = await testNovaPromotoraConnection();

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
    const result = await listNovaPromotoraProposals();

    logProposalsResult(result);

    if (!result.success) {
      if (result.error.code === 'NOVA_PROMOTORA_CONFIGURATION_ERROR') {
        throw new ProviderConfigurationError(NOVA_PROMOTORA_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(NOVA_PROMOTORA_PROVIDER_KEY);
    }

    return mapNovaPromotoraProposalsPayload(result.data);
  }
}
