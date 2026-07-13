import { describe, expect, it } from 'vitest';
import { ErrorCategory, EventSeverity } from '../../../shared/telemetry/enums.js';
import {
  MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
  MasterCatalogConsumer,
  MasterCatalogEventName,
  MasterCatalogSourceType,
  masterCatalogTelemetryEventSchema,
  masterCatalogRequestFailedEventSchema,
  validateTelemetryContext,
  validateTelemetryEvent,
} from '../../../modules/master-catalog/telemetry/index.js';

describe('master catalog telemetry', () => {
  const baseEvent = {
    eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
    requestId: 'req-123',
    consumer: MasterCatalogConsumer.OPORTUNIDADES,
    sourceType: MasterCatalogSourceType.FRONTEND_API,
    source: 'src/pages/Oportunidades.tsx',
    catalogVersion: '3.1.0',
    correlationId: 'corr-123',
    timestamp: '2026-07-12T12:34:56.789Z',
  } as const;

  it('exports the Master Catalog-specific surface', () => {
    expect(MasterCatalogConsumer.OPORTUNIDADES).toBe('OPORTUNIDADES');
    expect(MasterCatalogSourceType.FRONTEND_API).toBe('FRONTEND_API');
    expect(MasterCatalogEventName.REQUEST_STARTED).toBe(
      'MASTER_CATALOG_REQUEST_STARTED',
    );
    expect(MASTER_CATALOG_TELEMETRY_EVENT_VERSION).toBe('1.0.0');
  });

  it('accepts valid request lifecycle and shadow events', () => {
    const started = validateTelemetryEvent({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
        operation: 'loadCatalog',
      },
    });

    const shadowFinished = validateTelemetryEvent({
      ...baseEvent,
      eventName: MasterCatalogEventName.SHADOW_FINISHED,
      sourceType: MasterCatalogSourceType.SHADOW,
      severity: EventSeverity.INFO,
      payload: {
        primary: false,
        fallback: false,
        shadow: true,
        latencyMs: 42,
        comparedCount: 10,
        matchedCount: 9,
      },
    });

    expect(started.success).toBe(true);
    expect(shadowFinished.success).toBe(true);
    expect(masterCatalogTelemetryEventSchema.safeParse({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
        operation: 'loadCatalog',
      },
    }).success).toBe(true);
  });

  it('rejects invalid event versions, unknown keys, and incompatible payloads', () => {
    const invalidVersion = validateTelemetryEvent({
      ...baseEvent,
      eventVersion: '2.0.0',
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
      },
    });

    const incompatiblePayload = validateTelemetryEvent({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      payload: {
        primary: true,
        fallback: true,
        shadow: false,
      },
    });

    const unknownKey = masterCatalogTelemetryEventSchema.safeParse({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
      },
      unexpected: true,
    });

    expect(invalidVersion.success).toBe(false);
    expect(incompatiblePayload.success).toBe(false);
    expect(unknownKey.success).toBe(false);
  });

  it('enforces coercion rules for failure, fallback, and shadow coherence', () => {
    const invalidFailure = masterCatalogRequestFailedEventSchema.safeParse({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_FAILED,
      severity: EventSeverity.ERROR,
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
        errorCode: 'ERR-1',
        errorMessage: 'failure',
      },
    });

    const validFailure = validateTelemetryEvent({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_FAILED,
      severity: EventSeverity.ERROR,
      payload: {
        primary: true,
        fallback: false,
        shadow: false,
        errorCategory: ErrorCategory.CONTRACT,
        errorCode: 'ERR-1',
        errorMessage: 'failure',
      },
    });

    const invalidFinish = validateTelemetryEvent({
      ...baseEvent,
      eventName: MasterCatalogEventName.REQUEST_FINISHED,
      severity: EventSeverity.INFO,
      payload: {
        primary: true,
        fallback: true,
        shadow: false,
        latencyMs: 10,
        result: 'SUCCESS',
      },
    });

    expect(invalidFailure.success).toBe(false);
    expect(validFailure.success).toBe(true);
    expect(invalidFinish.success).toBe(false);
  });

  it('accepts context without trace or correlation when unavailable', () => {
    const context = validateTelemetryContext({
      eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
      requestId: 'req-123',
      consumer: MasterCatalogConsumer.SYSTEM,
      sourceType: MasterCatalogSourceType.HTTP_CONTROLLER,
      source: 'master-catalog.controller',
      timestamp: '2026-07-12T12:34:56.789Z',
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
    });

    expect(context.success).toBe(true);
  });
});
