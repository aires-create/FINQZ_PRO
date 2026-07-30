import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCategory, EventSeverity } from '../../../shared/telemetry/enums.js';
import {
  MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
  MasterCatalogConsumer,
  MasterCatalogEventName,
  MasterCatalogSourceType,
  createObservabilityAdapter,
  createMasterCatalogTelemetryEmitter,
  masterCatalogTelemetryEventSchema,
  masterCatalogRequestFailedEventSchema,
  resolveObservabilitySink,
  StructuredLoggerObservabilitySink,
  validateTelemetryContext,
  validateTelemetryEvent,
} from '../../../modules/master-catalog/telemetry/index.js';

const validatedPayloads: unknown[] = [];

const createLoggerMock = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  http: vi.fn(),
  debug: vi.fn(),
});

vi.mock('../../../modules/master-catalog/telemetry/validation.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../../modules/master-catalog/telemetry/validation.js')
  >('../../../modules/master-catalog/telemetry/validation.js');

  return {
    ...actual,
    validateTelemetryEvent: vi.fn((value: unknown) => {
      validatedPayloads.push(value);
      return actual.validateTelemetryEvent(value);
    }),
  };
});

beforeEach(() => {
  validatedPayloads.length = 0;
  vi.mocked(validateTelemetryEvent).mockClear();
});

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

  it('emits passive lifecycle events when request identifiers are available', () => {
    const emitter = createMasterCatalogTelemetryEmitter({
      id: 'req-123',
      requestId: 'req-123',
      correlationId: 'corr-123',
      method: 'GET',
      url: '/master-catalog/segments',
      headers: {},
      currentTenant: { tenantId: 'tenant-1' },
    } as never);

    const started = emitter.requestStarted({
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      operation: 'listSegments',
      httpMethod: 'GET',
      httpRoute: '/master-catalog/segments',
    });

    const primary = emitter.primaryUsed({
      eventName: MasterCatalogEventName.PRIMARY_USED,
      severity: EventSeverity.INFO,
      usageCount: 1,
    });

    expect(started.success).toBe(true);
    expect(primary.success).toBe(true);
  });

  it('preserves requestId and tenantId without synthesizing trace identifiers', () => {
    validatedPayloads.length = 0;

    const emitter = createMasterCatalogTelemetryEmitter({
      requestId: 'req-456',
      correlationId: undefined,
      headers: {},
      currentTenant: { tenantId: 'tenant-2' },
      method: 'GET',
      url: '/master-catalog/products',
    } as never);

    emitter.requestStarted({
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      operation: 'listProducts',
      httpMethod: 'GET',
      httpRoute: '/master-catalog/products',
    });

    const emitted = validatedPayloads[0] as {
      requestId?: string;
      tenantId?: string;
      correlationId?: string;
      traceId?: string;
      spanId?: string;
    };

    expect(emitted.requestId).toBe('req-456');
    expect(emitted.tenantId).toBe('tenant-2');
    expect(emitted.correlationId).toBeUndefined();
    expect(emitted.traceId).toBeUndefined();
    expect(emitted.spanId).toBeUndefined();
  });

  it('returns SAFE_RESULT when validation fails', () => {
    vi.mocked(validateTelemetryEvent).mockImplementationOnce(() => {
      throw new Error('validation boom');
    });

    const emitter = createMasterCatalogTelemetryEmitter({
      requestId: 'req-789',
      headers: {},
      currentTenant: { tenantId: 'tenant-3' },
      method: 'GET',
      url: '/master-catalog/segments',
    } as never);

    const result = emitter.requestStarted({
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      operation: 'listSegments',
      httpMethod: 'GET',
      httpRoute: '/master-catalog/segments',
    });

    expect(result.success).toBe(false);
    expect(result.mode).toBe('SAFE_RESULT');
  });

  it('routes valid events through the adapter and noop sink', () => {
    const sink = {
      write: vi.fn((event: unknown) => ({
        success: true,
        mode: 'SAFE_RESULT' as const,
        data: event,
        errors: [],
      })),
    };

    const adapter = createObservabilityAdapter(sink);
    const result = adapter.receive({
      eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      timestamp: '2026-07-12T12:34:56.789Z',
      requestId: 'req-900',
      consumer: MasterCatalogConsumer.MASTER_CATALOG,
      sourceType: MasterCatalogSourceType.HTTP_CONTROLLER,
      source: 'master-catalog.controller',
      tenantId: 'tenant-900',
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
        operation: 'listSegments',
      },
    });

    expect(result.success).toBe(true);
    expect(sink.write).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid events before they reach the sink', () => {
    const sink = {
      write: vi.fn(),
    };

    const adapter = createObservabilityAdapter(sink);
    const result = adapter.receive({
      eventVersion: '2.0.0',
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      timestamp: '2026-07-12T12:34:56.789Z',
      requestId: 'req-901',
      consumer: MasterCatalogConsumer.MASTER_CATALOG,
      sourceType: MasterCatalogSourceType.HTTP_CONTROLLER,
      source: 'master-catalog.controller',
      tenantId: 'tenant-901',
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
      },
    });

    expect(result.success).toBe(false);
    expect(sink.write).not.toHaveBeenCalled();
  });

  it('uses the structured logger sink as the default resolver', () => {
    const sink = resolveObservabilitySink();
    expect(sink).toBeInstanceOf(StructuredLoggerObservabilitySink);
  });

  it('writes structured telemetry through the official logger sink', () => {
    const logger = createLoggerMock();
    const sink = new StructuredLoggerObservabilitySink(logger);
    const result = sink.write({
      eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
      eventName: MasterCatalogEventName.REQUEST_STARTED,
      severity: EventSeverity.INFO,
      timestamp: '2026-07-12T12:34:56.789Z',
      requestId: 'req-902',
      consumer: MasterCatalogConsumer.MASTER_CATALOG,
      sourceType: MasterCatalogSourceType.HTTP_CONTROLLER,
      source: 'master-catalog.controller',
      tenantId: 'tenant-902',
      payload: {
        primary: false,
        fallback: false,
        shadow: false,
        operation: 'listSegments',
      },
    } as never);

    expect(result.success).toBe(true);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(MasterCatalogEventName.REQUEST_STARTED),
      expect.objectContaining({
        telemetry: expect.objectContaining({
          requestId: 'req-902',
          tenantId: 'tenant-902',
          eventName: MasterCatalogEventName.REQUEST_STARTED,
        }),
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('falls back to noop behavior when the structured logger sink fails', () => {
    const fallback = {
      write: vi.fn((event: unknown) => ({
        success: true,
        mode: 'SAFE_RESULT' as const,
        data: event,
        errors: [],
      })),
    };
    const logger = {
      error: vi.fn(() => {
        throw new Error('logger failed');
      }),
      warn: vi.fn(),
      info: vi.fn(),
      http: vi.fn(),
      debug: vi.fn(),
    };
    const sink = new StructuredLoggerObservabilitySink(logger, fallback);
    const result = sink.write({
      eventVersion: MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
      eventName: MasterCatalogEventName.REQUEST_FAILED,
      severity: EventSeverity.ERROR,
      timestamp: '2026-07-12T12:34:56.789Z',
      requestId: 'req-903',
      consumer: MasterCatalogConsumer.MASTER_CATALOG,
      sourceType: MasterCatalogSourceType.HTTP_CONTROLLER,
      source: 'master-catalog.controller',
      tenantId: 'tenant-903',
      payload: {
        primary: true,
        fallback: false,
        shadow: false,
        errorCategory: ErrorCategory.CONTRACT,
        errorCode: 'ERR-903',
        errorMessage: 'boom',
      },
    });

    expect(result.success).toBe(true);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(MasterCatalogEventName.REQUEST_FAILED),
      expect.objectContaining({
        telemetry: expect.objectContaining({
          requestId: 'req-903',
          tenantId: 'tenant-903',
          eventName: MasterCatalogEventName.REQUEST_FAILED,
        }),
      }),
    );
    expect(fallback.write).toHaveBeenCalledTimes(1);
  });
});
