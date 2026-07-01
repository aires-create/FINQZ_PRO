import { randomUUID } from 'node:crypto';

import type {
  EdpAggregatePersistenceContract,
  EdpAuditRecord,
  EdpAuditRepositoryContract,
  EdpCorrelationRecord,
  EdpCorrelationRepositoryContract,
  EdpEventStoreContract,
  EdpEventStoreRecord,
  EdpIdempotencyRecord,
  EdpIdempotencyRepositoryContract,
  EdpOutboxContract,
  EdpOutboxRecord,
  EdpRepositoryPort,
  EdpStoredAggregate,
  EdpVersionRecord,
  EdpVersionRepositoryContract,
} from '../../contracts/persistence.js';
import type { EdpEventEnvelope } from '../../contracts/envelopes.js';
import type { EdpEventName } from '../../contracts/events.js';
import type { EdpAggregateName } from '../../domain/aggregates.js';
import { mapAuditRecord, mapCorrelationRecord, mapEventStoreRecord, mapIdempotencyRecord, mapOutboxRecord, mapStoredAggregate, mapVersionRecord } from '../../domain/mappers.js';

type AggregateKey = `${string}:${string}`;

const buildKey = (tenantId: string, aggregateId: string): AggregateKey => `${tenantId}:${aggregateId}`;

class InMemoryAggregateRepository<TAggregate extends EdpStoredAggregate<EdpAggregateName, string>>
  implements EdpRepositoryPort<TAggregate>, EdpAggregatePersistenceContract<TAggregate>
{
  private readonly store = new Map<AggregateKey, TAggregate>();

  constructor(public readonly aggregateType: TAggregate['aggregateType']) {}

  async findById(tenantId: string, aggregateId: string): Promise<TAggregate | null> {
    return this.store.get(buildKey(tenantId, aggregateId)) ?? null;
  }

  async load(tenantId: string, aggregateId: string): Promise<TAggregate | null> {
    return this.findById(tenantId, aggregateId);
  }

  async save(aggregate: TAggregate): Promise<TAggregate> {
    const snapshot = mapStoredAggregate(aggregate) as TAggregate;
    this.store.set(buildKey(snapshot.tenantId, snapshot.aggregateId), snapshot);
    return snapshot;
  }

  async listByTenant(tenantId: string): Promise<TAggregate[]> {
    return [...this.store.values()].filter((aggregate) => aggregate.tenantId === tenantId);
  }
}

class InMemoryEventStore implements EdpEventStoreContract {
  private readonly records: EdpEventStoreRecord[] = [];

  async append(event: EdpEventEnvelope<EdpEventName, Record<string, unknown>>): Promise<EdpEventStoreRecord> {
    const version =
      this.records
        .filter((record) => record.tenantId === event.tenantId && record.aggregateId === event.aggregateId)
        .at(-1)?.version ?? 0;

    const record: EdpEventStoreRecord = mapEventStoreRecord({
      eventId: event.eventId,
      eventName: event.name,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      causationId: event.causationId ?? null,
      version: version + 1,
      payload: event.payload,
      occurredAt: event.timestamp,
    });

    this.records.push(record);
    return record;
  }

  async listByAggregate(tenantId: string, aggregateId: string): Promise<EdpEventStoreRecord[]> {
    return this.records
      .filter((record) => record.tenantId === tenantId && record.aggregateId === aggregateId)
      .map(mapEventStoreRecord);
  }

  async findByEventId(tenantId: string, eventId: string): Promise<EdpEventStoreRecord | null> {
    const record = this.records.find((entry) => entry.tenantId === tenantId && entry.eventId === eventId);
    return record ? mapEventStoreRecord(record) : null;
  }
}

class InMemoryOutbox implements EdpOutboxContract {
  private readonly records: EdpOutboxRecord[] = [];

  async enqueue(
    record: Omit<EdpOutboxRecord, 'outboxId' | 'status'> & { status?: EdpOutboxRecord['status'] },
  ): Promise<EdpOutboxRecord> {
    const snapshot = mapOutboxRecord({
      outboxId: randomUUID(),
      status: record.status ?? 'PENDING',
      ...record,
    });

    this.records.push(snapshot);
    return snapshot;
  }

  async listPending(tenantId: string): Promise<EdpOutboxRecord[]> {
    return this.records
      .filter((record) => record.tenantId === tenantId && record.status === 'PENDING')
      .map(mapOutboxRecord);
  }

  async markProcessed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null> {
    const record = this.records.find((entry) => entry.tenantId === tenantId && entry.eventId === eventId);
    if (!record) {
      return null;
    }

    record.status = 'PROCESSED';
    return mapOutboxRecord(record);
  }

  async markFailed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null> {
    const record = this.records.find((entry) => entry.tenantId === tenantId && entry.eventId === eventId);
    if (!record) {
      return null;
    }

    record.status = 'FAILED';
    return mapOutboxRecord(record);
  }
}

class InMemoryAuditRepository implements EdpAuditRepositoryContract {
  private readonly records: EdpAuditRecord[] = [];

  async append(record: EdpAuditRecord): Promise<EdpAuditRecord> {
    const snapshot = mapAuditRecord(record);
    this.records.push(snapshot);
    return snapshot;
  }

  async listByAggregate(tenantId: string, aggregateId: string): Promise<EdpAuditRecord[]> {
    return this.records
      .filter((record) => record.tenantId === tenantId && record.aggregateId === aggregateId)
      .map(mapAuditRecord);
  }
}

class InMemoryVersionRepository implements EdpVersionRepositoryContract {
  private readonly records: EdpVersionRecord[] = [];

  async save(record: EdpVersionRecord): Promise<EdpVersionRecord> {
    const snapshot = mapVersionRecord(record);
    this.records.push(snapshot);
    return snapshot;
  }

  async findLatest(
    tenantId: string,
    aggregateType: EdpVersionRecord['aggregateType'],
    aggregateId: string,
  ): Promise<EdpVersionRecord | null> {
    const matches = this.records.filter(
      (record) =>
        record.tenantId === tenantId &&
        record.aggregateType === aggregateType &&
        record.aggregateId === aggregateId,
    );

    const latest = matches.at(-1);
    return latest ? mapVersionRecord(latest) : null;
  }

  async listByAggregate(
    tenantId: string,
    aggregateType: EdpVersionRecord['aggregateType'],
    aggregateId: string,
  ): Promise<EdpVersionRecord[]> {
    return this.records
      .filter(
        (record) =>
          record.tenantId === tenantId &&
          record.aggregateType === aggregateType &&
          record.aggregateId === aggregateId,
      )
      .map(mapVersionRecord);
  }
}

class InMemoryCorrelationRepository implements EdpCorrelationRepositoryContract {
  private readonly records = new Map<string, EdpCorrelationRecord>();

  async upsert(record: EdpCorrelationRecord): Promise<EdpCorrelationRecord> {
    const snapshot = mapCorrelationRecord(record);
    this.records.set(buildKey(snapshot.tenantId, snapshot.correlationId), snapshot);
    return snapshot;
  }

  async findByCorrelationId(tenantId: string, correlationId: string): Promise<EdpCorrelationRecord | null> {
    const record = this.records.get(buildKey(tenantId, correlationId));
    return record ? mapCorrelationRecord(record) : null;
  }
}

class InMemoryIdempotencyRepository implements EdpIdempotencyRepositoryContract {
  private readonly records = new Map<string, EdpIdempotencyRecord>();

  async remember(record: EdpIdempotencyRecord): Promise<EdpIdempotencyRecord> {
    const snapshot = mapIdempotencyRecord(record);
    this.records.set(buildKey(snapshot.tenantId, snapshot.idempotencyKey), snapshot);
    return snapshot;
  }

  async findByKey(tenantId: string, idempotencyKey: string): Promise<EdpIdempotencyRecord | null> {
    const record = this.records.get(buildKey(tenantId, idempotencyKey));
    return record ? mapIdempotencyRecord(record) : null;
  }

  async markProcessed(
    tenantId: string,
    idempotencyKey: string,
    responseId?: string | null,
  ): Promise<EdpIdempotencyRecord | null> {
    const record = this.records.get(buildKey(tenantId, idempotencyKey));
    if (!record) {
      return null;
    }

    record.status = 'PROCESSED';
    record.updatedAt = new Date().toISOString();
    if (responseId) {
      record.responseId = responseId;
    }

    return mapIdempotencyRecord(record);
  }
}

export interface InMemoryEdpRepositoryRegistry {
  Decision: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  Simulation: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  DecisionPolicy: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  DecisionStrategy: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  Proposal: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  Recommendation: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  ProviderCapability: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  ProviderExecution: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  OperationCandidate: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
  AuditTimeline: EdpRepositoryPort<EdpStoredAggregate<EdpAggregateName, string>>;
}

export const createInMemoryEdpRepositoryRegistry = (): InMemoryEdpRepositoryRegistry => {
  const registry = {
    Decision: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'Decision', string>>('Decision'),
    Simulation: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'Simulation', string>>('Simulation'),
    DecisionPolicy: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'DecisionPolicy', string>>('DecisionPolicy'),
    DecisionStrategy: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'DecisionStrategy', string>>('DecisionStrategy'),
    Proposal: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'Proposal', string>>('Proposal'),
    Recommendation: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'Recommendation', string>>('Recommendation'),
    ProviderCapability: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'ProviderCapability', string>>('ProviderCapability'),
    ProviderExecution: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'ProviderExecution', string>>('ProviderExecution'),
    OperationCandidate: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'OperationCandidate', string>>('OperationCandidate'),
    AuditTimeline: createInMemoryEdpAggregateRepository<EdpStoredAggregate<'AuditTimeline', string>>('AuditTimeline'),
  } satisfies InMemoryEdpRepositoryRegistry;

  return registry;
};

export const createInMemoryEdpAggregateRepository = <
  TAggregate extends EdpStoredAggregate<EdpAggregateName, string>,
>(
  aggregateType: TAggregate['aggregateType'],
) => new InMemoryAggregateRepository<TAggregate>(aggregateType);

export const createInMemoryEdpEventStore = () => new InMemoryEventStore();
export const createInMemoryEdpOutbox = () => new InMemoryOutbox();
export const createInMemoryEdpAuditRepository = () => new InMemoryAuditRepository();
export const createInMemoryEdpVersionRepository = () => new InMemoryVersionRepository();
export const createInMemoryEdpCorrelationRepository = () => new InMemoryCorrelationRepository();
export const createInMemoryEdpIdempotencyRepository = () => new InMemoryIdempotencyRepository();
