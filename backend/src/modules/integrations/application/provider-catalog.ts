export type IntegrationProviderKey =
  | 'sos-bolso'
  | 'handmais'
  | 'hand-plus'
  | 'nova-vida-ti'
  | 'whatsapp-business'
  | 'bluepay'
  | 'bulk-messaging';

export type CapabilitySupport = boolean | 'planned';

export type ProviderCapabilities = {
  initialSimulation: CapabilitySupport;
  marginInquiry: CapabilitySupport;
  rateTables: CapabilitySupport;
  proposalPipeline: CapabilitySupport;
  commissions: CapabilitySupport;
  commissionPayout: CapabilitySupport;
  dataEnrichment: CapabilitySupport;
  messageSender: CapabilitySupport;
  bulkMessaging: CapabilitySupport;
  webhooks: CapabilitySupport;
};

export type ProviderCatalogStatus = 'active' | 'planned' | 'legacy' | 'experimental';
export type ProviderCatalogLifecycle = 'runtime' | 'planned';

export type ProviderCatalogEntry = {
  providerKey: IntegrationProviderKey;
  displayName: string;
  category: string;
  status: ProviderCatalogStatus;
  lifecycle: ProviderCatalogLifecycle;
  capabilities: ProviderCapabilities;
  technicalPlatform?: string;
  systemUrl?: string;
};

export const providerCatalog = [
  {
    providerKey: 'sos-bolso',
    displayName: 'SOS BOLSO',
    category: 'credito',
    status: 'active',
    lifecycle: 'runtime',
    capabilities: {
      initialSimulation: false,
      marginInquiry: 'planned',
      rateTables: 'planned',
      proposalPipeline: 'planned',
      commissions: 'planned',
      commissionPayout: false,
      dataEnrichment: 'planned',
      messageSender: false,
      bulkMessaging: false,
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'handmais',
    displayName: 'HANDMAIS',
    category: 'credito',
    status: 'experimental',
    lifecycle: 'runtime',
    capabilities: {
      initialSimulation: true,
      marginInquiry: 'planned',
      rateTables: 'planned',
      proposalPipeline: 'planned',
      commissions: false,
      commissionPayout: false,
      dataEnrichment: false,
      messageSender: false,
      bulkMessaging: false,
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'bluepay',
    displayName: 'BLUEPAY',
    category: 'pagamentos',
    status: 'active',
    lifecycle: 'runtime',
    capabilities: {
      initialSimulation: false,
      marginInquiry: false,
      rateTables: false,
      proposalPipeline: false,
      commissions: 'planned',
      commissionPayout: 'planned',
      dataEnrichment: false,
      messageSender: false,
      bulkMessaging: false,
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'hand-plus',
    displayName: 'HAND+',
    category: 'credito',
    status: 'planned',
    lifecycle: 'planned',
    capabilities: {
      initialSimulation: 'planned',
      marginInquiry: 'planned',
      rateTables: 'planned',
      proposalPipeline: 'planned',
      commissions: 'planned',
      commissionPayout: false,
      dataEnrichment: 'planned',
      messageSender: 'planned',
      bulkMessaging: false,
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'nova-vida-ti',
    displayName: 'NOVA VIDA TI',
    category: 'higienizacao',
    status: 'planned',
    lifecycle: 'planned',
    capabilities: {
      initialSimulation: false,
      marginInquiry: 'planned',
      rateTables: 'planned',
      proposalPipeline: 'planned',
      commissions: 'planned',
      commissionPayout: false,
      dataEnrichment: 'planned',
      messageSender: false,
      bulkMessaging: false,
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'whatsapp-business',
    displayName: 'WhatsApp Business',
    category: 'mensageria',
    status: 'planned',
    lifecycle: 'planned',
    capabilities: {
      initialSimulation: false,
      marginInquiry: false,
      rateTables: false,
      proposalPipeline: false,
      commissions: false,
      commissionPayout: false,
      dataEnrichment: false,
      messageSender: 'planned',
      bulkMessaging: 'planned',
      webhooks: 'planned',
    },
  },
  {
    providerKey: 'bulk-messaging',
    displayName: 'SMS/WhatsApp em Massa',
    category: 'mensageria',
    status: 'planned',
    lifecycle: 'planned',
    capabilities: {
      initialSimulation: false,
      marginInquiry: false,
      rateTables: false,
      proposalPipeline: false,
      commissions: false,
      commissionPayout: false,
      dataEnrichment: false,
      messageSender: 'planned',
      bulkMessaging: 'planned',
      webhooks: 'planned',
    },
  },
] as const satisfies readonly ProviderCatalogEntry[];

export const getProviderCatalogByScope = (
  scope: 'all' | 'runtime' | 'planned' = 'all',
) => {
  if (scope === 'runtime') {
    return providerCatalog.filter((entry) => entry.lifecycle === 'runtime');
  }

  if (scope === 'planned') {
    return providerCatalog.filter((entry) => entry.lifecycle === 'planned');
  }

  return providerCatalog;
};
