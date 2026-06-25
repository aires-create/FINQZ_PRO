import type {
  PartnerAcquisitionAggregateType,
  PartnerAcquisitionEventMetadata,
  PartnerAcquisitionReference,
  PartnerAcquisitionSource,
  PartnerLeadChannel,
  PartnerLeadStatus,
  PartnerProspectStatus,
} from './partner-acquisition.contract.js';

export const PARTNER_ACQUISITION_EVENT_NAMES = [
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

export type PartnerAcquisitionEventType =
  (typeof PARTNER_ACQUISITION_EVENT_NAMES)[number];

export interface PartnerAcquisitionEventEnvelope {
  eventId: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: PartnerAcquisitionAggregateType;
  eventType: PartnerAcquisitionEventType;
  actorUserId: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  source: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
  metadata?: PartnerAcquisitionEventMetadata;
}

export interface PartnerLeadCreatedEvent extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerLeadCreated';
  aggregateType: 'PARTNER_LEAD';
  leadId: string;
  leadStatus: PartnerLeadStatus;
  channel: PartnerLeadChannel;
  fullName: string;
}

export interface PartnerProspectCreatedEvent extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectCreated';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  leadId: string;
  status: Extract<PartnerProspectStatus, 'NEW' | 'ENRICHED' | 'CONTACTED'>;
}

export interface PartnerProspectQualifiedEvent extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectQualified';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  score?: number | null;
  qualificationReason?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'QUALIFIED';
}

export interface PartnerProspectDisqualifiedEvent extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectDisqualified';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  reason: string;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'LOST' | 'ARCHIVED' | 'REJECTED';
}

export interface PartnerProspectMovedToNegotiationEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectMovedToNegotiation';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  negotiationReason?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'NEGOTIATING';
}

export interface PartnerProspectDocumentationRequestedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectDocumentationRequested';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  requestedDocuments?: string[];
  dueAt?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'DOCUMENTATION';
}

export interface PartnerProspectDocumentationReceivedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectDocumentationReceived';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  receivedDocuments?: string[];
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'CONTRACT_PENDING' | 'AWAITING_SIGNATURE';
}

export interface PartnerProspectContractRequestedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectContractRequested';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  contractTemplateCode?: string | null;
  contractReference?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'CONTRACT_PENDING';
}

export interface PartnerProspectContractSignedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectContractSigned';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  signedAt: string;
  contractReference?: string | null;
  signatureProvider?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'SIGNED';
}

export interface PartnerProspectConversionApprovedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectConversionApproved';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  approvalNotes?: string | null;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'CONVERSION_PENDING';
}

export interface PartnerProspectConversionRejectedEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectConversionRejected';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  reason: string;
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'REJECTED';
}

export interface PartnerProspectConvertedToPartnerEvent
  extends PartnerAcquisitionEventEnvelope {
  eventType: 'PartnerProspectConvertedToPartner';
  aggregateType: 'PARTNER_PROSPECT';
  prospectId: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerType: 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';
  previousStatus?: PartnerProspectStatus | null;
  nextStatus: 'CONVERTED';
}

export type PartnerAcquisitionEvent =
  | PartnerLeadCreatedEvent
  | PartnerProspectCreatedEvent
  | PartnerProspectQualifiedEvent
  | PartnerProspectDisqualifiedEvent
  | PartnerProspectMovedToNegotiationEvent
  | PartnerProspectDocumentationRequestedEvent
  | PartnerProspectDocumentationReceivedEvent
  | PartnerProspectContractRequestedEvent
  | PartnerProspectContractSignedEvent
  | PartnerProspectConversionApprovedEvent
  | PartnerProspectConversionRejectedEvent
  | PartnerProspectConvertedToPartnerEvent;

