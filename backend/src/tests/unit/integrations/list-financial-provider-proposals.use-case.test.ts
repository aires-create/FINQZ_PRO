import type { FinancialProposal } from '../../../modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.js';
import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { IntegrationError } from '../../../modules/integrations/domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../../../modules/integrations/domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ListFinancialProviderProposalsUseCase } from '../../../modules/integrations/application/list-financial-provider-proposals.use-case.js';
import { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';

const financialProposal: FinancialProposal = {
  proposalId: 'proposal-1',
  providerKey: 'nova-promotora',
  externalProposalId: 'EXT-1',
  customerDocument: '12345678900',
  bank: 'BANCO PAN',
  product: 'CONSIGNADO',
  status: 'APPROVED',
};

const createProvider = (
  overrides: Partial<IntegrationProvider & { listFinancialProposals: () => Promise<FinancialProposal[]> }> = {},
): IntegrationProvider => ({
  healthCheck: async () => true,
  testConnection: async () => ({
    connected: true,
    status: 200,
  }),
  ...overrides,
});

describe('ListFinancialProviderProposalsUseCase', () => {
  it('returns financial proposals when provider supports FinancialProposalReader', async () => {
    const useCase = new ListFinancialProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          listFinancialProposals: async () => [financialProposal],
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).resolves.toEqual([
      financialProposal,
    ]);
  });

  it('throws ProviderCapabilityNotSupportedError when provider does not support FinancialProposalReader', async () => {
    const useCase = new ListFinancialProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider(),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderCapabilityNotSupportedError,
    );
  });

  it('preserves IntegrationError from provider', async () => {
    const useCase = new ListFinancialProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          listFinancialProposals: async () => {
            throw new ProviderCapabilityNotSupportedError(
              'nova-promotora',
              'listFinancialProposals',
            );
          },
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toBeInstanceOf(
      IntegrationError,
    );
  });

  it('maps generic errors to ProviderConnectionError', async () => {
    const useCase = new ListFinancialProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          listFinancialProposals: async () => {
            throw new Error('raw error');
          },
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderConnectionError,
    );
  });
});
