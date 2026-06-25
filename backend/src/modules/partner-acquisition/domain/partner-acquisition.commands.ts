import type {
  PartnerAcquisitionAggregateType,
  PartnerAcquisitionCommandMetadata,
  PartnerAcquisitionReference,
  PartnerAcquisitionSource,
  PartnerProspectStatus,
} from './partner-acquisition.contract.js';

export const PARTNER_ACQUISITION_COMMAND_TYPES = [
  'CreatePartnerLeadCommand',
  'CreatePartnerProspectCommand',
  'QualifyPartnerProspectCommand',
  'DisqualifyPartnerProspectCommand',
  'MovePartnerProspectToNegotiationCommand',
  'RequestPartnerProspectDocumentationCommand',
  'MarkPartnerProspectDocumentationReceivedCommand',
  'RequestPartnerProspectContractCommand',
  'MarkPartnerProspectContractSignedCommand',
  'ApprovePartnerProspectConversionCommand',
  'RejectPartnerProspectConversionCommand',
  'ConvertPartnerProspectToPartnerCommand',
] as const;

export type PartnerAcquisitionCommandType =
  (typeof PARTNER_ACQUISITION_COMMAND_TYPES)[number];

export interface PartnerAcquisitionCommandEnvelope {
  tenantId: string;
  actorUserId: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  source: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
  metadata?: PartnerAcquisitionCommandMetadata;
}

export interface CreatePartnerLeadCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'CreatePartnerLeadCommand';
  leadId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
}

export interface CreatePartnerProspectCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'CreatePartnerProspectCommand';
  prospectId: string;
  leadId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
  initialStatus?: Extract<PartnerProspectStatus, 'NEW' | 'ENRICHED' | 'CONTACTED'>;
}

export interface QualifyPartnerProspectCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'QualifyPartnerProspectCommand';
  prospectId: string;
  score?: number | null;
  qualificationReason?: string | null;
}

export interface DisqualifyPartnerProspectCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'DisqualifyPartnerProspectCommand';
  prospectId: string;
  reason: string;
}

export interface MovePartnerProspectToNegotiationCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MovePartnerProspectToNegotiationCommand';
  prospectId: string;
  negotiationReason?: string | null;
}

export interface RequestPartnerProspectDocumentationCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RequestPartnerProspectDocumentationCommand';
  prospectId: string;
  requestedDocuments?: string[];
  dueAt?: string | null;
}

export interface MarkPartnerProspectDocumentationReceivedCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MarkPartnerProspectDocumentationReceivedCommand';
  prospectId: string;
  receivedDocuments?: string[];
}

export interface RequestPartnerProspectContractCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RequestPartnerProspectContractCommand';
  prospectId: string;
  contractTemplateCode?: string | null;
  contractReference?: string | null;
}

export interface MarkPartnerProspectContractSignedCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MarkPartnerProspectContractSignedCommand';
  prospectId: string;
  signedAt: string;
  contractReference?: string | null;
  signatureProvider?: string | null;
}

export interface ApprovePartnerProspectConversionCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'ApprovePartnerProspectConversionCommand';
  prospectId: string;
  approvalNotes?: string | null;
}

export interface RejectPartnerProspectConversionCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RejectPartnerProspectConversionCommand';
  prospectId: string;
  reason: string;
}

export interface ConvertPartnerProspectToPartnerCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'ConvertPartnerProspectToPartnerCommand';
  prospectId: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerType: 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';
  aggregateType: Extract<PartnerAcquisitionAggregateType, 'PARTNER_PROSPECT' | 'PARTNER'>;
  conversionApprovedAt?: string | null;
}

export type PartnerAcquisitionCommand =
  | CreatePartnerLeadCommand
  | CreatePartnerProspectCommand
  | QualifyPartnerProspectCommand
  | DisqualifyPartnerProspectCommand
  | MovePartnerProspectToNegotiationCommand
  | RequestPartnerProspectDocumentationCommand
  | MarkPartnerProspectDocumentationReceivedCommand
  | RequestPartnerProspectContractCommand
  | MarkPartnerProspectContractSignedCommand
  | ApprovePartnerProspectConversionCommand
  | RejectPartnerProspectConversionCommand
  | ConvertPartnerProspectToPartnerCommand;

