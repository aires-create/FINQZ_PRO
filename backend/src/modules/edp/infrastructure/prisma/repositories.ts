import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@prisma/client';

import type { EdpAuditRecord, EdpAuditRepositoryContract, EdpCorrelationRecord, EdpCorrelationRepositoryContract, EdpEventStoreContract, EdpEventStoreRecord, EdpIdempotencyRecord, EdpIdempotencyRepositoryContract, EdpOutboxContract, EdpOutboxRecord, EdpRepositoryPort, EdpStoredAggregate, EdpVersionRecord, EdpVersionRepositoryContract } from '../../contracts/persistence.js';
import type { EdpEventEnvelope } from '../../contracts/envelopes.js';
import type { EdpEventName } from '../../contracts/events.js';
import type { EdpAggregateName } from '../../domain/aggregates.js';
import { toAuditRecord, toCorrelationRecord, toEventStoreRecord, toIdempotencyRecord, toJsonValue, toOutboxRecord, toStoredAggregate, toVersionRecord } from './mappers.js';

type PrismaEdpClient = PrismaClient | Prisma.TransactionClient;

type AggregateRow = {
  id: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: EdpAggregateName;
  version: number;
  state: string;
  snapshot: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type VersionRow = {
  id: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: 'DecisionPolicy' | 'DecisionStrategy';
  version: number;
  status: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rollbackOf: string | null;
  configSnapshot: Prisma.JsonValue;
  audit: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type EventStoreRow = {
  eventId: string;
  eventName: string;
  eventVersion: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;
  correlationId: string;
  causationId: string | null;
  payload: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
  occurredAt: Date;
  createdAt: Date;
};

type OutboxRow = {
  id: string;
  tenantId: string;
  eventName: string;
  eventId: string | null;
  aggregateId: string | null;
  aggregateType: string | null;
  status: string;
  attempts: number;
  nextAttemptAt: Date | null;
  publishedAt: Date | null;
  payload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type AuditRow = {
  id: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  eventName: string;
  actor: string;
  action: string;
  correlationId: string;
  payload: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type IdempotencyRow = {
  id: string;
  tenantId: string;
  idempotencyKey: string;
  commandName: string;
  commandHash: string;
  responseSnapshot: Prisma.JsonValue | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type CorrelationRow = {
  id: string;
  tenantId: string;
  correlationId: string;
  aggregateId: string | null;
  aggregateType: string | null;
  causationId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const toJsonRecord = (value: Record<string, unknown> | null | undefined) => toJsonValue(value);

const extractVersionPayload = (payload: Record<string, unknown>) => {
  const sanitizedPayload = { ...payload };
  const approvedAtValue = payload.approvedAt;

  const approvedBy = Object.prototype.hasOwnProperty.call(payload, 'approvedBy')
    ? (typeof payload.approvedBy === 'string' ? payload.approvedBy : null)
    : undefined;
  const approvedAt = Object.prototype.hasOwnProperty.call(payload, 'approvedAt')
    ? (() => {
        if (typeof approvedAtValue === 'string' || approvedAtValue instanceof Date) {
          const parsed = new Date(approvedAtValue);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        return null;
      })()
    : undefined;
  const rollbackOf = Object.prototype.hasOwnProperty.call(payload, 'rollbackOf')
    ? (typeof payload.rollbackOf === 'string' ? payload.rollbackOf : null)
    : undefined;

  delete sanitizedPayload.approvedBy;
  delete sanitizedPayload.approvedAt;
  delete sanitizedPayload.rollbackOf;

  return {
    approvedBy,
    approvedAt,
    rollbackOf,
    configSnapshot: sanitizedPayload,
  };
};

class PrismaAggregateRepository<TAggregate extends EdpStoredAggregate<EdpAggregateName, string>>
  implements EdpRepositoryPort<TAggregate>
{
  constructor(
    private readonly client: PrismaEdpClient,
    public readonly aggregateType: TAggregate['aggregateType'],
    private readonly model: 'edpDecision' | 'edpSimulation' | 'edpDecisionPolicy' | 'edpDecisionStrategy' | 'edpProposal' | 'edpRecommendation' | 'edpProviderCapability' | 'edpProviderExecution' | 'edpOperationCandidate' | 'edpAuditTimelineEvent',
  ) {}

  private get table() {
    return this.client[this.model] as any;
    /* eslint-disable @typescript-eslint/no-explicit-any */
  }

  async findById(tenantId: string, aggregateId: string): Promise<TAggregate | null> {
    const record = await this.table.findFirst({
      where: {
        tenantId,
        aggregateId,
        deletedAt: null,
      },
    });

    return record ? (toStoredAggregate(record as any) as TAggregate) : null;
  }

  async save(aggregate: TAggregate): Promise<TAggregate> {
    const snapshot = {
      aggregateId: aggregate.aggregateId,
      tenantId: aggregate.tenantId,
      aggregateType: aggregate.aggregateType,
      version: aggregate.version,
      state: aggregate.state,
      snapshot: toJsonRecord(aggregate.payload),
      deletedAt: null,
      createdAt: new Date(aggregate.createdAt),
      updatedAt: new Date(aggregate.updatedAt),
    };

    const record = await this.table.upsert({
      where: {
        tenantId_aggregateId: {
          tenantId: aggregate.tenantId,
          aggregateId: aggregate.aggregateId,
        },
      },
      create: {
        id: randomUUID(),
        ...snapshot,
      },
      update: {
        ...snapshot,
      },
    });

    return toStoredAggregate(record as any) as TAggregate;
  }

  async listByTenant(tenantId: string): Promise<TAggregate[]> {
    const records = await this.table.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return records.map((record: AggregateRow) => toStoredAggregate(record as any) as TAggregate);
  }
}

class PrismaVersionRepository implements EdpVersionRepositoryContract {
  constructor(
    private readonly client: PrismaEdpClient,
    private readonly model: 'edpDecisionPolicy' | 'edpDecisionStrategy',
    public readonly aggregateType: EdpVersionRecord['aggregateType'],
  ) {}

  private get table() {
    return this.client[this.model] as any;
  }

  async save(record: EdpVersionRecord): Promise<EdpVersionRecord> {
    const versionPayload = extractVersionPayload(record.payload);

    const row = await this.table.upsert({
      where: {
        tenantId_aggregateId_version: {
          tenantId: record.tenantId,
          aggregateId: record.aggregateId,
          version: record.version,
        },
      },
      create: {
        id: randomUUID(),
        tenantId: record.tenantId,
        aggregateId: record.aggregateId,
        version: record.version,
        status: record.status,
        effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
        effectiveTo: record.effectiveTo ? new Date(record.effectiveTo) : null,
        approvedBy: versionPayload.approvedBy ?? null,
        approvedAt: versionPayload.approvedAt ?? null,
        rollbackOf: versionPayload.rollbackOf ?? null,
        configSnapshot: toJsonRecord(versionPayload.configSnapshot),
        audit: null,
        deletedAt: null,
      },
      update: {
        status: record.status,
        effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
        effectiveTo: record.effectiveTo ? new Date(record.effectiveTo) : null,
        configSnapshot: toJsonRecord(versionPayload.configSnapshot),
        ...(versionPayload.approvedBy !== undefined ? { approvedBy: versionPayload.approvedBy } : {}),
        ...(versionPayload.approvedAt !== undefined ? { approvedAt: versionPayload.approvedAt } : {}),
        ...(versionPayload.rollbackOf !== undefined ? { rollbackOf: versionPayload.rollbackOf } : {}),
      },
    });

    return toVersionRecord({ ...(row as any), aggregateType: this.aggregateType });
  }

  async findLatest(
    tenantId: string,
    aggregateType: EdpVersionRecord['aggregateType'],
    aggregateId: string,
  ): Promise<EdpVersionRecord | null> {
    const record = await this.table.findFirst({
      where: {
        tenantId,
        aggregateId,
        deletedAt: null,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return record && aggregateType === this.aggregateType
      ? toVersionRecord({ ...(record as any), aggregateType: this.aggregateType })
      : record
        ? toVersionRecord({ ...(record as any), aggregateType: this.aggregateType })
        : null;
  }

  async listByAggregate(
    tenantId: string,
    aggregateType: EdpVersionRecord['aggregateType'],
    aggregateId: string,
  ): Promise<EdpVersionRecord[]> {
    const records = await this.table.findMany({
      where: {
        tenantId,
        aggregateId,
        deletedAt: null,
      },
      orderBy: {
        version: 'asc',
      },
    });

    if (aggregateType !== this.aggregateType) {
      return [];
    }

    return records.map((record: VersionRow) => toVersionRecord({ ...(record as any), aggregateType: this.aggregateType }));
  }
}

class PrismaEventStoreRepository implements EdpEventStoreContract {
  constructor(private readonly client: PrismaEdpClient) {}

  private get table() {
    return this.client.edpEventStore as any;
  }

  async append(event: EdpEventEnvelope<EdpEventName, Record<string, unknown>>): Promise<EdpEventStoreRecord> {
    const previous = await this.table.findMany({
      where: {
        tenantId: event.tenantId,
        aggregateId: event.aggregateId,
      },
      orderBy: {
        aggregateVersion: 'desc',
      },
    });

    const aggregateVersion = (previous.at(0)?.aggregateVersion ?? 0) + 1;
    const row = await this.table.create({
      data: {
        eventId: event.eventId,
        eventName: event.name,
        eventVersion: event.version,
        tenantId: event.tenantId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        aggregateVersion,
        correlationId: event.correlationId,
        causationId: event.causationId ?? null,
        payload: toJsonRecord(event.payload),
        metadata: event.metadata ? toJsonRecord(event.metadata) : null,
        occurredAt: new Date(event.timestamp),
      },
    });

    return toEventStoreRecord(row as any);
  }

  async listByAggregate(tenantId: string, aggregateId: string): Promise<EdpEventStoreRecord[]> {
    const records = await this.table.findMany({
      where: {
        tenantId,
        aggregateId,
      },
      orderBy: {
        aggregateVersion: 'asc',
      },
    });

    return records.map((record: EventStoreRow) => toEventStoreRecord(record as any));
  }

  async findByEventId(tenantId: string, eventId: string): Promise<EdpEventStoreRecord | null> {
    const record = await this.table.findFirst({
      where: {
        tenantId,
        eventId,
      },
    });

    return record ? toEventStoreRecord(record as any) : null;
  }
}

class PrismaOutboxRepository implements EdpOutboxContract {
  constructor(private readonly client: PrismaEdpClient) {}

  private get table() {
    return this.client.edpOutboxMessage as any;
  }

  async enqueue(
    record: Omit<EdpOutboxRecord, 'outboxId' | 'status'> & { status?: EdpOutboxRecord['status'] },
  ): Promise<EdpOutboxRecord> {
    const row = await this.table.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        eventName: record.eventName,
        eventId: record.eventId,
        aggregateId: record.aggregateId,
        aggregateType: record.aggregateType,
        payload: toJsonRecord(record.payload),
        status: record.status ?? 'PENDING',
        attempts: 0,
        nextAttemptAt: new Date(record.availableAt),
        publishedAt: null,
      },
    });

    return toOutboxRecord(row as any);
  }

  async listPending(tenantId: string): Promise<EdpOutboxRecord[]> {
    const records = await this.table.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return records.map((record: OutboxRow) => toOutboxRecord(record as any));
  }

  async markProcessed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null> {
    const record = await this.table.findFirst({
      where: {
        tenantId,
        eventId,
        deletedAt: null,
      },
    });

    if (!record) {
      return null;
    }

    const updated = await this.table.update({
      where: { id: record.id },
      data: {
        status: 'PROCESSED',
        attempts: record.attempts + 1,
        publishedAt: new Date(),
      },
    });

    return toOutboxRecord(updated as any);
  }

  async markFailed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null> {
    const record = await this.table.findFirst({
      where: {
        tenantId,
        eventId,
        deletedAt: null,
      },
    });

    if (!record) {
      return null;
    }

    const updated = await this.table.update({
      where: { id: record.id },
      data: {
        status: 'FAILED',
        attempts: record.attempts + 1,
      },
    });

    return toOutboxRecord(updated as any);
  }
}

class PrismaAuditRepository implements EdpAuditRepositoryContract {
  constructor(private readonly client: PrismaEdpClient) {}

  private get table() {
    return this.client.edpAuditTimelineEvent as any;
  }

  async append(record: EdpAuditRecord): Promise<EdpAuditRecord> {
    const row = await this.table.create({
      data: {
        id: randomUUID(),
        tenantId: record.tenantId,
        aggregateId: record.aggregateId,
        aggregateType: record.aggregateType,
        eventName: record.action,
        actor: record.actorId,
        action: record.action,
        correlationId: record.correlationId,
        payload: toJsonRecord(record.payload),
        metadata: null,
        timestamp: new Date(record.occurredAt),
      },
    });

    return toAuditRecord(row as any);
  }

  async listByAggregate(tenantId: string, aggregateId: string): Promise<EdpAuditRecord[]> {
    const records = await this.table.findMany({
      where: {
        tenantId,
        aggregateId,
        deletedAt: null,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return records.map((record: AuditRow) => toAuditRecord(record as any));
  }
}

class PrismaCorrelationRepository implements EdpCorrelationRepositoryContract {
  constructor(private readonly client: PrismaEdpClient) {}

  private get table() {
    return this.client.edpCorrelationRecord as any;
  }

  async upsert(record: EdpCorrelationRecord): Promise<EdpCorrelationRecord> {
    const row = await this.table.upsert({
      where: {
        tenantId_correlationId: {
          tenantId: record.tenantId,
          correlationId: record.correlationId,
        },
      },
      create: {
        id: randomUUID(),
        tenantId: record.tenantId,
        correlationId: record.correlationId,
        aggregateId: record.aggregateId ?? null,
        aggregateType: record.aggregateType ?? null,
        causationId: record.causationId ?? null,
        metadata: record.metadata ? toJsonRecord(record.metadata) : null,
      },
      update: {
        aggregateId: record.aggregateId ?? null,
        aggregateType: record.aggregateType ?? null,
        causationId: record.causationId ?? null,
        metadata: record.metadata ? toJsonRecord(record.metadata) : null,
      },
    });

    return toCorrelationRecord(row as any);
  }

  async findByCorrelationId(tenantId: string, correlationId: string): Promise<EdpCorrelationRecord | null> {
    const row = await this.table.findFirst({
      where: {
        tenantId,
        correlationId,
        deletedAt: null,
      },
    });

    return row ? toCorrelationRecord(row as any) : null;
  }
}

class PrismaIdempotencyRepository implements EdpIdempotencyRepositoryContract {
  constructor(private readonly client: PrismaEdpClient) {}

  private get table() {
    return this.client.edpIdempotencyRecord as any;
  }

  async remember(record: EdpIdempotencyRecord & {
    commandName?: string;
    commandHash?: string;
    responseSnapshot?: Record<string, unknown> | null;
    expiresAt?: string | null;
  }): Promise<EdpIdempotencyRecord> {
    const now = new Date();
    const row = await this.table.upsert({
      where: {
        tenantId_idempotencyKey: {
          tenantId: record.tenantId,
          idempotencyKey: record.idempotencyKey,
        },
      },
      create: {
        id: randomUUID(),
        tenantId: record.tenantId,
        idempotencyKey: record.idempotencyKey,
        commandName: record.commandName ?? record.owner,
        commandHash: record.commandHash ?? record.requestHash,
        responseSnapshot: record.responseSnapshot ? toJsonRecord(record.responseSnapshot) : null,
        status: record.status,
        expiresAt: record.expiresAt ? new Date(record.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      update: {
        commandName: record.commandName ?? record.owner,
        commandHash: record.commandHash ?? record.requestHash,
        responseSnapshot: record.responseSnapshot ? toJsonRecord(record.responseSnapshot) : null,
        status: record.status,
        expiresAt: record.expiresAt ? new Date(record.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    return toIdempotencyRecord(row as any);
  }

  async findByKey(tenantId: string, idempotencyKey: string): Promise<EdpIdempotencyRecord | null> {
    const row = await this.table.findFirst({
      where: {
        tenantId,
        idempotencyKey,
        deletedAt: null,
      },
    });

    return row ? toIdempotencyRecord(row as any) : null;
  }

  async markProcessed(
    tenantId: string,
    idempotencyKey: string,
    responseId?: string | null,
  ): Promise<EdpIdempotencyRecord | null> {
    const row = await this.table.findFirst({
      where: {
        tenantId,
        idempotencyKey,
        deletedAt: null,
      },
    });

    if (!row) {
      return null;
    }

    const updated = await this.table.update({
      where: { id: row.id },
      data: {
        status: 'PROCESSED',
        responseSnapshot: responseId ? toJsonRecord({ responseId }) : row.responseSnapshot,
      },
    });

    return toIdempotencyRecord(updated as any);
  }
}

export class DecisionRepository extends PrismaAggregateRepository<EdpStoredAggregate<'Decision', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'Decision', 'edpDecision');
  }
}

export class SimulationRepository extends PrismaAggregateRepository<EdpStoredAggregate<'Simulation', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'Simulation', 'edpSimulation');
  }
}

export class ProposalRepository extends PrismaAggregateRepository<EdpStoredAggregate<'Proposal', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'Proposal', 'edpProposal');
  }
}

export class RecommendationRepository extends PrismaAggregateRepository<EdpStoredAggregate<'Recommendation', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'Recommendation', 'edpRecommendation');
  }
}

export class ProviderCapabilityRepository extends PrismaAggregateRepository<EdpStoredAggregate<'ProviderCapability', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'ProviderCapability', 'edpProviderCapability');
  }
}

export class ProviderExecutionRepository extends PrismaAggregateRepository<EdpStoredAggregate<'ProviderExecution', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'ProviderExecution', 'edpProviderExecution');
  }
}

export class OperationCandidateRepository extends PrismaAggregateRepository<EdpStoredAggregate<'OperationCandidate', string>> {
  constructor(client: PrismaEdpClient) {
    super(client, 'OperationCandidate', 'edpOperationCandidate');
  }
}

export class AuditTimelineRepository extends PrismaAuditRepository {}
export class EventStoreRepository extends PrismaEventStoreRepository {}
export class OutboxRepository extends PrismaOutboxRepository {}
export class IdempotencyRepository extends PrismaIdempotencyRepository {}
export class CorrelationRepository extends PrismaCorrelationRepository {}
export class DecisionPolicyRepository extends PrismaVersionRepository {
  constructor(client: PrismaEdpClient) {
    super(client, 'edpDecisionPolicy', 'DecisionPolicy');
  }
}

export class DecisionStrategyRepository extends PrismaVersionRepository {
  constructor(client: PrismaEdpClient) {
    super(client, 'edpDecisionStrategy', 'DecisionStrategy');
  }
}

export const createPrismaEdpRepositoryRegistry = (client: PrismaEdpClient) => ({
  decisionRepository: new DecisionRepository(client),
  simulationRepository: new SimulationRepository(client),
  decisionPolicyRepository: new DecisionPolicyRepository(client),
  decisionStrategyRepository: new DecisionStrategyRepository(client),
  proposalRepository: new ProposalRepository(client),
  recommendationRepository: new RecommendationRepository(client),
  providerCapabilityRepository: new ProviderCapabilityRepository(client),
  providerExecutionRepository: new ProviderExecutionRepository(client),
  operationCandidateRepository: new OperationCandidateRepository(client),
  auditTimelineRepository: new AuditTimelineRepository(client),
  eventStoreRepository: new EventStoreRepository(client),
  outboxRepository: new OutboxRepository(client),
  idempotencyRepository: new IdempotencyRepository(client),
  correlationRepository: new CorrelationRepository(client),
});
