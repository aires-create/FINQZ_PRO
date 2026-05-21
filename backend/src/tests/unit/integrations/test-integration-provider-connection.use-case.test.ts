import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';
import { TestIntegrationProviderConnectionUseCase } from '../../../modules/integrations/application/test-integration-provider-connection.use-case.js';

const createUseCase = (provider: IntegrationProvider) => {
  return new TestIntegrationProviderConnectionUseCase(
    new ProviderEngine({
      'nova-promotora': provider,
    }),
  );
};

describe('TestIntegrationProviderConnectionUseCase', () => {
  it('returns a normalized success response', async () => {
    const useCase = createUseCase({
      healthCheck: async () => true,
      testConnection: async () => ({
        connected: true,
        status: 200,
      }),
    });

    await expect(useCase.execute('nova-promotora')).resolves.toEqual({
      connected: true,
      status: 200,
    });
  });

  it('transforms external connection failures into ProviderConnectionError', async () => {
    const useCase = createUseCase({
      healthCheck: async () => false,
      testConnection: async () => ({
        connected: false,
        status: 503,
        error: 'raw external provider failure',
      }),
    });

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderConnectionError,
    );
  });

  it('normalizes unexpected provider exceptions as ProviderConnectionError', async () => {
    const useCase = createUseCase({
      healthCheck: async () => false,
      testConnection: async () => {
        throw new Error('raw external exception');
      },
    });

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderConnectionError,
    );
  });
});
