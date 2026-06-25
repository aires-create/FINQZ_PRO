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

export interface PartnerLeadIdentity {
  tenantId: string;
  leadId: string;
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
  'partner_acquisition.lead_registered',
  'partner_acquisition.lead_enriched',
  'partner_acquisition.prospect_created',
  'partner_acquisition.prospect_contacted',
  'partner_acquisition.prospect_qualified',
  'partner_acquisition.prospect_moved',
  'partner_acquisition.contract_requested',
  'partner_acquisition.contract_generated',
  'partner_acquisition.contract_sent',
  'partner_acquisition.contract_signed',
  'partner_acquisition.conversion_requested',
  'partner_acquisition.conversion_approved',
  'partner_acquisition.partner_created',
  'partner_acquisition.prospect_lost',
  'partner_acquisition.prospect_archived',
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

export interface PartnerProspectIdentity {
  tenantId: string;
  prospectId: string;
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
  metadata?: Record<string, unknown>;
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

