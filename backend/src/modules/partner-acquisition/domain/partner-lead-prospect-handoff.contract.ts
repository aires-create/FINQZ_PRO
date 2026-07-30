import type { PartnerAcquisitionCommandEnvelope } from './partner-acquisition.commands.js';
import type {
  PartnerAcquisitionAggregateType,
  PartnerAcquisitionEventMetadata,
  PartnerAcquisitionReference,
  PartnerAcquisitionSource,
  PartnerLeadStatus,
  PartnerProspectStatus,
} from './partner-acquisition.contract.js';
import type { PartnerAcquisitionEventEnvelope } from './partner-acquisition.events.js';

export const PARTNER_LEAD_PROMOTION_COMMAND_TYPES = [
  'PromotePartnerLeadToProspectCommand',
] as const;

export type PartnerLeadPromotionCommandType =
  (typeof PARTNER_LEAD_PROMOTION_COMMAND_TYPES)[number];

export const PARTNER_LEAD_PROMOTION_EVENT_NAMES = [
  'partnerLead.promotedToProspect',
  'partnerProspect.createdFromLead',
] as const;

export type PartnerLeadPromotionEventType =
  (typeof PARTNER_LEAD_PROMOTION_EVENT_NAMES)[number];

export const PARTNER_LEAD_PROMOTABLE_STATUSES = ['QUALIFIED'] as const satisfies readonly PartnerLeadStatus[];

const PARTNER_LEAD_PROMOTABLE_STATUS_SET = new Set<PartnerLeadStatus>(PARTNER_LEAD_PROMOTABLE_STATUSES);

export const PARTNER_LEAD_PROMOTION_POLICY = {
  promotionRequiresQualifiedLead: true,
  promotionDoesNotCreatePartner: true,
  promotionDoesNotUseParceiros: true,
  oneProspectPerLeadPerTenant: true,
} as const;

export const PARTNER_LEAD_PROMOTION_IDEMPOTENCY_RULES = [
  'same idempotencyKey and same payload is replay-safe',
  'same idempotencyKey and different payload is a conflict',
  'same lead and tenant resolves to the existing prospect',
] as const;

export const PARTNER_LEAD_PROMOTION_REJECTION_REASONS = [
  'NOT_FOUND',
  'TENANT_MISMATCH',
  'NOT_QUALIFIED',
  'DISCARDED',
  'IDEMPOTENCY_CONFLICT',
] as const;

export type PartnerLeadPromotionRejectionReason =
  (typeof PARTNER_LEAD_PROMOTION_REJECTION_REASONS)[number];

export interface PromotePartnerLeadToProspectCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'PromotePartnerLeadToProspectCommand';
  leadId: string;
}

export interface PartnerLeadPromotionEligibility {
  tenantId: string;
  leadId: string;
  leadStatus: PartnerLeadStatus;
  eligible: boolean;
  rejectionReason?: PartnerLeadPromotionRejectionReason | null;
}

export interface PartnerLeadPromotionDecision extends PartnerLeadPromotionEligibility {
  prospectId?: string | null;
  replaySafe: boolean;
}

export interface PromotePartnerLeadToProspectResult {
  tenantId: string;
  leadId: string;
  prospectId: string;
  leadStatus: Extract<PartnerLeadStatus, 'QUALIFIED'>;
  prospectStatus: Extract<PartnerProspectStatus, 'NEW'>;
  replayed: boolean;
  created: boolean;
}

type PartnerLeadPromotionEventEnvelope = Omit<
  PartnerAcquisitionEventEnvelope,
  'aggregateType' | 'eventType'
> & {
  aggregateType: Extract<PartnerAcquisitionAggregateType, 'PARTNER_LEAD' | 'PARTNER_PROSPECT'>;
  eventType: PartnerLeadPromotionEventType;
};

export interface PartnerLeadPromotedToProspectEvent extends PartnerLeadPromotionEventEnvelope {
  eventType: 'partnerLead.promotedToProspect';
  aggregateType: 'PARTNER_LEAD';
  leadId: string;
  prospectId: string;
  leadStatus: Extract<PartnerLeadStatus, 'QUALIFIED'>;
  prospectStatus: Extract<PartnerProspectStatus, 'NEW'>;
}

export interface PartnerProspectCreatedFromLeadEvent extends PartnerLeadPromotionEventEnvelope {
  eventType: 'partnerProspect.createdFromLead';
  aggregateType: 'PARTNER_PROSPECT';
  leadId: string;
  prospectId: string;
  sourceLeadStatus: Extract<PartnerLeadStatus, 'QUALIFIED'>;
  status: Extract<PartnerProspectStatus, 'NEW'>;
}

export const canPromotePartnerLeadToProspect = (status: string): status is Extract<PartnerLeadStatus, 'QUALIFIED'> => {
  return PARTNER_LEAD_PROMOTABLE_STATUS_SET.has(status as PartnerLeadStatus);
};

export const assertCanPromotePartnerLeadToProspect = (status: string): void => {
  if (!canPromotePartnerLeadToProspect(status)) {
    throw new RangeError(`Partner lead cannot be promoted from status: ${status}`);
  }
};

export interface PartnerLeadPromotionHandOff {
  command: PromotePartnerLeadToProspectCommand;
  decision: PartnerLeadPromotionDecision;
  leadPromotedEvent: PartnerLeadPromotedToProspectEvent;
  prospectCreatedEvent: PartnerProspectCreatedFromLeadEvent;
  metadata?: PartnerAcquisitionEventMetadata;
  source: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
}
