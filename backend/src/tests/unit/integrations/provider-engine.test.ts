import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { ProviderNotFoundError } from '../../../modules/integrations/domain/errors/provider-not-found.error.js';
import { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';

const createProvider = (): IntegrationProvider => ({
  healthCheck: async () => true,
  testConnection: async () => ({
    connected: true,
    status: 200,
  }),
});

describe('ProviderEngine', () => {
  it('resolves an existing provider', () => {
    const provider = createProvider();
    const engine = new ProviderEngine({
      existing: provider,
    });

    expect(engine.resolve('existing')).toBe(provider);
  });

  it('throws ProviderNotFoundError for an unknown provider', () => {
    const engine = new ProviderEngine({});

    expect(() => engine.resolve('unknown')).toThrow(ProviderNotFoundError);
  });
});
