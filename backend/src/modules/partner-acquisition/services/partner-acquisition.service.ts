import { randomUUID } from 'node:crypto';

import { Prisma, type Partner } from '@prisma/client';

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
  PartnerAcquisitionRepositoryContract,
} from '../repositories/partner-acquisition.repository.contract.js';
import type {
  PartnerAcquisitionConversionDecision,
  PartnerAcquisitionEventMetadata,
  PartnerLead,
  PartnerProspect,
} from '../domain/partner-acquisition.contract.js';
import {
  canPromotePartnerLeadToProspect,
  type PromotePartnerLeadToProspectCommand,
  type PromotePartnerLeadToProspectResult,
} from '../domain/partner-lead-prospect-handoff.contract.js';
import { canTransitionPartnerLead } from '../domain/partner-lead-lifecycle.contract.js';
import type {
  ConvertPartnerProspectToPartnerCommand,
  TransitionPartnerLeadCommand,
} from '../domain/partner-acquisition.commands.js';
import { partnerAcquisitionPrismaRepository } from '../repositories/partner-acquisition.prisma.repository.js';
import { PartnerAcquisitionPrismaRepository } from '../repositories/partner-acquisition.prisma.repository.js';
import type { PartnerAcquisitionServiceContract } from './partner-acquisition.service.contract.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';
import { prisma } from '../../../core/prisma/client.js';
import { PartnerPrismaRepository } from '../../partners/repositories/partner.prisma.repository.js';
import { PartnerService } from '../../partners/services/partner.service.js';
import { PartnerNotFoundError } from '../../partners/services/partner.errors.js';

const buildPromotionPayload = (
  command: PromotePartnerLeadToProspectCommand,
): Record<string, unknown> => ({
  commandType: command.commandType,
  leadId: command.leadId,
  source: command.source,
  ...(command.sourceName !== undefined ? { sourceName: command.sourceName } : {}),
  ...(command.sourceReference !== undefined ? { sourceReference: command.sourceReference } : {}),
  ...(command.references !== undefined ? { references: command.references } : {}),
  ...(command.metadata !== undefined ? { metadata: command.metadata } : {}),
});

const buildLeadTransitionPayload = (
  command: TransitionPartnerLeadCommand,
): Record<string, unknown> => ({
  commandType: command.commandType,
  leadId: command.leadId,
  nextStatus: command.nextStatus,
  ...(command.reason !== undefined ? { reason: command.reason } : {}),
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSamePayload = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  }

  if (left === null || right === null) {
    return left === right;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => isSamePayload(item, right[index]));
  }

  if (isPlainObject(left) || isPlainObject(right)) {
    if (!isPlainObject(left) || !isPlainObject(right)) {
      return false;
    }

    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key, index) => {
      const rightKey = rightKeys[index];
      if (key !== rightKey) {
        return false;
      }

      return isSamePayload(left[key], right[rightKey]);
    });
  }

  return false;
};

const getStoredCommandFailureMessage = (
  commandRecord: PartnerAcquisitionCommandRecordInput,
): string | null => {
  const error = commandRecord.result?.error;

  if (typeof error !== 'string' || !error.trim()) {
    return null;
  }

  return error.trim();
};

const throwStoredCommandFailure = (
  commandRecord: PartnerAcquisitionCommandRecordInput,
): never => {
  const message =
    getStoredCommandFailureMessage(commandRecord) ?? 'Partner acquisition command already failed';

  if (message.toLowerCase().includes('not found')) {
    throw new NotFoundError(message);
  }

  throw new ConflictError(message);
};

const requireTenantContext = (tenantId: string): string => {
  if (!tenantId.trim()) {
    throw new BadRequestError('Missing tenant context');
  }

  return tenantId;
};

const requireActorUserId = (actorUserId: string): string => {
  if (!actorUserId.trim()) {
    throw new BadRequestError('Missing actor user context');
  }

  return actorUserId;
};

const toPromotionResult = (
  tenantId: string,
  leadId: string,
  prospectId: string,
  created: boolean,
  replayed: boolean,
): PromotePartnerLeadToProspectResult => ({
  tenantId,
  leadId,
  prospectId,
  leadStatus: 'QUALIFIED',
  prospectStatus: 'NEW',
  created,
  replayed,
});

const buildLeadTransitionEventPayload = (
  leadId: string,
  previousStatus: string,
  nextStatus: string,
  reason?: string | null,
): Record<string, unknown> => ({
  leadId,
  previousStatus,
  nextStatus,
  ...(reason !== undefined && reason !== null ? { reason } : {}),
});

type TransactionRunner = <T>(
  action: (transaction: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>;

export class PartnerAcquisitionService implements PartnerAcquisitionServiceContract {
  constructor(
    private readonly repository: PartnerAcquisitionRepositoryContract = partnerAcquisitionPrismaRepository,
    private readonly runInTransaction: TransactionRunner = (action) =>
      prisma.$transaction(action),
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

  async transitionLead(command: TransitionPartnerLeadCommand): Promise<PartnerLead> {
    const tenantId = requireTenantContext(command.tenantId);
    requireActorUserId(command.actorUserId);
    const commandType = command.commandType as unknown as PartnerAcquisitionCommandRecordInput['commandType'];
    const payload = buildLeadTransitionPayload(command);

    const commandRecord = await this.repository.recordCommand({
      tenantId,
      commandType,
      aggregateId: command.leadId,
      aggregateType: 'PARTNER_LEAD',
      actorUserId: command.actorUserId,
      requestId: command.requestId,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      receivedAt: command.requestedAt,
      payload,
    });

    if (!isSamePayload(commandRecord.payload, payload)) {
      throw new ConflictError('Partner acquisition idempotency payload mismatch');
    }

    if (commandRecord.status === 'PROCESSED') {
      const result =
        commandRecord.result && typeof commandRecord.result === 'object'
          ? (commandRecord.result as unknown as PartnerLead)
          : null;

      if (!result) {
        throw new ConflictError('Partner acquisition replay is missing stored result');
      }

      return result;
    }

    if (commandRecord.status === 'FAILED') {
      throwStoredCommandFailure(commandRecord);
    }

    try {
      const lead = await this.repository.findLeadById({
        tenantId,
        leadId: command.leadId,
      });

      if (!lead) {
        throw new NotFoundError('Partner lead not found');
      }

      if (!canTransitionPartnerLead(lead.status, command.nextStatus)) {
        throw new ConflictError(
          `Partner lead cannot transition from status ${lead.status} to ${command.nextStatus}`,
        );
      }

      const updatedLead = await this.repository.updateLeadLifecycle({
        tenantId,
        leadId: command.leadId,
        status: command.nextStatus,
      });

      if (!updatedLead) {
        throw new NotFoundError('Partner lead not found');
      }

      const events = await this.repository.listEventsByAggregate({
        tenantId,
        aggregateId: command.leadId,
        aggregateType: 'PARTNER_LEAD',
      });
      const version = (events.at(-1)?.version ?? 0) + 1;
      const eventId = randomUUID();
      const eventPayload = buildLeadTransitionEventPayload(
        command.leadId,
        lead.status,
        command.nextStatus,
        command.reason ?? null,
      );
      const metadata: PartnerAcquisitionEventMetadata = {
        source: lead.channel,
        previousStatus: lead.status as never,
        nextStatus: command.nextStatus as never,
        ...(command.reason !== undefined && command.reason !== null ? { reason: command.reason } : {}),
      };

      await this.repository.appendEvent({
        tenantId,
        eventId,
        aggregateId: command.leadId,
        aggregateType: 'PARTNER_LEAD',
        eventType: 'PartnerLeadStatusChanged',
        actorUserId: command.actorUserId,
        requestId: command.requestId,
        correlationId: command.correlationId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.requestedAt,
        payload: eventPayload,
        metadata,
        version,
      });
      await this.repository.enqueueOutboxEvent({
        tenantId,
        eventId,
        aggregateId: command.leadId,
        aggregateType: 'PARTNER_LEAD',
        eventType: 'PartnerLeadStatusChanged',
        availableAt: command.requestedAt,
        payload: eventPayload,
      });
      await this.repository.markCommandProcessed({
        tenantId,
        idempotencyKey: command.idempotencyKey,
        processedAt: command.requestedAt,
        result: updatedLead as unknown as Record<string, unknown>,
      });

      return updatedLead;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        await this.repository.markCommandFailed({
          tenantId,
          idempotencyKey: command.idempotencyKey,
          failedAt: command.requestedAt,
          error: error.message,
        });
      }

      throw error;
    }
  }

  async promoteLeadToProspect(
    command: PromotePartnerLeadToProspectCommand,
  ): Promise<PromotePartnerLeadToProspectResult> {
    const tenantId = requireTenantContext(command.tenantId);
    requireActorUserId(command.actorUserId);
    const commandType = command.commandType as unknown as PartnerAcquisitionCommandRecordInput['commandType'];
    const payload = buildPromotionPayload(command);

    const commandRecord = await this.repository.recordCommand({
      tenantId,
      commandType,
      aggregateId: command.leadId,
      aggregateType: 'PARTNER_LEAD',
      actorUserId: command.actorUserId,
      requestId: command.requestId,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      receivedAt: command.requestedAt,
      payload,
    });

    if (!isSamePayload(commandRecord.payload, payload)) {
      throw new ConflictError('Partner acquisition idempotency payload mismatch');
    }

    if (commandRecord.status === 'PROCESSED') {
      if (!commandRecord.result) {
        throw new ConflictError('Partner acquisition replay is missing stored result');
      }

      return commandRecord.result as unknown as PromotePartnerLeadToProspectResult;
    }

    if (commandRecord.status === 'FAILED') {
      throwStoredCommandFailure(commandRecord);
    }

    try {
      const lead = await this.repository.findLeadById({
        tenantId,
        leadId: command.leadId,
      });

      if (!lead) {
        throw new NotFoundError('Partner lead not found');
      }

      if (!canPromotePartnerLeadToProspect(lead.status)) {
        throw new ConflictError(`Partner lead cannot be promoted from status ${lead.status}`);
      }

      const prospectLookup = await this.repository.findProspectByTenantAndLead({
        tenantId,
        leadId: command.leadId,
      });

      if (prospectLookup) {
        const replayResult = toPromotionResult(
          tenantId,
          command.leadId,
          prospectLookup.prospectId,
          false,
          true,
        );

        await this.repository.markCommandProcessed({
          tenantId,
          idempotencyKey: command.idempotencyKey,
          processedAt: command.requestedAt,
          result: replayResult as unknown as Record<string, unknown>,
        });

        return replayResult;
      }

      const prospect = await this.repository.promoteLeadToProspectInTransaction({
        tenantId,
        leadId: command.leadId,
        prospectCode: lead.leadCode,
      });

      if (!prospect) {
        throw new NotFoundError('Partner lead not found');
      }

      const result = toPromotionResult(
        tenantId,
        command.leadId,
        prospect.prospectId,
        true,
        false,
      );

      await this.repository.markCommandProcessed({
        tenantId,
        idempotencyKey: command.idempotencyKey,
        processedAt: command.requestedAt,
        result: result as unknown as Record<string, unknown>,
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        await this.repository.markCommandFailed({
          tenantId,
          idempotencyKey: command.idempotencyKey,
          failedAt: command.requestedAt,
          error: error.message,
        });
      }

      throw error;
    }
  }

  createProspect(input: PartnerAcquisitionProspectCreateInput): Promise<PartnerProspect> {
    return this.repository.createProspect(input);
  }

  findProspectById(
    input: PartnerAcquisitionProspectLookup,
  ): Promise<PartnerProspect | null> {
    return this.repository.findProspectById(input);
  }

  findProspectByTenantAndLead(
    input: PartnerAcquisitionProspectByLeadLookup,
  ): Promise<PartnerProspect | null> {
    return this.repository.findProspectByTenantAndLead(input);
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

  async convertProspectToPartner(
    input: ConvertPartnerProspectToPartnerCommand,
  ): Promise<PartnerProspect> {
    const tenantId = requireTenantContext(input.tenantId);
    requireActorUserId(input.actorUserId);

    return this.runInTransaction(async (transaction) => {
      const acquisitionService = new PartnerAcquisitionService(
        new PartnerAcquisitionPrismaRepository(transaction),
        this.runInTransaction,
      );
      const partnerService = new PartnerService(
        new PartnerPrismaRepository(transaction),
      );

      const prospect = await acquisitionService.findProspectById({
        tenantId,
        prospectId: input.prospectId,
      });

      if (!prospect) {
        throw new NotFoundError('Partner prospect not found for conversion');
      }

      const normalizedRequestedPartnerId = input.partnerId.trim();
      if (
        prospect.partnerId !== null &&
        prospect.partnerId !== undefined &&
        prospect.partnerId !== normalizedRequestedPartnerId
      ) {
        throw new ConflictError(
          'Partner prospect already linked to a different partner',
        );
      }

      let partner: Partner | null = null;
      const materializedPartnerId = prospect.partnerId ?? null;

      if (materializedPartnerId) {
        partner = await partnerService.getPartnerById({
          tenantId,
          partnerId: materializedPartnerId,
        });
      } else {
        let partnerByRequestedId: Partner | null = null;
        if (normalizedRequestedPartnerId) {
          try {
            partnerByRequestedId = await partnerService.getPartnerById({
              tenantId,
              partnerId: normalizedRequestedPartnerId,
            });
          } catch (error) {
            if (!(error instanceof PartnerNotFoundError)) {
              throw error;
            }
          }
        }

        if (partnerByRequestedId) {
          partner = partnerByRequestedId;
        } else {
          let partnerByCode: Partner | null = null;
          try {
            partnerByCode = await partnerService.getPartnerByCode({
              tenantId,
              code: input.partnerCode,
            });
          } catch (error) {
            if (!(error instanceof PartnerNotFoundError)) {
              throw error;
            }
          }

          partner =
            partnerByCode ??
            (await partnerService.createPartner({
              tenantId,
              actorUserId: input.actorUserId,
              correlationId: input.correlationId,
              code: input.partnerCode,
              name: input.partnerName,
              type: input.partnerType,
              document: prospect.document ?? null,
              email: prospect.email ?? null,
              phone: prospect.phone ?? null,
              status: 'ativo',
            }));
        }
      }

      if (!partner) {
        throw new NotFoundError('Partner not found for conversion');
      }

      const effectivePartnerId = partner.id;

      if (prospect.partnerId !== effectivePartnerId) {
        const linkedProspect = await acquisitionService.linkProspectToPartner({
          tenantId,
          prospectId: input.prospectId,
          expectedVersion: input.expectedVersion,
          partnerId: effectivePartnerId,
        });

        if (!linkedProspect) {
          throw new NotFoundError('Partner prospect not found for conversion');
        }
      }

      await acquisitionService.recordConversionDecision({
        tenantId,
        prospectId: input.prospectId,
        partnerId: effectivePartnerId,
        approved: true,
        decidedByUserId: input.actorUserId,
        decidedAt: input.conversionApprovedAt ?? input.requestedAt,
        reason: null,
      });

      const convertedProspect = await acquisitionService.updateProspectLifecycle({
        tenantId,
        prospectId: input.prospectId,
        expectedVersion: input.expectedVersion,
        status: 'CONVERTED',
        convertedAt: input.conversionApprovedAt ?? input.requestedAt,
      });

      if (!convertedProspect) {
        throw new NotFoundError('Partner prospect not found for conversion');
      }

      return convertedProspect;
    });
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
