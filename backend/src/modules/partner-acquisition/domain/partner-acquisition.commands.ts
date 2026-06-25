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
  sourceName?: string | null;
  sourceReference?: string | null;
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
  expectedVersion: number;
  score?: number | null;
  qualificationReason?: string | null;
}

export interface DisqualifyPartnerProspectCommand extends PartnerAcquisitionCommandEnvelope {
  commandType: 'DisqualifyPartnerProspectCommand';
  prospectId: string;
  expectedVersion: number;
  reason: string;
}

export interface MovePartnerProspectToNegotiationCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MovePartnerProspectToNegotiationCommand';
  prospectId: string;
  expectedVersion: number;
  negotiationReason?: string | null;
}

export interface RequestPartnerProspectDocumentationCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RequestPartnerProspectDocumentationCommand';
  prospectId: string;
  expectedVersion: number;
  requestedDocuments?: string[];
  dueAt?: string | null;
}

export interface MarkPartnerProspectDocumentationReceivedCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MarkPartnerProspectDocumentationReceivedCommand';
  prospectId: string;
  expectedVersion: number;
  receivedDocuments?: string[];
}

export interface RequestPartnerProspectContractCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RequestPartnerProspectContractCommand';
  prospectId: string;
  expectedVersion: number;
  contractTemplateCode?: string | null;
  contractReference?: string | null;
}

export interface MarkPartnerProspectContractSignedCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'MarkPartnerProspectContractSignedCommand';
  prospectId: string;
  expectedVersion: number;
  signedAt: string;
  contractReference?: string | null;
  signatureProvider?: string | null;
}

export interface ApprovePartnerProspectConversionCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'ApprovePartnerProspectConversionCommand';
  prospectId: string;
  expectedVersion: number;
  approvalNotes?: string | null;
}

export interface RejectPartnerProspectConversionCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'RejectPartnerProspectConversionCommand';
  prospectId: string;
  expectedVersion: number;
  reason: string;
}

export interface ConvertPartnerProspectToPartnerCommand
  extends PartnerAcquisitionCommandEnvelope {
  commandType: 'ConvertPartnerProspectToPartnerCommand';
  prospectId: string;
  expectedVersion: number;
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
