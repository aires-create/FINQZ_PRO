import type { EdpAuditRecord, EdpCorrelationRecord, EdpEventStoreRecord, EdpIdempotencyRecord, EdpOutboxRecord, EdpStoredAggregate, EdpVersionRecord } from '../contracts/persistence.js';
import type { EdpAggregateName } from './aggregates.js';

export const mapAggregatePayload = <T extends Record<string, unknown>>(payload: T): Record<string, unknown> => ({
  ...payload,
});

export const mapStoredAggregate = <
  TName extends EdpAggregateName,
  TState extends string,
>(
  aggregate: EdpStoredAggregate<TName, TState>,
): EdpStoredAggregate<TName, TState> => ({
  ...aggregate,
  payload: mapAggregatePayload(aggregate.payload),
});

export const mapEventStoreRecord = (record: EdpEventStoreRecord): EdpEventStoreRecord => ({
  ...record,
  payload: mapAggregatePayload(record.payload),
});

export const mapOutboxRecord = (record: EdpOutboxRecord): EdpOutboxRecord => ({
  ...record,
  payload: mapAggregatePayload(record.payload),
});

export const mapAuditRecord = (record: EdpAuditRecord): EdpAuditRecord => ({
  ...record,
  payload: mapAggregatePayload(record.payload),
});

export const mapVersionRecord = (record: EdpVersionRecord): EdpVersionRecord => ({
  ...record,
  payload: mapAggregatePayload(record.payload),
});

export const mapCorrelationRecord = (record: EdpCorrelationRecord): EdpCorrelationRecord => ({
  ...record,
  ...(record.metadata ? { metadata: mapAggregatePayload(record.metadata) } : {}),
});

export const mapIdempotencyRecord = (record: EdpIdempotencyRecord): EdpIdempotencyRecord => ({
  ...record,
});
