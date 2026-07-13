import type { FastifyRequest } from 'fastify';

import { sanitizeTelemetryContext } from '../../../shared/telemetry/sanitize.js';
import type { TelemetryValidationResult } from '../../../shared/telemetry/contracts.js';
import { ErrorCategory, EventSeverity } from '../../../shared/telemetry/enums.js';
import {
  MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
  MasterCatalogConsumer,
  MasterCatalogEventName,
  MasterCatalogSourceType,
} from './enums.js';
import type { MasterCatalogTelemetryEventSchemaValue } from './validation.js';
import { validateTelemetryEvent } from './validation.js';

const DEFAULT_SOURCE = 'master-catalog.controller';

const readHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const firstValue = value.find((entry) => typeof entry === 'string' && entry.trim());

    return typeof firstValue === 'string' ? firstValue : undefined;
  }

  return undefined;
};

const resolveRequestId = (request: FastifyRequest): string | undefined => {
  if (typeof request.requestId === 'string' && request.requestId.trim()) {
    return request.requestId;
  }

  return readHeaderValue(request.headers?.['x-request-id']);
};

const resolveCorrelationId = (request: FastifyRequest): string | undefined => {
  if (typeof request.correlationId === 'string' && request.correlationId.trim()) {
    return request.correlationId;
  }

  return readHeaderValue(request.headers?.['x-correlation-id']);
};

const resolveTraceId = (request: FastifyRequest): string | undefined => {
  return readHeaderValue(request.headers?.['x-trace-id']);
};

const resolveSpanId = (request: FastifyRequest): string | undefined => {
  return readHeaderValue(request.headers?.['x-span-id']);
};

const buildBaseEvent = (
  request: FastifyRequest,
  sourceType: MasterCatalogSourceType,
  source: string,
) => ({
  eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
  requestId: resolveRequestId(request),
  consumer: MasterCatalogConsumer.MASTER_CATALOG,
  sourceType,
  source,
  tenantId: request.currentTenant?.tenantId,
  correlationId: resolveCorrelationId(request),
  traceId: resolveTraceId(request),
  spanId: resolveSpanId(request),
});

const emitTelemetryEvent = (
  event: Record<string, unknown>,
): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue> => {
  try {
    const sanitized = sanitizeTelemetryContext(event);

    return validateTelemetryEvent({
      ...sanitized,
      requestId:
        typeof event.requestId === 'string' && event.requestId.trim()
          ? event.requestId
          : sanitized.requestId,
      tenantId:
        typeof event.tenantId === 'string' && event.tenantId.trim()
          ? event.tenantId
          : sanitized.tenantId,
      correlationId:
        typeof event.correlationId === 'string' && event.correlationId.trim()
          ? event.correlationId
          : sanitized.correlationId,
      traceId:
        typeof event.traceId === 'string' && event.traceId.trim()
          ? event.traceId
          : sanitized.traceId,
      spanId:
        typeof event.spanId === 'string' && event.spanId.trim()
          ? event.spanId
          : sanitized.spanId,
    });
  } catch {
    return {
      success: false,
      mode: 'SAFE_RESULT',
      errors: [
        {
          path: 'event',
          message: 'Telemetry emission failed safely',
        },
      ],
    };
  }
};

export interface MasterCatalogTelemetryEmitter {
  requestStarted(input: {
    eventName: MasterCatalogEventName.REQUEST_STARTED;
    severity: EventSeverity.INFO;
    operation: string;
    httpMethod?: string;
    httpRoute?: string;
  }): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;

  primaryUsed(input: {
    eventName: MasterCatalogEventName.PRIMARY_USED;
    severity: EventSeverity.INFO;
    usageCount?: number;
  }): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;

  requestFinished(input: {
    eventName: MasterCatalogEventName.REQUEST_FINISHED;
    severity: EventSeverity.INFO;
    latencyMs: number;
    result: 'SUCCESS' | 'EMPTY' | 'MATCH' | 'MISMATCH' | 'DEFERRED';
  }): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;

  requestFailed(input: {
    eventName: MasterCatalogEventName.REQUEST_FAILED;
    severity: EventSeverity.ERROR;
    latencyMs?: number;
    errorCategory: ErrorCategory;
    errorCode: string;
    errorMessage: string;
  }): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;
}

export const createMasterCatalogTelemetryEmitter = (
  request: FastifyRequest,
  options?: {
    source?: string;
    sourceType?: MasterCatalogSourceType;
  },
): MasterCatalogTelemetryEmitter => {
  const source = options?.source ?? DEFAULT_SOURCE;
  const sourceType = options?.sourceType ?? MasterCatalogSourceType.HTTP_CONTROLLER;

  return {
    requestStarted: (input) =>
      emitTelemetryEvent({
        ...buildBaseEvent(request, sourceType, source),
        eventName: input.eventName,
        severity: input.severity,
        timestamp: new Date().toISOString(),
        payload: {
          primary: false,
          fallback: false,
          shadow: false,
          operation: input.operation,
          httpMethod: input.httpMethod,
          httpRoute: input.httpRoute,
        },
      }),
    primaryUsed: (input) =>
      emitTelemetryEvent({
        ...buildBaseEvent(request, sourceType, source),
        eventName: input.eventName,
        severity: input.severity,
        timestamp: new Date().toISOString(),
        payload: {
          primary: true,
          fallback: false,
          shadow: false,
          usageCount: input.usageCount,
        },
      }),
    requestFinished: (input) =>
      emitTelemetryEvent({
        ...buildBaseEvent(request, sourceType, source),
        eventName: input.eventName,
        severity: input.severity,
        timestamp: new Date().toISOString(),
        payload: {
          primary: true,
          fallback: false,
          shadow: false,
          latencyMs: input.latencyMs,
          result: input.result,
        },
      }),
    requestFailed: (input) =>
      emitTelemetryEvent({
        ...buildBaseEvent(request, sourceType, source),
        eventName: input.eventName,
        severity: input.severity,
        timestamp: new Date().toISOString(),
        payload: {
          primary: true,
          fallback: false,
          shadow: false,
          latencyMs: input.latencyMs,
          errorCategory: input.errorCategory,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
        },
      }),
  };
};
