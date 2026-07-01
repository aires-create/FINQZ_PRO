import { randomUUID } from 'node:crypto';

import type { EdpAggregateName } from './aggregates.js';
import type { EdpStoredAggregate, EdpVersionRecord, EdpAuditRecord, EdpCorrelationRecord, EdpIdempotencyRecord, EdpOutboxRecord } from '../contracts/persistence.js';
import type { EdpEventEnvelope } from '../contracts/envelopes.js';
import type { EdpEventName } from '../contracts/events.js';

const now = () => new Date().toISOString();

export const createStoredAggregate = <
  TName extends EdpAggregateName,
  TState extends string,
>(
  aggregateType: TName,
  tenantId: string,
  aggregateId: string,
  state: TState,
  payload: Record<string, unknown> = {},
  version = 1,
): EdpStoredAggregate<TName, TState> => ({
  aggregateId,
  aggregateType,
  tenantId,
  version,
  state,
  payload,
  createdAt: now(),
  updatedAt: now(),
});

export const createEventStoreRecord = (
  event: EdpEventEnvelope<EdpEventName, Record<string, unknown>>,
  version = 1,
) => ({
  eventId: event.eventId,
  eventName: event.name,
  aggregateId: event.aggregateId,
  aggregateType: event.aggregateType,
  tenantId: event.tenantId,
  correlationId: event.correlationId,
  causationId: event.causationId ?? null,
  version,
  payload: event.payload,
  occurredAt: event.timestamp,
});

export const createOutboxRecord = (
  tenantId: string,
  eventId: string,
  eventName: EdpEventName,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  availableAt = now(),
  status: EdpOutboxRecord['status'] = 'PENDING',
): EdpOutboxRecord => ({
  outboxId: randomUUID(),
  tenantId,
  eventId,
  eventName,
  aggregateId,
  aggregateType,
  status,
  availableAt,
  payload,
});

export const createAuditRecord = (
  tenantId: string,
  aggregateType: string,
  aggregateId: string,
  action: string,
  actorId: string,
  correlationId: string,
  payload: Record<string, unknown> = {},
): EdpAuditRecord => ({
  auditId: randomUUID(),
  tenantId,
  aggregateId,
  aggregateType,
  action,
  correlationId,
  actorId,
  occurredAt: now(),
  payload,
});

export const createVersionRecord = (
  tenantId: string,
  aggregateType: EdpVersionRecord['aggregateType'],
  aggregateId: string,
  version: number,
  status: EdpVersionRecord['status'],
  payload: Record<string, unknown> = {},
): EdpVersionRecord => ({
  versionId: randomUUID(),
  tenantId,
  aggregateType,
  aggregateId,
  version,
  status,
  payload,
});

export const createCorrelationRecord = (
  tenantId: string,
  correlationId: string,
  aggregateType?: string | null,
  aggregateId?: string | null,
  requestId?: string | null,
  causationId?: string | null,
  metadata?: Record<string, unknown> | null,
): EdpCorrelationRecord => ({
  correlationId,
  tenantId,
  ...(aggregateType ? { aggregateType } : {}),
  ...(aggregateId ? { aggregateId } : {}),
  ...(requestId ? { requestId } : {}),
  ...(causationId ? { causationId } : {}),
  ...(metadata ? { metadata } : {}),
  createdAt: now(),
});

export const createIdempotencyRecord = (
  tenantId: string,
  idempotencyKey: string,
  owner: string,
  requestHash: string,
  status: EdpIdempotencyRecord['status'] = 'RECEIVED',
): EdpIdempotencyRecord => {
  const timestamp = now();

  return {
    idempotencyKey,
    tenantId,
    owner,
    requestHash,
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
