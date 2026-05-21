import {
  hasIntegrationProposalReader,
  type IntegrationProposal,
} from '../domain/contracts/integration-proposal.contract.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';

export class ListIntegrationProviderProposalsUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string): Promise<IntegrationProposal[]> {
    try {
      const provider = this.providerEngine.resolve(providerName);

      if (!hasIntegrationProposalReader(provider)) {
        throw new ProviderCapabilityNotSupportedError(
          providerName,
          'listProposals',
        );
      }

      return await provider.listProposals();
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
