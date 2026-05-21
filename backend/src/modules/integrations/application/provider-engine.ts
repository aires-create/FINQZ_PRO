import type { IntegrationProvider } from '../domain/contracts/provider.contract.js';
import { ProviderNotFoundError } from '../domain/errors/provider-not-found.error.js';

export type IntegrationProviderRegistry = Readonly<Record<string, IntegrationProvider>>;

export class ProviderEngine {
  constructor(
    private readonly registry: IntegrationProviderRegistry,
  ) {}

  resolve(providerName: string): IntegrationProvider {
    const provider = this.registry[providerName];

    if (!provider) {
      throw new ProviderNotFoundError(providerName);
    }

    return provider;
  }
}
