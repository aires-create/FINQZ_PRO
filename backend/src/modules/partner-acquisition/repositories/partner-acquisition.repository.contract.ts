import type {
  PartnerAcquisitionAggregateType,
  PartnerAcquisitionEventMetadata,
  PartnerAcquisitionReference,
  PartnerAcquisitionSource,
  PartnerLead,
  PartnerLeadChannel,
  PartnerLeadStatus,
  PartnerProspect,
  PartnerProspectStatus,
  PartnerAcquisitionConversionDecision,
} from '../domain/partner-acquisition.contract.js';
import type {
  PartnerAcquisitionCommandType,
} from '../domain/partner-acquisition.commands.js';
import type {
  PartnerAcquisitionEventType,
} from '../domain/partner-acquisition.events.js';

export type PartnerAcquisitionCommandInboxStatus =
  | 'RECEIVED'
  | 'PROCESSED'
  | 'FAILED';

export type PartnerAcquisitionOutboxStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED';

export interface PartnerAcquisitionLeadCreateInput {
  tenantId: string;
  leadCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
  channel: PartnerLeadChannel;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  ownerUserId?: string | null;
  status?: PartnerLeadStatus;
  score?: number | null;
  source?: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
}

export interface PartnerAcquisitionLeadLookup {
  tenantId: string;
  leadId: string;
}

export interface PartnerAcquisitionLeadCodeLookup {
  tenantId: string;
  leadCode: string;
}

export interface PartnerAcquisitionLeadListQuery {
  tenantId: string;
  status?: PartnerLeadStatus | null;
  channel?: PartnerLeadChannel | null;
  ownerUserId?: string | null;
  includeDeleted?: boolean;
}

export interface PartnerAcquisitionLeadSoftDeleteInput {
  tenantId: string;
  leadId: string;
  deletedAt: string;
}

export interface PartnerAcquisitionLeadLifecycleUpdateInput {
  tenantId: string;
  leadId: string;
  status: PartnerLeadStatus;
}

export interface PartnerAcquisitionProspectCreateInput {
  tenantId: string;
  prospectCode: string;
  leadId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  document?: string | null;
  channel: PartnerLeadChannel;
  sourceName?: string | null;
  sourceReference?: string | null;
  campaignId?: string | null;
  hubContextId?: string | null;
  sdrAgentId?: string | null;
  status?: PartnerProspectStatus;
  pipelineId?: string | null;
  stageId?: string | null;
  pipelineCode?: string | null;
  stageCode?: string | null;
  score?: number | null;
  qualificationReason?: string | null;
  assignedUserId?: string | null;
  nextActionAt?: string | null;
  signedAt?: string | null;
  convertedAt?: string | null;
  partnerId?: string | null;
  source?: PartnerAcquisitionSource;
  references?: PartnerAcquisitionReference[];
}

export interface PartnerAcquisitionProspectLookup {
  tenantId: string;
  prospectId: string;
}

export interface PartnerAcquisitionProspectByLeadLookup {
  tenantId: string;
  leadId: string;
}

export interface PartnerAcquisitionProspectCodeLookup {
  tenantId: string;
  prospectCode: string;
}

export interface PartnerAcquisitionProspectListQuery {
  tenantId: string;
  status?: PartnerProspectStatus | null;
  channel?: PartnerLeadChannel | null;
  pipelineCode?: string | null;
  stageCode?: string | null;
  assignedUserId?: string | null;
  includeDeleted?: boolean;
}

export interface PartnerAcquisitionProspectLifecycleUpdateInput {
  tenantId: string;
  prospectId: string;
  expectedVersion: number;
  status?: PartnerProspectStatus;
  score?: number | null;
  qualificationReason?: string | null;
  assignedUserId?: string | null;
  pipelineId?: string | null;
  stageId?: string | null;
  pipelineCode?: string | null;
  stageCode?: string | null;
  nextActionAt?: string | null;
  signedAt?: string | null;
  convertedAt?: string | null;
}

export interface PartnerAcquisitionProspectLinkToPartnerInput {
  tenantId: string;
  prospectId: string;
  partnerId: string;
  expectedVersion: number;
}

export interface PartnerAcquisitionProspectSoftDeleteInput {
  tenantId: string;
  prospectId: string;
  deletedAt: string;
  expectedVersion?: number;
}

export interface PartnerAcquisitionLeadProspectPromotionInput {
  tenantId: string;
  leadId: string;
  prospectCode: string;
}

export interface PartnerAcquisitionCommandRecordInput {
  tenantId: string;
  commandId?: string | null;
  commandType: PartnerAcquisitionCommandType;
  aggregateId?: string | null;
  aggregateType: PartnerAcquisitionAggregateType;
  actorUserId: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
  status?: PartnerAcquisitionCommandInboxStatus;
  receivedAt: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown> | null;
}

export interface PartnerAcquisitionCommandLookup {
  tenantId: string;
  idempotencyKey: string;
}

export interface PartnerAcquisitionCommandProgressInput {
  tenantId: string;
  idempotencyKey: string;
  processedAt?: string;
  result?: Record<string, unknown> | null;
}

export interface PartnerAcquisitionCommandFailureInput {
  tenantId: string;
  idempotencyKey: string;
  failedAt?: string;
  error: string;
}

export interface PartnerAcquisitionEventRecordInput {
  tenantId: string;
  eventId: string;
  aggregateId: string;
  aggregateType: PartnerAcquisitionAggregateType;
  eventType: PartnerAcquisitionEventType;
  actorUserId: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  metadata?: PartnerAcquisitionEventMetadata | null;
  version: number;
}

export interface PartnerAcquisitionEventByAggregateQuery {
  tenantId: string;
  aggregateId: string;
  aggregateType: PartnerAcquisitionAggregateType;
  limit?: number;
  afterOccurredAt?: string | null;
}

export interface PartnerAcquisitionEventLookup {
  tenantId: string;
  eventId: string;
}

export interface PartnerAcquisitionOutboxRecordInput {
  tenantId: string;
  eventId: string;
  aggregateId: string;
  aggregateType: PartnerAcquisitionAggregateType;
  eventType: PartnerAcquisitionEventType;
  status?: PartnerAcquisitionOutboxStatus;
  availableAt: string;
  payload: Record<string, unknown>;
}

export interface PartnerAcquisitionOutboxPendingQuery {
  tenantId: string;
  status?: Extract<PartnerAcquisitionOutboxStatus, 'PENDING' | 'FAILED'>;
  availableAtBefore?: string | null;
  limit?: number;
}

export interface PartnerAcquisitionOutboxProgressInput {
  tenantId: string;
  eventId: string;
  status: Extract<PartnerAcquisitionOutboxStatus, 'PROCESSING' | 'PROCESSED' | 'FAILED'>;
  processedAt?: string | null;
  lastError?: string | null;
  attemptCount?: number;
}

export interface PartnerAcquisitionConversionDecisionRecordInput {
  tenantId: string;
  prospectId: string;
  partnerId?: string | null;
  approved: boolean;
  decidedByUserId: string;
  decidedAt: string;
  reason?: string | null;
}

export interface PartnerAcquisitionConversionDecisionLookup {
  tenantId: string;
  prospectId: string;
}

export interface PartnerAcquisitionRepositoryContract {
  createLead(input: PartnerAcquisitionLeadCreateInput): Promise<PartnerLead>;
  findLeadById(input: PartnerAcquisitionLeadLookup): Promise<PartnerLead | null>;
  findLeadByCode(input: PartnerAcquisitionLeadCodeLookup): Promise<PartnerLead | null>;
  listLeads(input: PartnerAcquisitionLeadListQuery): Promise<PartnerLead[]>;
  softDeleteLead(input: PartnerAcquisitionLeadSoftDeleteInput): Promise<PartnerLead | null>;
  updateLeadLifecycle(
    input: PartnerAcquisitionLeadLifecycleUpdateInput,
  ): Promise<PartnerLead | null>;

  createProspect(input: PartnerAcquisitionProspectCreateInput): Promise<PartnerProspect>;
  findProspectById(input: PartnerAcquisitionProspectLookup): Promise<PartnerProspect | null>;
  findProspectByTenantAndLead(
    input: PartnerAcquisitionProspectByLeadLookup,
  ): Promise<PartnerProspect | null>;
  findProspectByCode(input: PartnerAcquisitionProspectCodeLookup): Promise<PartnerProspect | null>;
  listProspects(input: PartnerAcquisitionProspectListQuery): Promise<PartnerProspect[]>;
  updateProspectLifecycle(
    input: PartnerAcquisitionProspectLifecycleUpdateInput,
  ): Promise<PartnerProspect | null>;
  linkProspectToPartner(
    input: PartnerAcquisitionProspectLinkToPartnerInput,
  ): Promise<PartnerProspect | null>;
  softDeleteProspect(input: PartnerAcquisitionProspectSoftDeleteInput): Promise<PartnerProspect | null>;
  promoteLeadToProspectInTransaction(
    input: PartnerAcquisitionLeadProspectPromotionInput,
  ): Promise<PartnerProspect | null>;

  recordCommand(
    input: PartnerAcquisitionCommandRecordInput,
  ): Promise<PartnerAcquisitionCommandRecordInput>;
  findCommandByIdempotencyKey(
    input: PartnerAcquisitionCommandLookup,
  ): Promise<PartnerAcquisitionCommandRecordInput | null>;
  markCommandProcessed(
    input: PartnerAcquisitionCommandProgressInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null>;
  markCommandFailed(
    input: PartnerAcquisitionCommandFailureInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null>;

  appendEvent(input: PartnerAcquisitionEventRecordInput): Promise<PartnerAcquisitionEventRecordInput>;
  listEventsByAggregate(
    input: PartnerAcquisitionEventByAggregateQuery,
  ): Promise<PartnerAcquisitionEventRecordInput[]>;
  findEventByEventId(
    input: PartnerAcquisitionEventLookup,
  ): Promise<PartnerAcquisitionEventRecordInput | null>;

  enqueueOutboxEvent(
    input: PartnerAcquisitionOutboxRecordInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput>;
  listPendingOutboxEvents(
    input: PartnerAcquisitionOutboxPendingQuery,
  ): Promise<PartnerAcquisitionOutboxRecordInput[]>;
  markOutboxProcessed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null>;
  markOutboxFailed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null>;

  recordConversionDecision(
    input: PartnerAcquisitionConversionDecisionRecordInput,
  ): Promise<PartnerAcquisitionConversionDecision>;
  findConversionDecisionByProspectId(
    input: PartnerAcquisitionConversionDecisionLookup,
  ): Promise<PartnerAcquisitionConversionDecision | null>;
}
