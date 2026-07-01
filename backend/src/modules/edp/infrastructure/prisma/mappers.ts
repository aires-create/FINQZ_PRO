import { Prisma } from '@prisma/client';

import type { EdpAuditRecord, EdpCorrelationRecord, EdpEventStoreRecord, EdpIdempotencyRecord, EdpOutboxRecord, EdpStoredAggregate, EdpVersionRecord } from '../../contracts/persistence.js';
import type { EdpAggregateName } from '../../domain/aggregates.js';
import type { EdpEventEnvelope } from '../../contracts/envelopes.js';
import type { EdpEventName } from '../../contracts/events.js';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const cloneRecord = <T extends Record<string, unknown>>(value: T): T => ({
  ...value,
});

export const toJsonValue = (value: Record<string, unknown> | null | undefined): Prisma.InputJsonValue => {
  if (value === null || value === undefined) {
    return null as unknown as Prisma.InputJsonValue;
  }

  return cloneRecord(value) as unknown as Prisma.InputJsonValue;
};

export const fromJsonValue = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  return cloneRecord(value);
};

export const toStoredAggregate = <TName extends EdpAggregateName, TState extends string>(
  record: {
    aggregateId: string;
    aggregateType: TName;
    tenantId: string;
    version: number;
    state: TState;
    snapshot: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  },
): EdpStoredAggregate<TName, TState> => ({
  aggregateId: record.aggregateId,
  aggregateType: record.aggregateType,
  tenantId: record.tenantId,
  version: record.version,
  state: record.state,
  payload: fromJsonValue(record.snapshot),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const toEventStoreRecord = (record: {
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
}): EdpEventStoreRecord => ({
  eventId: record.eventId,
  eventName: record.eventName as EdpEventName,
  aggregateId: record.aggregateId,
  aggregateType: record.aggregateType,
  tenantId: record.tenantId,
  correlationId: record.correlationId,
  causationId: record.causationId,
  version: record.aggregateVersion,
  payload: fromJsonValue(record.payload),
  occurredAt: record.occurredAt.toISOString(),
});

export const toOutboxRecord = (record: {
  id: string;
  tenantId: string;
  eventId?: string | null;
  eventName: string;
  aggregateId: string | null;
  aggregateType: string | null;
  status: string;
  attempts: number;
  nextAttemptAt: Date | null;
  publishedAt: Date | null;
  payload: Prisma.JsonValue;
  createdAt: Date;
}): EdpOutboxRecord => ({
  outboxId: record.id,
  tenantId: record.tenantId,
  eventId: record.eventId ?? record.id,
  eventName: record.eventName as EdpEventName,
  aggregateId: record.aggregateId ?? record.id,
  aggregateType: record.aggregateType ?? '',
  status: record.status as EdpOutboxRecord['status'],
  availableAt: (record.nextAttemptAt ?? record.createdAt).toISOString(),
  payload: fromJsonValue(record.payload),
});

export const toAuditRecord = (record: {
  id: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  action: string;
  correlationId: string;
  actor: string;
  payload: Prisma.JsonValue;
  timestamp: Date;
}): EdpAuditRecord => ({
  auditId: record.id,
  tenantId: record.tenantId,
  aggregateId: record.aggregateId,
  aggregateType: record.aggregateType,
  action: record.action,
  correlationId: record.correlationId,
  actorId: record.actor,
  occurredAt: record.timestamp.toISOString(),
  payload: fromJsonValue(record.payload),
});

export const toVersionRecord = (record: {
  id: string;
  tenantId: string;
  aggregateType: 'DecisionPolicy' | 'DecisionStrategy';
  aggregateId: string;
  version: number;
  status: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rollbackOf: string | null;
  configSnapshot: Prisma.JsonValue;
  audit: Prisma.JsonValue | null;
}): EdpVersionRecord => ({
  versionId: record.id,
  tenantId: record.tenantId,
  aggregateType: record.aggregateType,
  aggregateId: record.aggregateId,
  version: record.version,
  status: record.status as EdpVersionRecord['status'],
  effectiveFrom: record.effectiveFrom?.toISOString() ?? null,
  effectiveTo: record.effectiveTo?.toISOString() ?? null,
  payload: {
    configSnapshot: fromJsonValue(record.configSnapshot),
    audit: fromJsonValue(record.audit),
    approvedBy: record.approvedBy,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    rollbackOf: record.rollbackOf,
  },
});

export const toCorrelationRecord = (record: {
  id: string;
  tenantId: string;
  correlationId: string;
  aggregateId: string | null;
  aggregateType: string | null;
  causationId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): EdpCorrelationRecord => ({
  correlationId: record.correlationId,
  tenantId: record.tenantId,
  aggregateId: record.aggregateId,
  aggregateType: record.aggregateType,
  causationId: record.causationId,
  metadata: record.metadata ? fromJsonValue(record.metadata) : null,
  createdAt: record.createdAt.toISOString(),
});

export const toIdempotencyRecord = (record: {
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
}): EdpIdempotencyRecord => ({
  idempotencyKey: record.idempotencyKey,
  tenantId: record.tenantId,
  owner: record.commandName,
  requestHash: record.commandHash,
  status: record.status as EdpIdempotencyRecord['status'],
  responseId: (() => {
    if (typeof record.responseSnapshot === 'string') {
      return record.responseSnapshot;
    }

    if (isRecord(record.responseSnapshot) && typeof record.responseSnapshot.responseId === 'string') {
      return record.responseSnapshot.responseId;
    }

    return null;
  })(),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
