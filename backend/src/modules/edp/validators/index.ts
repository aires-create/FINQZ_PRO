import type { EdpCommandEnvelope, EdpQueryEnvelope } from '../contracts/envelopes.js';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const validateEdpCommandEnvelope = (value: unknown): value is EdpCommandEnvelope => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EdpCommandEnvelope>;

  return (
    isNonEmptyString(candidate.commandId) &&
    isNonEmptyString(candidate.correlationId) &&
    isNonEmptyString(candidate.tenantId) &&
    isNonEmptyString(candidate.userId) &&
    isNonEmptyString(candidate.actorType) &&
    isNonEmptyString(candidate.source) &&
    isNonEmptyString(candidate.aggregateType) &&
    isNonEmptyString(candidate.schemaVersion) &&
    isNonEmptyString(candidate.idempotencyKey) &&
    isNonEmptyString(candidate.timestamp)
  );
};

export const validateEdpQueryEnvelope = (value: unknown): value is EdpQueryEnvelope => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EdpQueryEnvelope>;

  return (
    isNonEmptyString(candidate.queryId) &&
    isNonEmptyString(candidate.correlationId) &&
    isNonEmptyString(candidate.tenantId) &&
    isNonEmptyString(candidate.userId) &&
    isNonEmptyString(candidate.actorType) &&
    isNonEmptyString(candidate.source) &&
    isNonEmptyString(candidate.schemaVersion) &&
    isNonEmptyString(candidate.timestamp)
  );
};

export const validateEdpCommandName = (value: string) => isNonEmptyString(value);
export const validateEdpQueryName = (value: string) => isNonEmptyString(value);

