import type { IntegrationConnectionStatus } from '../domain/contracts/provider.contract.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';

export class TestIntegrationProviderConnectionUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string): Promise<IntegrationConnectionStatus> {
    try {
      const provider = this.providerEngine.resolve(providerName);
      const result = await provider.testConnection();

      if (!result.connected) {
        throw new ProviderConnectionError(providerName);
      }

      return result;
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
