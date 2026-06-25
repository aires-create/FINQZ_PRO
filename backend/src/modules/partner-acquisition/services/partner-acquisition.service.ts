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
  PartnerAcquisitionProspectCreateInput,
  PartnerAcquisitionProspectLifecycleUpdateInput,
  PartnerAcquisitionProspectLinkToPartnerInput,
  PartnerAcquisitionProspectListQuery,
  PartnerAcquisitionProspectLookup,
  PartnerAcquisitionProspectSoftDeleteInput,
  PartnerAcquisitionRepositoryContract,
} from '../repositories/partner-acquisition.repository.contract.js';
import type {
  PartnerAcquisitionConversionDecision,
  PartnerLead,
  PartnerProspect,
} from '../domain/partner-acquisition.contract.js';
import { partnerAcquisitionPrismaRepository } from '../repositories/partner-acquisition.prisma.repository.js';
import type { PartnerAcquisitionServiceContract } from './partner-acquisition.service.contract.js';

export class PartnerAcquisitionService implements PartnerAcquisitionServiceContract {
  constructor(
    private readonly repository: PartnerAcquisitionRepositoryContract = partnerAcquisitionPrismaRepository,
  ) {}

  createLead(input: PartnerAcquisitionLeadCreateInput): Promise<PartnerLead> {
    return this.repository.createLead(input);
  }

  findLeadById(input: PartnerAcquisitionLeadLookup): Promise<PartnerLead | null> {
    return this.repository.findLeadById(input);
  }

  findLeadByCode(
    input: PartnerAcquisitionLeadCodeLookup,
  ): Promise<PartnerLead | null> {
    return this.repository.findLeadByCode(input);
  }

  listLeads(input: PartnerAcquisitionLeadListQuery): Promise<PartnerLead[]> {
    return this.repository.listLeads(input);
  }

  softDeleteLead(input: PartnerAcquisitionLeadSoftDeleteInput): Promise<PartnerLead | null> {
    return this.repository.softDeleteLead(input);
  }

  createProspect(input: PartnerAcquisitionProspectCreateInput): Promise<PartnerProspect> {
    return this.repository.createProspect(input);
  }

  findProspectById(
    input: PartnerAcquisitionProspectLookup,
  ): Promise<PartnerProspect | null> {
    return this.repository.findProspectById(input);
  }

  findProspectByCode(
    input: PartnerAcquisitionProspectCodeLookup,
  ): Promise<PartnerProspect | null> {
    return this.repository.findProspectByCode(input);
  }

  listProspects(
    input: PartnerAcquisitionProspectListQuery,
  ): Promise<PartnerProspect[]> {
    return this.repository.listProspects(input);
  }

  updateProspectLifecycle(
    input: PartnerAcquisitionProspectLifecycleUpdateInput,
  ): Promise<PartnerProspect | null> {
    return this.repository.updateProspectLifecycle(input);
  }

  linkProspectToPartner(
    input: PartnerAcquisitionProspectLinkToPartnerInput,
  ): Promise<PartnerProspect | null> {
    return this.repository.linkProspectToPartner(input);
  }

  softDeleteProspect(
    input: PartnerAcquisitionProspectSoftDeleteInput,
  ): Promise<PartnerProspect | null> {
    return this.repository.softDeleteProspect(input);
  }

  recordCommand(
    input: PartnerAcquisitionCommandRecordInput,
  ): Promise<PartnerAcquisitionCommandRecordInput> {
    return this.repository.recordCommand(input);
  }

  findCommandByIdempotencyKey(
    input: PartnerAcquisitionCommandLookup,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    return this.repository.findCommandByIdempotencyKey(input);
  }

  markCommandProcessed(
    input: PartnerAcquisitionCommandProgressInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    return this.repository.markCommandProcessed(input);
  }

  markCommandFailed(
    input: PartnerAcquisitionCommandFailureInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    return this.repository.markCommandFailed(input);
  }

  appendEvent(
    input: PartnerAcquisitionEventRecordInput,
  ): Promise<PartnerAcquisitionEventRecordInput> {
    return this.repository.appendEvent(input);
  }

  listEventsByAggregate(
    input: PartnerAcquisitionEventByAggregateQuery,
  ): Promise<PartnerAcquisitionEventRecordInput[]> {
    return this.repository.listEventsByAggregate(input);
  }

  findEventByEventId(
    input: PartnerAcquisitionEventLookup,
  ): Promise<PartnerAcquisitionEventRecordInput | null> {
    return this.repository.findEventByEventId(input);
  }

  enqueueOutboxEvent(
    input: PartnerAcquisitionOutboxRecordInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput> {
    return this.repository.enqueueOutboxEvent(input);
  }

  listPendingOutboxEvents(
    input: PartnerAcquisitionOutboxPendingQuery,
  ): Promise<PartnerAcquisitionOutboxRecordInput[]> {
    return this.repository.listPendingOutboxEvents(input);
  }

  markOutboxProcessed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null> {
    return this.repository.markOutboxProcessed(input);
  }

  markOutboxFailed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null> {
    return this.repository.markOutboxFailed(input);
  }

  recordConversionDecision(
    input: PartnerAcquisitionConversionDecisionRecordInput,
  ): Promise<PartnerAcquisitionConversionDecision> {
    return this.repository.recordConversionDecision(input);
  }

  findConversionDecisionByProspectId(
    input: PartnerAcquisitionConversionDecisionLookup,
  ): Promise<PartnerAcquisitionConversionDecision | null> {
    return this.repository.findConversionDecisionByProspectId(input);
  }
}

export const partnerAcquisitionService = new PartnerAcquisitionService();
