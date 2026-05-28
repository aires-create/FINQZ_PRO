import {
  providerCapabilityRegistry,
  type ProviderCapabilities,
  type IntegrationProviderKey,
} from './provider-capability-registry.js';

export type ProviderCatalogStatus = 'active' | 'planned' | 'legacy' | 'experimental';

export type ProviderCatalogItem = {
  providerKey: string;
  displayName: string;
  category: string;
  capabilities: ProviderCapabilities;
  status: ProviderCatalogStatus;
  technicalPlatform?: string;
  systemUrl?: string;
};

const providerCatalogMeta: Record<
  IntegrationProviderKey,
  Pick<ProviderCatalogItem, 'displayName' | 'category' | 'status' | 'technicalPlatform' | 'systemUrl'>
> = {
  'nova-promotora': {
    displayName: 'NOVA PROMOTORA',
    category: 'credito',
    status: 'active',
    technicalPlatform: 'STORM Tecnologia',
    systemUrl: 'sistema.novafinanceira.com',
  },
  'sos-bolso': {
    displayName: 'SOS BOLSO',
    category: 'credito',
    status: 'planned',
  },
  handmais: {
    displayName: 'HANDMAIS',
    category: 'credito',
    status: 'experimental',
  },
  'hand-plus': {
    displayName: 'HAND+',
    category: 'credito',
    status: 'planned',
  },
  'nova-vida-ti': {
    displayName: 'NOVA VIDA TI',
    category: 'higienizacao',
    status: 'planned',
  },
  'whatsapp-business': {
    displayName: 'WhatsApp Business',
    category: 'mensageria',
    status: 'planned',
  },
  bluepay: {
    displayName: 'BLUEPAY',
    category: 'pagamentos',
    status: 'planned',
  },
  'bulk-messaging': {
    displayName: 'SMS/WhatsApp em Massa',
    category: 'mensageria',
    status: 'planned',
  },
};

export class ListProviderCapabilitiesUseCase {
  execute(): ProviderCatalogItem[] {
    const providers = (Object.keys(providerCapabilityRegistry) as IntegrationProviderKey[]).map(
      (providerKey) => {
        const meta = providerCatalogMeta[providerKey];
        const capabilities = providerCapabilityRegistry[providerKey];

        return {
          providerKey,
          displayName: meta.displayName,
          category: meta.category,
          status: meta.status,
          capabilities,
        };
      },
    );

    return providers;
  }
}
