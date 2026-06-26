import type {
  PartnerAcquisitionCommandFailureInput,
  PartnerAcquisitionCommandLookup,
  PartnerAcquisitionCommandProgressInput,
  PartnerAcquisitionCommandRecordInput,
  PartnerAcquisitionConversionDecisionLookup,
  PartnerAcquisitionConversionDecisionRecordInput,
  PartnerAcquisitionEventByAggregateQuery,
  PartnerAcquisitionEventLookup,
  PartnerAcquisitionEventRecordInput,
  PartnerAcquisitionLeadCodeLookup,
  PartnerAcquisitionLeadCreateInput,
  PartnerAcquisitionLeadListQuery,
  PartnerAcquisitionLeadLookup,
  PartnerAcquisitionLeadSoftDeleteInput,
  PartnerAcquisitionOutboxPendingQuery,
  PartnerAcquisitionOutboxProgressInput,
  PartnerAcquisitionOutboxRecordInput,
  PartnerAcquisitionProspectCodeLookup,
  PartnerAcquisitionProspectByLeadLookup,
  PartnerAcquisitionProspectCreateInput,
  PartnerAcquisitionProspectLifecycleUpdateInput,
  PartnerAcquisitionProspectLinkToPartnerInput,
  PartnerAcquisitionProspectListQuery,
  PartnerAcquisitionProspectLookup,
  PartnerAcquisitionProspectSoftDeleteInput,
} from '../repositories/partner-acquisition.repository.contract.js';
import type {
  PartnerAcquisitionConversionDecision,
  PartnerLead,
  PartnerProspect,
} from '../domain/partner-acquisition.contract.js';
import type {
  PromotePartnerLeadToProspectCommand,
  PromotePartnerLeadToProspectResult,
} from '../domain/partner-lead-prospect-handoff.contract.js';

export interface PartnerAcquisitionServiceContract {
  createLead(input: PartnerAcquisitionLeadCreateInput): Promise<PartnerLead>;
  findLeadById(input: PartnerAcquisitionLeadLookup): Promise<PartnerLead | null>;
  findLeadByCode(input: PartnerAcquisitionLeadCodeLookup): Promise<PartnerLead | null>;
  listLeads(input: PartnerAcquisitionLeadListQuery): Promise<PartnerLead[]>;
  softDeleteLead(input: PartnerAcquisitionLeadSoftDeleteInput): Promise<PartnerLead | null>;

  promoteLeadToProspect(
    input: PromotePartnerLeadToProspectCommand,
  ): Promise<PromotePartnerLeadToProspectResult>;
  createProspect(input: PartnerAcquisitionProspectCreateInput): Promise<PartnerProspect>;
  findProspectById(input: PartnerAcquisitionProspectLookup): Promise<PartnerProspect | null>;
  findProspectByTenantAndLead(
    input: PartnerAcquisitionProspectByLeadLookup,
  ): Promise<PartnerProspect | null>;
  findProspectByCode(
    input: PartnerAcquisitionProspectCodeLookup,
  ): Promise<PartnerProspect | null>;
  listProspects(input: PartnerAcquisitionProspectListQuery): Promise<PartnerProspect[]>;
  updateProspectLifecycle(
    input: PartnerAcquisitionProspectLifecycleUpdateInput,
  ): Promise<PartnerProspect | null>;
  linkProspectToPartner(
    input: PartnerAcquisitionProspectLinkToPartnerInput,
  ): Promise<PartnerProspect | null>;
  softDeleteProspect(
    input: PartnerAcquisitionProspectSoftDeleteInput,
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

  appendEvent(
    input: PartnerAcquisitionEventRecordInput,
  ): Promise<PartnerAcquisitionEventRecordInput>;
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
