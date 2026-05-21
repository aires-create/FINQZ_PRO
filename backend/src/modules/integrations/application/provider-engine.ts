import type { IntegrationProvider } from '../domain/contracts/provider.contract.js';

export type IntegrationProviderRegistry = Readonly<Record<string, IntegrationProvider>>;

export class ProviderEngine {
  constructor(
    private readonly registry: IntegrationProviderRegistry,
  ) {}

  resolve(providerName: string): IntegrationProvider {
    const provider = this.registry[providerName];

    if (!provider) {
      throw new Error(`Integration provider not registered: ${providerName}`);
    }

    return provider;
  }
}
