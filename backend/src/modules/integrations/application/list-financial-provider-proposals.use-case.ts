import {
  hasFinancialProposalReader,
} from '../domain/contracts/financial-proposal/financial-proposal-reader.contract.js';
import type { FinancialProposal } from '../domain/contracts/financial-proposal/financial-proposal.contract.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';

export class ListFinancialProviderProposalsUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string): Promise<FinancialProposal[]> {
    try {
      const provider = this.providerEngine.resolve(providerName);

      if (!hasFinancialProposalReader(provider)) {
        throw new ProviderCapabilityNotSupportedError(
          providerName,
          'listFinancialProposals',
        );
      }

      return await provider.listFinancialProposals();
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
