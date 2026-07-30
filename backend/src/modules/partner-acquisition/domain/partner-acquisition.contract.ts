export const PARTNER_LEAD_CHANNELS = [
  'SOCIAL_MEDIA',
  'MAILING',
  'BASE',
  'REFERRAL',
  'CAMPAIGN',
  'SDR_IA',
  'LANDING_PAGE',
  'MANUAL',
  'PARTNER_REFERRAL',
  'OUTBOUND',
  'EVENT',
  'OTHER',
] as const;

export type PartnerLeadChannel = (typeof PARTNER_LEAD_CHANNELS)[number];

export const PARTNER_LEAD_STATUSES = [
  'NEW',
  'ENRICHED',
  'CONTACTED',
  'QUALIFIED',
  'DISCARDED',
] as const;

export type PartnerLeadStatus = (typeof PARTNER_LEAD_STATUSES)[number];

export const PARTNER_ACQUISITION_SOURCES = PARTNER_LEAD_CHANNELS;
export type PartnerAcquisitionSource = PartnerLeadChannel;

export const PARTNER_ACQUISITION_AGGREGATE_TYPES = [
  'PARTNER_LEAD',
  'PARTNER_PROSPECT',
  'PARTNER',
] as const;

export type PartnerAcquisitionAggregateType =
  (typeof PARTNER_ACQUISITION_AGGREGATE_TYPES)[number];

export interface PartnerLeadIdentity {
  tenantId: string;
  leadId: string;
  leadCode: string;
}

export interface PartnerLeadContact {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
}

export interface PartnerLeadAttribution {
  channel: PartnerLeadChannel;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  ownerUserId?: string | null;
}

export interface PartnerLeadLifecycle {
  status: PartnerLeadStatus;
  score?: number | null;
  enrichedAt?: string | null;
  contactedAt?: string | null;
  qualifiedAt?: string | null;
  discardedAt?: string | null;
  discardReason?: string | null;
}

export interface PartnerLead extends PartnerLeadIdentity, PartnerLeadContact, PartnerLeadAttribution, PartnerLeadLifecycle {
  createdAt: string;
  updatedAt: string;
}

export const PARTNER_PROSPECT_STATUSES = [
  'NEW',
  'ENRICHED',
  'CONTACTED',
  'QUALIFIED',
  'NEGOTIATING',
  'DOCUMENTATION',
  'CONTRACT_PENDING',
  'AWAITING_SIGNATURE',
  'SIGNED',
  'CONVERSION_PENDING',
  'CONVERTED',
  'LOST',
  'ARCHIVED',
  'REJECTED',
] as const;

export type PartnerProspectStatus = (typeof PARTNER_PROSPECT_STATUSES)[number];

export const PARTNER_ACQUISITION_EVENT_TYPES = [
  'PartnerLeadCreated',
  'PartnerProspectCreated',
  'PartnerProspectQualified',
  'PartnerProspectDisqualified',
  'PartnerProspectMovedToNegotiation',
  'PartnerProspectDocumentationRequested',
  'PartnerProspectDocumentationReceived',
  'PartnerProspectContractRequested',
  'PartnerProspectContractSigned',
  'PartnerProspectConversionApproved',
  'PartnerProspectConversionRejected',
  'PartnerProspectConvertedToPartner',
] as const;

export type PartnerAcquisitionEventType = (typeof PARTNER_ACQUISITION_EVENT_TYPES)[number];

export const PARTNER_ACQUISITION_PERMISSION_CODES = [
  'partner_acquisition:read',
  'partner_acquisition:create',
  'partner_acquisition:update',
  'partner_acquisition:qualify',
  'partner_acquisition:convert',
  'partner_acquisition:approve',
  'partner_acquisition:audit',
  'partner_prospect:read',
  'partner_prospect:create',
  'partner_prospect:update',
  'partner_prospect:transition',
  'partner_prospect:convert',
] as const;

export type PartnerAcquisitionPermissionCode = (typeof PARTNER_ACQUISITION_PERMISSION_CODES)[number];

export const PARTNER_ACQUISITION_REFERENCE_KINDS = [
  'SOURCE',
  'REFERENCE',
  'SUBSTRATE',
  'FEEDER',
  'HANDLER',
] as const;

export type PartnerAcquisitionReferenceKind =
  (typeof PARTNER_ACQUISITION_REFERENCE_KINDS)[number];

export interface PartnerAcquisitionReference {
  kind: PartnerAcquisitionReferenceKind;
  refType: 'PIPELINE' | 'SDR_IA' | 'AUTOMATION' | 'CAMPAIGN' | 'MAILING' | 'BASE' | 'SOCIAL_MEDIA' | 'REFERRAL' | 'LANDING_PAGE' | 'MANUAL' | 'PARTNER_REFERRAL' | 'OUTBOUND' | 'EVENT' | 'OTHER';
  refId: string;
  refLabel?: string | null;
}

export interface PartnerAcquisitionCommandMetadata {
  source?: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
  pipelineCode?: string | null;
  stageCode?: string | null;
  sdrAgentId?: string | null;
  automationCode?: string | null;
  campaignId?: string | null;
  trace?: Record<string, unknown>;
}

export interface PartnerAcquisitionEventMetadata extends PartnerAcquisitionCommandMetadata {
  reason?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus?: PartnerProspectStatus | null;
}

export interface PartnerProspectIdentity {
  tenantId: string;
  prospectId: string;
  prospectCode: string;
  leadId: string;
}

export interface PartnerProspectCommercialProfile {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
}

export interface PartnerProspectSource {
  channel: PartnerLeadChannel;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  sdrAgentId?: string | null;
}

export interface PartnerProspectWorkflowContext {
  status: PartnerProspectStatus;
  partnerId?: string | null;
  pipelineCode?: string | null;
  stageCode?: string | null;
  score?: number | null;
  qualificationReason?: string | null;
  assignedUserId?: string | null;
  nextActionAt?: string | null;
  signedAt?: string | null;
  convertedAt?: string | null;
  lostAt?: string | null;
  lostReason?: string | null;
}

export interface PartnerProspect extends PartnerProspectIdentity, PartnerProspectCommercialProfile, PartnerProspectSource, PartnerProspectWorkflowContext {
  createdAt: string;
  updatedAt: string;
}

export type PartnerAcquisitionSourceSurface =
  | 'SOCIAL_MEDIA'
  | 'MAILING'
  | 'BASE'
  | 'REFERRAL'
  | 'CAMPAIGN'
  | 'SDR_IA'
  | 'LANDING_PAGE'
  | 'MANUAL'
  | 'PARTNER_REFERRAL'
  | 'OUTBOUND'
  | 'EVENT'
  | 'OTHER';

export interface PartnerAcquisitionCommandContext {
  tenantId: string;
  actorUserId: string | null;
  correlationId: string | null;
  requestId: string | null;
  idempotencyKey: string | null;
  source: PartnerAcquisitionSourceSurface;
}

export interface PartnerAcquisitionAuditEvent {
  tenantId: string;
  actorUserId: string | null;
  correlationId: string | null;
  requestId: string | null;
  idempotencyKey: string | null;
  eventType: PartnerAcquisitionEventType;
  prospectId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  fromStatus?: PartnerProspectStatus | null;
  toStatus?: PartnerProspectStatus | null;
  occurredAt: string;
  metadata?: PartnerAcquisitionEventMetadata;
}

export interface PartnerAcquisitionConversionDecision {
  tenantId: string;
  prospectId: string;
  partnerId?: string | null;
  approved: boolean;
  reason?: string | null;
  decidedByUserId: string | null;
  decidedAt: string;
}
