import {
  providerCatalog,
  type CapabilitySupport,
  type IntegrationProviderKey,
  type ProviderCapabilities,
} from './provider-catalog.js';

export type {
  CapabilitySupport,
  IntegrationProviderKey,
  ProviderCapabilities,
};

export type ProviderCapabilityRegistryMap = Readonly<
  Record<IntegrationProviderKey, ProviderCapabilities>
>;

export const providerCapabilityRegistry: ProviderCapabilityRegistryMap =
  Object.fromEntries(
    providerCatalog.map((entry) => [entry.providerKey, entry.capabilities]),
  ) as ProviderCapabilityRegistryMap;

export class ProviderCapabilityRegistry {
  constructor(
    private readonly registry: ProviderCapabilityRegistryMap = providerCapabilityRegistry,
  ) {}

  get(providerKey: IntegrationProviderKey): ProviderCapabilities {
    return this.registry[providerKey];
  }

  supports(
    providerKey: IntegrationProviderKey,
    capability: keyof ProviderCapabilities,
  ): CapabilitySupport {
    return this.registry[providerKey][capability];
  }
}
