import type { IntegrationConnectionStatus } from '../domain/contracts/provider.contract.js';
import type { ProviderEngine } from './provider-engine.js';

export class TestIntegrationProviderConnectionUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string): Promise<IntegrationConnectionStatus> {
    const provider = this.providerEngine.resolve(providerName);

    return provider.testConnection();
  }
}
