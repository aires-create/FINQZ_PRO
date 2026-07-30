import { randomUUID } from 'node:crypto';

import type {
  EdpAuditContext,
  EdpCommandEnvelope,
  EdpErrorEnvelope,
  EdpEventEnvelope,
  EdpQueryEnvelope,
  EdpResponseEnvelope,
  EdpSecurityContext,
} from '../contracts/envelopes.js';
import type { EdpEventName } from '../contracts/events.js';
import { EDP_COMMAND_CATALOG, type EdpCommandDefinition, type EdpCommandName } from '../contracts/commands.js';
import { EDP_QUERY_CATALOG, type EdpQueryDefinition, type EdpQueryName } from '../contracts/queries.js';
import { edpEventPublisher } from '../domain/event-publisher.js';

export interface EdpCommandExecutionResult {
  envelope: EdpResponseEnvelope<Record<string, unknown>>;
  emittedEvent: EdpEventEnvelope<EdpEventName, Record<string, unknown>>;
}

export interface EdpQueryExecutionResult {
  envelope: EdpResponseEnvelope<Record<string, unknown>>;
}

const toUtcNow = () => new Date().toISOString();

const buildAuditContext = (
  securityContext: EdpSecurityContext,
  correlationId: string,
  source: string,
): EdpAuditContext => ({
  actorId: securityContext.userId,
  actorType: securityContext.actorType ?? 'user',
  source,
  requestId: randomUUID(),
  correlationId,
  tenantId: securityContext.tenantId,
});

const buildResponseEnvelope = <TData extends Record<string, unknown>>(
  tenantId: string,
  correlationId: string,
  data: TData,
): EdpResponseEnvelope<TData> => ({
  responseId: randomUUID(),
  correlationId,
  tenantId,
  schemaVersion: '1',
  timestamp: toUtcNow(),
  success: true,
  data,
});

const buildErrorEnvelope = (
  tenantId: string,
  correlationId: string,
  code: string,
  safeMessage: string,
  category = 'runtime',
): EdpErrorEnvelope => ({
  errorId: randomUUID(),
  correlationId,
  tenantId,
  schemaVersion: '1',
  timestamp: toUtcNow(),
  code,
  category,
  severity: 'medium',
  safeMessage,
  retryable: false,
});

const ensureCommandDefinition = (
  commandName: EdpCommandName,
): EdpCommandDefinition => {
  const definition = EDP_COMMAND_CATALOG.find((item) => item.name === commandName);

  if (!definition) {
    throw new Error(`Unknown EDP command: ${commandName}`);
  }

  return definition;
};

const ensureQueryDefinition = (queryName: EdpQueryName): EdpQueryDefinition => {
  const definition = EDP_QUERY_CATALOG.find((item) => item.name === queryName);

  if (!definition) {
    throw new Error(`Unknown EDP query: ${queryName}`);
  }

  return definition;
};

const buildEventEnvelope = (
  definition: EdpCommandDefinition,
  command: EdpCommandEnvelope,
): EdpEventEnvelope<EdpEventName, Record<string, unknown>> => ({
  eventId: randomUUID(),
  name: definition.primaryEvent,
  version: '1',
  correlationId: command.correlationId,
  causationId: command.causationId ?? command.commandId,
  tenantId: command.tenantId,
  aggregateId: command.aggregateId ?? command.commandId,
  aggregateType: definition.aggregateType,
  timestamp: toUtcNow(),
  payload: {
    commandId: command.commandId,
    commandName: definition.name,
    aggregateType: definition.aggregateType,
    tenantId: command.tenantId,
  },
  securityContext: command.securityContext ?? null,
  auditContext: command.auditContext ?? null,
});

export const createCommandExecution = async (
  commandName: EdpCommandName,
  command: EdpCommandEnvelope,
): Promise<EdpCommandExecutionResult> => {
  const definition = ensureCommandDefinition(commandName);
  const event = buildEventEnvelope(definition, command);
  const emittedEvent = await edpEventPublisher.publish(event);

  return {
    envelope: buildResponseEnvelope(command.tenantId, command.correlationId, {
      commandName,
      accepted: true,
      aggregateType: definition.aggregateType,
      emittedEvents: definition.emittedEvents,
      emittedEventName: emittedEvent.name,
      auditReference: command.auditContext?.requestId ?? null,
    }),
    emittedEvent,
  };
};

export const createQueryExecution = async (
  queryName: EdpQueryName,
  query: EdpQueryEnvelope,
): Promise<EdpQueryExecutionResult> => {
  const definition = ensureQueryDefinition(queryName);

  return {
    envelope: buildResponseEnvelope(query.tenantId, query.correlationId, {
      queryName,
      readModel: definition.readModel,
      owner: definition.owner,
      items: [],
    }),
  };
};

export const createRejectedCommandEnvelope = (
  tenantId: string,
  correlationId: string,
  message: string,
): EdpErrorEnvelope => buildErrorEnvelope(tenantId, correlationId, 'EDP_COMMAND_REJECTED', message, 'validation');

export const createRejectedQueryEnvelope = (
  tenantId: string,
  correlationId: string,
  message: string,
): EdpErrorEnvelope => buildErrorEnvelope(tenantId, correlationId, 'EDP_QUERY_REJECTED', message, 'validation');
