import type { EdpAggregateName } from '../domain/aggregates.js';
import type { EdpEventEnvelope } from './envelopes.js';
import type { EdpEventName } from './events.js';

export interface EdpStoredAggregate<TName extends EdpAggregateName, TState extends string> {
  aggregateId: string;
  aggregateType: TName;
  tenantId: string;
  version: number;
  state: TState;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EdpAggregatePersistenceContract<
  TAggregate extends EdpStoredAggregate<EdpAggregateName, string>,
> {
  load(tenantId: string, aggregateId: string): Promise<TAggregate | null>;
  save(aggregate: TAggregate): Promise<TAggregate>;
  listByTenant(tenantId: string): Promise<TAggregate[]>;
}

export interface EdpRepositoryPort<TAggregate extends EdpStoredAggregate<EdpAggregateName, string>> {
  readonly aggregateType: TAggregate['aggregateType'];
  findById(tenantId: string, aggregateId: string): Promise<TAggregate | null>;
  save(aggregate: TAggregate): Promise<TAggregate>;
  listByTenant(tenantId: string): Promise<TAggregate[]>;
}

export interface EdpEventStoreRecord {
  eventId: string;
  eventName: EdpEventName;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  correlationId: string;
  causationId?: string | null;
  version: number;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface EdpEventStoreContract {
  append(event: EdpEventEnvelope): Promise<EdpEventStoreRecord>;
  listByAggregate(tenantId: string, aggregateId: string): Promise<EdpEventStoreRecord[]>;
  findByEventId(tenantId: string, eventId: string): Promise<EdpEventStoreRecord | null>;
}

export interface EdpOutboxRecord {
  outboxId: string;
  tenantId: string;
  eventId: string;
  eventName: EdpEventName;
  aggregateId: string;
  aggregateType: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  availableAt: string;
  payload: Record<string, unknown>;
}

export interface EdpOutboxContract {
  enqueue(record: Omit<EdpOutboxRecord, 'outboxId' | 'status'> & { status?: EdpOutboxRecord['status'] }): Promise<EdpOutboxRecord>;
  listPending(tenantId: string): Promise<EdpOutboxRecord[]>;
  markProcessed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null>;
  markFailed(tenantId: string, eventId: string): Promise<EdpOutboxRecord | null>;
}

export interface EdpAuditRecord {
  auditId: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  action: string;
  correlationId: string;
  actorId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface EdpAuditRepositoryContract {
  append(record: EdpAuditRecord): Promise<EdpAuditRecord>;
  listByAggregate(tenantId: string, aggregateId: string): Promise<EdpAuditRecord[]>;
}

export interface EdpVersionRecord {
  versionId: string;
  tenantId: string;
  aggregateType: 'DecisionPolicy' | 'DecisionStrategy';
  aggregateId: string;
  version: number;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'ROLLED_BACK';
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  payload: Record<string, unknown>;
}

export interface EdpVersionRepositoryContract {
  save(record: EdpVersionRecord): Promise<EdpVersionRecord>;
  findLatest(tenantId: string, aggregateType: EdpVersionRecord['aggregateType'], aggregateId: string): Promise<EdpVersionRecord | null>;
  listByAggregate(tenantId: string, aggregateType: EdpVersionRecord['aggregateType'], aggregateId: string): Promise<EdpVersionRecord[]>;
}

export interface EdpCorrelationRecord {
  correlationId: string;
  tenantId: string;
  aggregateId?: string | null;
  aggregateType?: string | null;
  requestId?: string | null;
  causationId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface EdpCorrelationRepositoryContract {
  upsert(record: EdpCorrelationRecord): Promise<EdpCorrelationRecord>;
  findByCorrelationId(tenantId: string, correlationId: string): Promise<EdpCorrelationRecord | null>;
}

export interface EdpIdempotencyRecord {
  idempotencyKey: string;
  tenantId: string;
  owner: string;
  requestHash: string;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';
  responseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EdpIdempotencyRepositoryContract {
  remember(record: EdpIdempotencyRecord): Promise<EdpIdempotencyRecord>;
  findByKey(tenantId: string, idempotencyKey: string): Promise<EdpIdempotencyRecord | null>;
  markProcessed(
    tenantId: string,
    idempotencyKey: string,
    responseId?: string | null,
  ): Promise<EdpIdempotencyRecord | null>;
}
