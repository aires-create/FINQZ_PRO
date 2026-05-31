import {
  getProviderCatalogByScope,
  type ProviderCatalogEntry,
  type ProviderCatalogStatus,
  type ProviderCapabilities,
} from './provider-catalog.js';

export type ProviderCatalogScope = 'all' | 'runtime' | 'planned';
export type { ProviderCatalogStatus };

export type ProviderCatalogItem = {
  providerKey: string;
  displayName: string;
  category: string;
  capabilities: ProviderCapabilities;
  status: ProviderCatalogStatus;
  technicalPlatform?: string;
  systemUrl?: string;
};

export class ListProviderCapabilitiesUseCase {
  execute(scope: ProviderCatalogScope = 'all'): ProviderCatalogItem[] {
    const catalogEntries = getProviderCatalogByScope(scope) as readonly ProviderCatalogEntry[];

    return catalogEntries.map((provider) => {
      const item: ProviderCatalogItem = {
        providerKey: provider.providerKey,
        displayName: provider.displayName,
        category: provider.category,
        status: provider.status,
        capabilities: provider.capabilities,
      };

      if (provider.technicalPlatform !== undefined) {
        item.technicalPlatform = provider.technicalPlatform;
      }

      if (provider.systemUrl !== undefined) {
        item.systemUrl = provider.systemUrl;
      }

      return item;
    });
  }
}
