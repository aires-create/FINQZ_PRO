export type IntegrationProviderKey =
  | 'nova-promotora'
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

export type ProviderCapabilityRegistryMap = Readonly<
  Record<IntegrationProviderKey, ProviderCapabilities>
>;

export const providerCapabilityRegistry: ProviderCapabilityRegistryMap = {
  'nova-promotora': {
    initialSimulation: false,
    marginInquiry: 'planned',
    rateTables: true,
    proposalPipeline: true,
    commissions: true,
    commissionPayout: 'planned',
    dataEnrichment: 'planned',
    messageSender: false,
    bulkMessaging: false,
    webhooks: 'planned',
  },
  'sos-bolso': {
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
  handmais: {
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
  'hand-plus': {
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
  'nova-vida-ti': {
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
  'whatsapp-business': {
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
  'bluepay': {
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
  'bulk-messaging': {
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
} as const;

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
