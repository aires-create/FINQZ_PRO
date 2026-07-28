import {
  Prisma,
  type PartnerAcquisitionCommandInbox,
  type PartnerAcquisitionConversionDecision as PartnerAcquisitionConversionDecisionRow,
  type PartnerAcquisitionEvent,
  type PartnerAcquisitionLead as PartnerAcquisitionLeadRow,
  type PartnerAcquisitionOutbox,
  type PartnerAcquisitionProspect as PartnerAcquisitionProspectRow,
} from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { tenantFilter } from '../../../core/prisma/filters.js';
import { ConflictError } from '../../../shared/errors/AppError.js';
import type {
  PartnerAcquisitionCommandFailureInput,
  PartnerAcquisitionCommandInboxStatus,
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
  PartnerAcquisitionLeadLifecycleUpdateInput,
  PartnerAcquisitionLeadProspectPromotionInput,
  PartnerAcquisitionLeadSoftDeleteInput,
  PartnerAcquisitionOutboxPendingQuery,
  PartnerAcquisitionOutboxProgressInput,
  PartnerAcquisitionOutboxStatus,
  PartnerAcquisitionOutboxRecordInput,
  PartnerAcquisitionProspectCodeLookup,
  PartnerAcquisitionProspectCreateInput,
  PartnerAcquisitionProspectByLeadLookup,
  PartnerAcquisitionProspectLifecycleUpdateInput,
  PartnerAcquisitionProspectLinkToPartnerInput,
  PartnerAcquisitionProspectListQuery,
  PartnerAcquisitionProspectLookup,
  PartnerAcquisitionProspectSoftDeleteInput,
  PartnerAcquisitionRepositoryContract,
} from './partner-acquisition.repository.contract.js';
import type {
  PartnerAcquisitionConversionDecision,
  PartnerAcquisitionEventMetadata,
  PartnerLead,
  PartnerLeadChannel,
  PartnerLeadStatus,
  PartnerProspect,
  PartnerProspectStatus,
} from '../domain/partner-acquisition.contract.js';

type PartnerAcquisitionPrismaClient = typeof prisma | Prisma.TransactionClient;

type LeadRow = PartnerAcquisitionLeadRow;
type ProspectRow = PartnerAcquisitionProspectRow;
type CommandRow = PartnerAcquisitionCommandInbox;
type EventRow = PartnerAcquisitionEvent;
type OutboxRow = PartnerAcquisitionOutbox;
type ConversionDecisionRow = PartnerAcquisitionConversionDecisionRow;

const DEFAULT_PENDING_OUTBOX_STATUS: Extract<
  PartnerAcquisitionOutboxPendingQuery['status'],
  'PENDING'
> = 'PENDING';

const toDate = (value: string): Date => new Date(value);
const UNIQUE_CONSTRAINT_CODE = 'P2002';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isUniqueConstraintError = (error: unknown): boolean => {
  if (!isRecord(error) || error.code !== UNIQUE_CONSTRAINT_CODE) {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const target = meta?.target;

  if (typeof target === 'string') {
    return target.includes('tenantId') && target.includes('leadId');
  }

  if (!isStringArray(target)) {
    return false;
  }

  const targetFields = new Set(target);

  return targetFields.has('tenantId') && targetFields.has('leadId');
};

const getUniqueConstraintTargetFields = (error: unknown): string[] | null => {
  if (!isRecord(error) || error.code !== UNIQUE_CONSTRAINT_CODE) {
    return null;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const target = meta?.target;

  if (typeof target === 'string') {
    return [target];
  }

  if (!isStringArray(target)) {
    return null;
  }

  return target;
};

const isUniqueConstraintTarget = (error: unknown, ...fields: string[]): boolean => {
  const target = getUniqueConstraintTargetFields(error);

  if (!target) {
    return false;
  }

  const targetFields = new Set(target);
  return fields.every((field) => targetFields.has(field));
};

const runInTransaction = async <T>(
  client: PartnerAcquisitionPrismaClient,
  action: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  if (typeof (client as typeof prisma).$transaction === 'function') {
    return (client as typeof prisma).$transaction((transaction) => action(transaction));
  }

  return action(client);
};

const buildLeadWhere = (
  input: PartnerAcquisitionLeadListQuery,
): Prisma.PartnerAcquisitionLeadWhereInput => {
  const where: Prisma.PartnerAcquisitionLeadWhereInput = {
    ...tenantFilter(input.tenantId),
    deletedAt: null,
  };

  if (input.status) {
    where.status = input.status;
  }

  if (input.channel) {
    where.channel = input.channel;
  }

  if (input.ownerUserId) {
    where.ownerUserId = input.ownerUserId;
  }

  return where;
};

const toLeadModel = (lead: LeadRow): PartnerLead => ({
  tenantId: lead.tenantId,
  leadId: lead.id,
  leadCode: lead.leadCode,
  fullName: lead.fullName,
  email: lead.email,
  phone: lead.phone,
  companyName: lead.companyName,
  document: lead.document,
  channel: lead.channel as PartnerLeadChannel,
  sourceName: lead.sourceName,
  sourceReference: lead.sourceReference,
  campaignId: lead.campaignId,
  hubContextId: lead.hubContextId,
  ownerUserId: lead.ownerUserId,
  status: lead.status as PartnerLeadStatus,
  score: lead.score,
  createdAt: lead.createdAt.toISOString(),
  updatedAt: lead.updatedAt.toISOString(),
});

const toProspectModel = (prospect: ProspectRow): PartnerProspect => ({
  tenantId: prospect.tenantId,
  prospectId: prospect.id,
  prospectCode: prospect.prospectCode,
  leadId: prospect.leadId,
  fullName: prospect.fullName,
  email: prospect.email,
  phone: prospect.phone,
  companyName: prospect.companyName,
  document: prospect.document,
  channel: prospect.channel as PartnerLeadChannel,
  sourceName: prospect.sourceName,
  sourceReference: prospect.sourceReference,
  campaignId: prospect.campaignId,
  hubContextId: prospect.hubContextId,
  sdrAgentId: prospect.sdrAgentId,
  status: prospect.status as PartnerProspectStatus,
  partnerId: prospect.partnerId,
  pipelineCode: prospect.pipelineCode,
  stageCode: prospect.stageCode,
  score: prospect.score,
  qualificationReason: prospect.qualificationReason,
  assignedUserId: prospect.assignedUserId,
  createdAt: prospect.createdAt.toISOString(),
  updatedAt: prospect.updatedAt.toISOString(),
  ...(prospect.nextActionAt ? { nextActionAt: prospect.nextActionAt.toISOString() } : {}),
  ...(prospect.signedAt ? { signedAt: prospect.signedAt.toISOString() } : {}),
  ...(prospect.convertedAt ? { convertedAt: prospect.convertedAt.toISOString() } : {}),
});

const toCommandRecord = (command: CommandRow): PartnerAcquisitionCommandRecordInput => ({
  tenantId: command.tenantId,
  commandType: command.commandType as PartnerAcquisitionCommandRecordInput['commandType'],
  aggregateId: command.aggregateId,
  aggregateType: command.aggregateType as PartnerAcquisitionCommandRecordInput['aggregateType'],
  actorUserId: command.actorUserId,
  requestId: command.requestId,
  correlationId: command.correlationId,
  idempotencyKey: command.idempotencyKey,
  status: command.status as PartnerAcquisitionCommandInboxStatus,
  receivedAt: command.receivedAt.toISOString(),
  payload: command.payload as Record<string, unknown>,
  ...(command.result !== null && command.result !== undefined
    ? { result: command.result as Record<string, unknown> }
    : {}),
});

const toEventRecord = (event: EventRow): PartnerAcquisitionEventRecordInput => ({
  tenantId: event.tenantId,
  eventId: event.eventId,
  aggregateId: event.aggregateId,
  aggregateType: event.aggregateType as PartnerAcquisitionEventRecordInput['aggregateType'],
  eventType: event.eventType as PartnerAcquisitionEventRecordInput['eventType'],
  actorUserId: event.actorUserId,
  requestId: event.requestId,
  correlationId: event.correlationId,
  idempotencyKey: event.idempotencyKey,
  occurredAt: event.occurredAt.toISOString(),
  payload: event.payload as Record<string, unknown>,
  metadata: event.metadata as PartnerAcquisitionEventMetadata | null,
  version: event.version,
});

const toOutboxRecord = (outbox: OutboxRow): PartnerAcquisitionOutboxRecordInput => ({
  tenantId: outbox.tenantId,
  eventId: outbox.eventId,
  aggregateId: outbox.aggregateId,
  aggregateType: outbox.aggregateType as PartnerAcquisitionOutboxRecordInput['aggregateType'],
  eventType: outbox.eventType as PartnerAcquisitionOutboxRecordInput['eventType'],
  status: outbox.status as PartnerAcquisitionOutboxStatus,
  availableAt: outbox.availableAt.toISOString(),
  payload: outbox.payload as Record<string, unknown>,
});

const toConversionDecision = (
  decision: ConversionDecisionRow,
): PartnerAcquisitionConversionDecision => ({
  tenantId: decision.tenantId,
  prospectId: decision.prospectId,
  partnerId: decision.partnerId,
  approved: decision.approved,
  decidedByUserId: decision.decidedByUserId,
  decidedAt: decision.decidedAt.toISOString(),
  reason: decision.reason,
});

const buildLeadCreateData = (
  input: PartnerAcquisitionLeadCreateInput,
)=> ({
  tenantId: input.tenantId,
  leadCode: input.leadCode,
  fullName: input.fullName,
  email: input.email ?? null,
  phone: input.phone ?? null,
  companyName: input.companyName ?? null,
  document: input.document ?? null,
  channel: input.channel,
  sourceName: input.sourceName ?? null,
  sourceReference: input.sourceReference ?? null,
  campaignId: input.campaignId ?? null,
  hubContextId: input.hubContextId ?? null,
  ownerUserId: input.ownerUserId ?? null,
  status: input.status ?? 'NEW',
  score: input.score ?? null,
});

const buildProspectCreateData = (
  input: PartnerAcquisitionProspectCreateInput,
)=> ({
  tenantId: input.tenantId,
  prospectCode: input.prospectCode,
  leadId: input.leadId,
  fullName: input.fullName,
  email: input.email ?? null,
  phone: input.phone ?? null,
  companyName: input.companyName ?? null,
  document: input.document ?? null,
  channel: input.channel,
  sourceName: input.sourceName ?? null,
  sourceReference: input.sourceReference ?? null,
  campaignId: input.campaignId ?? null,
  hubContextId: input.hubContextId ?? null,
  sdrAgentId: input.sdrAgentId ?? null,
  status: input.status ?? 'NEW',
  pipelineId: input.pipelineId ?? null,
  stageId: input.stageId ?? null,
  pipelineCode: input.pipelineCode ?? null,
  stageCode: input.stageCode ?? null,
  score: input.score ?? null,
  qualificationReason: input.qualificationReason ?? null,
  assignedUserId: input.assignedUserId ?? null,
  nextActionAt: input.nextActionAt ? toDate(input.nextActionAt) : null,
  signedAt: input.signedAt ? toDate(input.signedAt) : null,
  convertedAt: input.convertedAt ? toDate(input.convertedAt) : null,
  partnerId: input.partnerId ?? null,
});

const buildCommandCreateData = (
  input: PartnerAcquisitionCommandRecordInput,
)=> ({
  tenantId: input.tenantId,
  commandType: input.commandType,
  aggregateId: input.aggregateId ?? null,
  aggregateType: input.aggregateType,
  actorUserId: input.actorUserId,
  requestId: input.requestId,
  correlationId: input.correlationId,
  idempotencyKey: input.idempotencyKey,
  status: input.status ?? 'RECEIVED',
  receivedAt: toDate(input.receivedAt),
  payload: input.payload as Prisma.InputJsonValue,
  ...(input.result !== undefined
    ? {
        result:
          input.result === null
            ? Prisma.DbNull
            : (input.result as Prisma.InputJsonValue),
      }
    : {}),
});

const buildEventCreateData = (
  input: PartnerAcquisitionEventRecordInput,
)=> ({
  tenantId: input.tenantId,
  eventId: input.eventId,
  aggregateId: input.aggregateId,
  aggregateType: input.aggregateType,
  eventType: input.eventType,
  actorUserId: input.actorUserId,
  requestId: input.requestId,
  correlationId: input.correlationId,
  idempotencyKey: input.idempotencyKey,
  occurredAt: toDate(input.occurredAt),
  payload: input.payload as Prisma.InputJsonValue,
  ...(input.metadata !== undefined
    ? {
        metadata:
          input.metadata === null
            ? Prisma.DbNull
            : (input.metadata as Prisma.InputJsonValue),
      }
    : {}),
  version: input.version,
});

const buildOutboxCreateData = (
  input: PartnerAcquisitionOutboxRecordInput,
)=> ({
  tenantId: input.tenantId,
  eventId: input.eventId,
  aggregateId: input.aggregateId,
  aggregateType: input.aggregateType,
  eventType: input.eventType,
  status: input.status ?? 'PENDING',
  availableAt: toDate(input.availableAt),
  payload: input.payload as Prisma.InputJsonValue,
});

const buildConversionDecisionCreateData = (
  input: PartnerAcquisitionConversionDecisionRecordInput,
)=> ({
  tenantId: input.tenantId,
  prospectId: input.prospectId,
  partnerId: input.partnerId ?? null,
  approved: input.approved,
  decidedByUserId: input.decidedByUserId,
  decidedAt: toDate(input.decidedAt),
  reason: input.reason ?? null,
});

const findLeadByTenantAndId = (
  client: PartnerAcquisitionPrismaClient,
  tenantId: string,
  leadId: string,
) => {
  return client.partnerAcquisitionLead.findFirst({
    where: {
      id: leadId,
      ...tenantFilter(tenantId),
      deletedAt: null,
    },
  });
};

const findProspectByTenantAndId = (
  client: PartnerAcquisitionPrismaClient,
  tenantId: string,
  prospectId: string,
) => {
  return client.partnerAcquisitionProspect.findFirst({
    where: {
      id: prospectId,
      ...tenantFilter(tenantId),
      deletedAt: null,
    },
  });
};

const findProspectByTenantAndLeadRow = (
  client: PartnerAcquisitionPrismaClient,
  tenantId: string,
  leadId: string,
) => {
  return client.partnerAcquisitionProspect.findFirst({
    where: {
      leadId,
      ...tenantFilter(tenantId),
      deletedAt: null,
    },
  });
};

const findProspectByTenantAndCodeRow = (
  client: PartnerAcquisitionPrismaClient,
  tenantId: string,
  prospectCode: string,
) => {
  return client.partnerAcquisitionProspect.findFirst({
    where: {
      prospectCode,
      ...tenantFilter(tenantId),
      deletedAt: null,
    },
  });
};

export class PartnerAcquisitionPrismaRepository
  implements PartnerAcquisitionRepositoryContract
{
  constructor(private readonly client: PartnerAcquisitionPrismaClient = prisma) {}

  async createLead(
    input: PartnerAcquisitionLeadCreateInput,
  ): Promise<PartnerLead> {
    const lead = await this.client.partnerAcquisitionLead.create({
      data: buildLeadCreateData(input),
    });

    return toLeadModel(lead);
  }

  async findLeadById(
    input: PartnerAcquisitionLeadLookup,
  ): Promise<PartnerLead | null> {
    const lead = await findLeadByTenantAndId(this.client, input.tenantId, input.leadId);

    return lead ? toLeadModel(lead) : null;
  }

  async findLeadByCode(
    input: PartnerAcquisitionLeadCodeLookup,
  ): Promise<PartnerLead | null> {
    const lead = await this.client.partnerAcquisitionLead.findFirst({
      where: {
        leadCode: input.leadCode,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
    });

    return lead ? toLeadModel(lead) : null;
  }

  async listLeads(
    input: PartnerAcquisitionLeadListQuery,
  ): Promise<PartnerLead[]> {
    const leads = await this.client.partnerAcquisitionLead.findMany({
      where: buildLeadWhere(input),
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    return leads.map(toLeadModel);
  }

  async softDeleteLead(
    input: PartnerAcquisitionLeadSoftDeleteInput,
  ): Promise<PartnerLead | null> {
    const updated = await this.client.partnerAcquisitionLead.updateMany({
      where: {
        id: input.leadId,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
      data: {
        deletedAt: toDate(input.deletedAt),
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const lead = await findLeadByTenantAndId(this.client, input.tenantId, input.leadId);

    return lead ? toLeadModel(lead) : null;
  }

  async updateLeadLifecycle(
    input: PartnerAcquisitionLeadLifecycleUpdateInput,
  ): Promise<PartnerLead | null> {
    return runInTransaction(this.client, async (transaction) => {
      const updated = await transaction.partnerAcquisitionLead.updateMany({
        where: {
          id: input.leadId,
          ...tenantFilter(input.tenantId),
          deletedAt: null,
        },
        data: {
          status: input.status,
          version: {
            increment: 1,
          },
        },
      });

      if (updated.count !== 1) {
        return null;
      }

      const lead = await findLeadByTenantAndId(transaction, input.tenantId, input.leadId);

      return lead ? toLeadModel(lead) : null;
    });
  }

  async createProspect(
    input: PartnerAcquisitionProspectCreateInput,
  ): Promise<PartnerProspect> {
    try {
      const prospect = await this.client.partnerAcquisitionProspect.create({
        data: buildProspectCreateData(input),
      });

      return toProspectModel(prospect);
    } catch (error) {
      if (!isUniqueConstraintTarget(error, 'tenantId', 'prospectCode')) {
        throw error;
      }

      throw new ConflictError('Partner prospect code is already in use');
    }
  }

  async findProspectById(
    input: PartnerAcquisitionProspectLookup,
  ): Promise<PartnerProspect | null> {
    const prospect = await findProspectByTenantAndId(
      this.client,
      input.tenantId,
      input.prospectId,
    );

    return prospect ? toProspectModel(prospect) : null;
  }

  async findProspectByTenantAndLead(
    input: PartnerAcquisitionProspectByLeadLookup,
  ): Promise<PartnerProspect | null> {
    const prospect = await findProspectByTenantAndLeadRow(
      this.client,
      input.tenantId,
      input.leadId,
    );

    return prospect ? toProspectModel(prospect) : null;
  }

  async findProspectByCode(
    input: PartnerAcquisitionProspectCodeLookup,
  ): Promise<PartnerProspect | null> {
    const prospect = await this.client.partnerAcquisitionProspect.findFirst({
      where: {
        prospectCode: input.prospectCode,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
    });

    return prospect ? toProspectModel(prospect) : null;
  }

  async listProspects(
    input: PartnerAcquisitionProspectListQuery,
  ): Promise<PartnerProspect[]> {
    const prospects = await this.client.partnerAcquisitionProspect.findMany({
      where: {
        ...tenantFilter(input.tenantId),
        deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(input.channel ? { channel: input.channel } : {}),
        ...(input.pipelineCode ? { pipelineCode: input.pipelineCode } : {}),
        ...(input.stageCode ? { stageCode: input.stageCode } : {}),
        ...(input.assignedUserId ? { assignedUserId: input.assignedUserId } : {}),
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    return prospects.map(toProspectModel);
  }

  async updateProspectLifecycle(
    input: PartnerAcquisitionProspectLifecycleUpdateInput,
  ): Promise<PartnerProspect | null> {
    return runInTransaction(this.client, async (transaction) => {
      const result = await transaction.partnerAcquisitionProspect.updateMany({
        where: {
          id: input.prospectId,
          ...tenantFilter(input.tenantId),
          deletedAt: null,
          version: input.expectedVersion,
        },
        data: {
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.score !== undefined ? { score: input.score } : {}),
          ...(input.qualificationReason !== undefined
            ? { qualificationReason: input.qualificationReason }
            : {}),
          ...(input.assignedUserId !== undefined
            ? { assignedUserId: input.assignedUserId }
            : {}),
          ...(input.pipelineId !== undefined ? { pipelineId: input.pipelineId } : {}),
          ...(input.stageId !== undefined ? { stageId: input.stageId } : {}),
          ...(input.pipelineCode !== undefined ? { pipelineCode: input.pipelineCode } : {}),
          ...(input.stageCode !== undefined ? { stageCode: input.stageCode } : {}),
          ...(input.nextActionAt !== undefined
            ? { nextActionAt: input.nextActionAt ? toDate(input.nextActionAt) : null }
            : {}),
          ...(input.signedAt !== undefined
            ? { signedAt: input.signedAt ? toDate(input.signedAt) : null }
            : {}),
          ...(input.convertedAt !== undefined
            ? { convertedAt: input.convertedAt ? toDate(input.convertedAt) : null }
            : {}),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictError('Partner acquisition prospect version conflict');
      }

      const prospect = await findProspectByTenantAndId(
        transaction,
        input.tenantId,
        input.prospectId,
      );

      return prospect ? toProspectModel(prospect) : null;
    });
  }

  async linkProspectToPartner(
    input: PartnerAcquisitionProspectLinkToPartnerInput,
  ): Promise<PartnerProspect | null> {
    return runInTransaction(this.client, async (transaction) => {
      const result = await transaction.partnerAcquisitionProspect.updateMany({
        where: {
          id: input.prospectId,
          ...tenantFilter(input.tenantId),
          deletedAt: null,
          version: input.expectedVersion,
        },
        data: {
          partnerId: input.partnerId,
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictError('Partner acquisition prospect version conflict');
      }

      const prospect = await findProspectByTenantAndId(
        transaction,
        input.tenantId,
        input.prospectId,
      );

      return prospect ? toProspectModel(prospect) : null;
    });
  }

  async softDeleteProspect(
    input: PartnerAcquisitionProspectSoftDeleteInput,
  ): Promise<PartnerProspect | null> {
    return runInTransaction(this.client, async (transaction) => {
      const result = await transaction.partnerAcquisitionProspect.updateMany({
        where: {
          id: input.prospectId,
          ...tenantFilter(input.tenantId),
          deletedAt: null,
          ...(input.expectedVersion !== undefined
            ? { version: input.expectedVersion }
            : {}),
        },
        data: {
          deletedAt: toDate(input.deletedAt),
          ...(input.expectedVersion !== undefined
            ? {
                version: {
                  increment: 1,
                },
              }
            : {}),
        },
      });

      if (result.count !== 1) {
        return null;
      }

      const prospect = await findProspectByTenantAndId(
        transaction,
        input.tenantId,
        input.prospectId,
      );

      return prospect ? toProspectModel(prospect) : null;
    });
  }

  async promoteLeadToProspectInTransaction(
    input: PartnerAcquisitionLeadProspectPromotionInput,
  ): Promise<PartnerProspect | null> {
    try {
      return await runInTransaction(this.client, async (transaction) => {
        const lead = await findLeadByTenantAndId(transaction, input.tenantId, input.leadId);

        if (!lead) {
          return null;
        }

        const existingProspect = await findProspectByTenantAndLeadRow(
          transaction,
          input.tenantId,
          input.leadId,
        );

        if (existingProspect) {
          return toProspectModel(existingProspect);
        }

        const prospectData = buildProspectCreateData({
          tenantId: input.tenantId,
          prospectCode: input.prospectCode,
          leadId: input.leadId,
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.companyName,
          document: lead.document,
          channel: lead.channel,
          sourceName: lead.sourceName,
          sourceReference: lead.sourceReference,
          campaignId: lead.campaignId,
          hubContextId: lead.hubContextId,
          ownerUserId: lead.ownerUserId,
          status: 'NEW',
          score: lead.score,
        } as PartnerAcquisitionProspectCreateInput);

        const prospect = await transaction.partnerAcquisitionProspect.create({
          data: prospectData,
        });

        return toProspectModel(prospect);
      });
    } catch (error) {
      const isLeadIdCollision = isUniqueConstraintTarget(error, 'tenantId', 'leadId');
      const isProspectCodeCollision = isUniqueConstraintTarget(
        error,
        'tenantId',
        'prospectCode',
      );

      if (!isLeadIdCollision && !isProspectCodeCollision) {
        throw error;
      }

      const existing = await findProspectByTenantAndLeadRow(
        this.client,
        input.tenantId,
        input.leadId,
      );

      if (existing) {
        return toProspectModel(existing);
      }

      const conflictingProspect = await findProspectByTenantAndCodeRow(
        this.client,
        input.tenantId,
        input.prospectCode,
      );

      if (conflictingProspect && conflictingProspect.leadId === input.leadId) {
        return toProspectModel(conflictingProspect);
      }

      if (conflictingProspect) {
        throw new ConflictError('Prospect code is already assigned to another lead');
      }

      throw new ConflictError('Partner prospect code is already in use');
    }
  }

  async recordCommand(
    input: PartnerAcquisitionCommandRecordInput,
  ): Promise<PartnerAcquisitionCommandRecordInput> {
    const command = await this.client.partnerAcquisitionCommandInbox.upsert({
      where: {
        tenantId_idempotencyKey: {
          tenantId: input.tenantId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      create: buildCommandCreateData(input),
      update: {},
    });

    return toCommandRecord(command);
  }

  async findCommandByIdempotencyKey(
    input: PartnerAcquisitionCommandLookup,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    const command = await this.client.partnerAcquisitionCommandInbox.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        idempotencyKey: input.idempotencyKey,
      },
    });

    return command ? toCommandRecord(command) : null;
  }

  async markCommandProcessed(
    input: PartnerAcquisitionCommandProgressInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    const updated = await this.client.partnerAcquisitionCommandInbox.updateMany({
      where: {
        ...tenantFilter(input.tenantId),
        idempotencyKey: input.idempotencyKey,
      },
      data: {
        status: 'PROCESSED',
        ...(input.processedAt ? { processedAt: toDate(input.processedAt) } : {}),
        ...(input.result !== undefined
          ? {
              result:
                input.result === null
                  ? Prisma.DbNull
                  : (input.result as Prisma.InputJsonValue),
            }
          : {}),
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const command = await this.client.partnerAcquisitionCommandInbox.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        idempotencyKey: input.idempotencyKey,
      },
    });

    return command ? toCommandRecord(command) : null;
  }

  async markCommandFailed(
    input: PartnerAcquisitionCommandFailureInput,
  ): Promise<PartnerAcquisitionCommandRecordInput | null> {
    const updated = await this.client.partnerAcquisitionCommandInbox.updateMany({
      where: {
        ...tenantFilter(input.tenantId),
        idempotencyKey: input.idempotencyKey,
      },
      data: {
        status: 'FAILED',
        result: {
          error: input.error,
        } as Prisma.InputJsonValue,
        ...(input.failedAt ? { processedAt: toDate(input.failedAt) } : {}),
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const command = await this.client.partnerAcquisitionCommandInbox.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        idempotencyKey: input.idempotencyKey,
      },
    });

    return command ? toCommandRecord(command) : null;
  }

  async appendEvent(
    input: PartnerAcquisitionEventRecordInput,
  ): Promise<PartnerAcquisitionEventRecordInput> {
    const event = await this.client.partnerAcquisitionEvent.create({
      data: buildEventCreateData(input),
    });

    return toEventRecord(event);
  }

  async listEventsByAggregate(
    input: PartnerAcquisitionEventByAggregateQuery,
  ): Promise<PartnerAcquisitionEventRecordInput[]> {
    const events = await this.client.partnerAcquisitionEvent.findMany({
      where: {
        ...tenantFilter(input.tenantId),
        aggregateId: input.aggregateId,
        aggregateType: input.aggregateType,
      },
      orderBy: [
        {
          occurredAt: 'asc',
        },
        {
          version: 'asc',
        },
      ],
      ...(input.limit ? { take: input.limit } : {}),
    });

    return events.map(toEventRecord);
  }

  async findEventByEventId(
    input: PartnerAcquisitionEventLookup,
  ): Promise<PartnerAcquisitionEventRecordInput | null> {
    const event = await this.client.partnerAcquisitionEvent.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        eventId: input.eventId,
      },
    });

    return event ? toEventRecord(event) : null;
  }

  async enqueueOutboxEvent(
    input: PartnerAcquisitionOutboxRecordInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput> {
    const outbox = await this.client.partnerAcquisitionOutbox.create({
      data: buildOutboxCreateData(input),
    });

    return toOutboxRecord(outbox);
  }

  async listPendingOutboxEvents(
    input: PartnerAcquisitionOutboxPendingQuery,
  ): Promise<PartnerAcquisitionOutboxRecordInput[]> {
    const outboxes = await this.client.partnerAcquisitionOutbox.findMany({
      where: {
        ...tenantFilter(input.tenantId),
        status: input.status ?? DEFAULT_PENDING_OUTBOX_STATUS,
        availableAt: {
          lte: input.availableAtBefore ? toDate(input.availableAtBefore) : new Date(),
        },
      },
      orderBy: [
        {
          availableAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      ...(input.limit ? { take: input.limit } : {}),
    });

    return outboxes.map(toOutboxRecord);
  }

  async markOutboxProcessed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null> {
    const updated = await this.client.partnerAcquisitionOutbox.updateMany({
      where: {
        ...tenantFilter(input.tenantId),
        eventId: input.eventId,
      },
      data: {
        status: 'PROCESSED',
        ...(input.processedAt ? { processedAt: toDate(input.processedAt) } : {}),
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const outbox = await this.client.partnerAcquisitionOutbox.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        eventId: input.eventId,
      },
    });

    return outbox ? toOutboxRecord(outbox) : null;
  }

  async markOutboxFailed(
    input: PartnerAcquisitionOutboxProgressInput,
  ): Promise<PartnerAcquisitionOutboxRecordInput | null> {
    const updated = await this.client.partnerAcquisitionOutbox.updateMany({
      where: {
        ...tenantFilter(input.tenantId),
        eventId: input.eventId,
      },
      data: {
        status: 'FAILED',
        ...(input.processedAt ? { processedAt: toDate(input.processedAt) } : {}),
        ...(input.lastError ? { lastError: input.lastError } : {}),
        ...(input.attemptCount !== undefined ? { attemptCount: input.attemptCount } : {}),
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    const outbox = await this.client.partnerAcquisitionOutbox.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        eventId: input.eventId,
      },
    });

    return outbox ? toOutboxRecord(outbox) : null;
  }

  async recordConversionDecision(
    input: PartnerAcquisitionConversionDecisionRecordInput,
  ): Promise<PartnerAcquisitionConversionDecision> {
    const decision = await this.client.partnerAcquisitionConversionDecision.upsert({
      where: {
        tenantId_prospectId: {
          tenantId: input.tenantId,
          prospectId: input.prospectId,
        },
      },
      create: buildConversionDecisionCreateData(input),
      update: buildConversionDecisionCreateData(input),
    });

    return toConversionDecision(decision);
  }

  async findConversionDecisionByProspectId(
    input: PartnerAcquisitionConversionDecisionLookup,
  ): Promise<PartnerAcquisitionConversionDecision | null> {
    const decision = await this.client.partnerAcquisitionConversionDecision.findFirst({
      where: {
        ...tenantFilter(input.tenantId),
        prospectId: input.prospectId,
      },
    });

    return decision ? toConversionDecision(decision) : null;
  }
}

export const partnerAcquisitionPrismaRepository =
  new PartnerAcquisitionPrismaRepository();
