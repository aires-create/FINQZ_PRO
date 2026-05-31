import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';

type ProviderPayloadDiagnosticsReader = {
  getPayloadDiagnostics: () => Promise<unknown>;
};

const hasPayloadDiagnosticsReader = (
  provider: unknown,
): provider is ProviderPayloadDiagnosticsReader => {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'getPayloadDiagnostics' in provider &&
    typeof provider.getPayloadDiagnostics === 'function'
  );
};

export class GetProviderPayloadDiagnosticsUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string): Promise<unknown> {
    try {
      const provider = this.providerEngine.resolve(providerName);

      if (!hasPayloadDiagnosticsReader(provider)) {
        throw new ProviderCapabilityNotSupportedError(
          providerName,
          'getPayloadDiagnostics',
        );
      }

      return await provider.getPayloadDiagnostics();
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
