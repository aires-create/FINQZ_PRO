import { GetProviderPayloadDiagnosticsUseCase } from '../../../modules/integrations/application/get-provider-payload-diagnostics.use-case.js';
import { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';
import { ProviderCapabilityNotSupportedError } from '../../../modules/integrations/domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderConfigurationError } from '../../../modules/integrations/domain/errors/provider-configuration.error.js';
import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';

const createProvider = (
  overrides: Partial<
    IntegrationProvider & { getPayloadDiagnostics: () => Promise<unknown> }
  > = {},
): IntegrationProvider => ({
  healthCheck: async () => true,
  testConnection: async () => ({
    connected: true,
    status: 200,
  }),
  ...overrides,
});

describe('GetProviderPayloadDiagnosticsUseCase', () => {
  it('returns diagnostics for nova-promotora provider', async () => {
    const useCase = new GetProviderPayloadDiagnosticsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          getPayloadDiagnostics: async () => ({
            providerKey: 'nova-promotora',
            totalRecords: 1,
          }),
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).resolves.toEqual({
      providerKey: 'nova-promotora',
      totalRecords: 1,
    });
  });

  it('throws ProviderCapabilityNotSupportedError when provider has no capability', async () => {
    const useCase = new GetProviderPayloadDiagnosticsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider(),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toThrow(
      ProviderCapabilityNotSupportedError,
    );
  });

  it('preserves IntegrationError', async () => {
    const useCase = new GetProviderPayloadDiagnosticsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          getPayloadDiagnostics: async () => {
            throw new ProviderConfigurationError('nova-promotora');
          },
        }),
      }),
    );

    await expect(useCase.execute('nova-promotora')).rejects.toBeInstanceOf(
      ProviderConfigurationError,
    );
  });

  it('maps generic errors to ProviderConnectionError', async () => {
    const useCase = new GetProviderPayloadDiagnosticsUseCase(
      new ProviderEngine({
        'nova-promotora': createProvider({
          getPayloadDiagnostics: async () => {
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
