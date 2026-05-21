import type { IntegrationProposal } from '../../../modules/integrations/domain/contracts/integration-proposal.contract.js';
import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { ProviderCapabilityNotSupportedError } from '../../../modules/integrations/domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../../modules/integrations/domain/errors/provider-not-found.error.js';
import { ListIntegrationProviderProposalsUseCase } from '../../../modules/integrations/application/list-integration-provider-proposals.use-case.js';
import { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';

const proposal: IntegrationProposal = {
  externalId: 'PROP-1',
  customerName: 'Maria Silva',
  document: '12345678900',
  status: 'approved',
  amount: 1500,
  createdAt: '2026-05-21T00:00:00.000Z',
  providerKey: 'nova-promotora',
  rawStatus: 'Aprovada',
};

const createProvider = (
  overrides: Partial<IntegrationProvider> = {},
): IntegrationProvider => ({
  healthCheck: async () => true,
  testConnection: async () => ({
    connected: true,
    status: 200,
  }),
  ...overrides,
});

describe('ListIntegrationProviderProposalsUseCase', () => {
  it('returns normalized proposals from a provider capability', async () => {
    const useCase = new ListIntegrationProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          listProposals: async () => [proposal],
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).resolves.toEqual([
      proposal,
    ]);
  });

  it('throws ProviderNotFoundError for unknown providers', async () => {
    const useCase = new ListIntegrationProviderProposalsUseCase(
      new ProviderEngine({}),
    );

    await expect(useCase.execute('missing-provider')).rejects.toThrow(
      ProviderNotFoundError,
    );
  });

  it('throws ProviderCapabilityNotSupportedError when provider cannot list proposals', async () => {
    const useCase = new ListIntegrationProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider(),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderCapabilityNotSupportedError,
    );
  });

  it('normalizes unexpected provider failures as ProviderConnectionError', async () => {
    const useCase = new ListIntegrationProviderProposalsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          listProposals: async () => {
            throw new Error('raw token=secret body={sensitive}');
          },
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderConnectionError,
    );
  });
});
