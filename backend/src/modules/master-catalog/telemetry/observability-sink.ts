import { createModuleLogger } from '../../../shared/logger.js';
import { EventSeverity } from '../../../shared/telemetry/enums.js';
import type { TelemetryValidationResult } from '../../../shared/telemetry/contracts.js';
import type { MasterCatalogTelemetryEventSchemaValue } from './validation.js';

export interface ObservabilitySink {
  write(
    event: MasterCatalogTelemetryEventSchemaValue,
  ): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;
}

export class NoopObservabilitySink implements ObservabilitySink {
  write(
    event: MasterCatalogTelemetryEventSchemaValue,
  ): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue> {
    return {
      success: true,
      mode: 'SAFE_RESULT',
      data: event,
      errors: [],
    };
  }
}

type ModuleLogger = ReturnType<typeof createModuleLogger>;

const telemetryLogger = createModuleLogger('MasterCatalogTelemetry');

const logMethodBySeverity = (
  severity: EventSeverity,
): keyof ModuleLogger => {
  switch (severity) {
    case EventSeverity.ERROR:
      return 'error';
    case EventSeverity.WARN:
      return 'warn';
    case EventSeverity.DEBUG:
      return 'debug';
    case EventSeverity.INFO:
    default:
      return 'info';
  }
};

const toLogPayload = (event: MasterCatalogTelemetryEventSchemaValue) => ({
  telemetry: {
    eventVersion: event.eventVersion,
    eventName: event.eventName,
    severity: event.severity,
    timestamp: event.timestamp,
    requestId: event.requestId,
    consumer: event.consumer,
    sourceType: event.sourceType,
    source: event.source,
    tenantId: event.tenantId,
    correlationId: event.correlationId,
    traceId: event.traceId,
    spanId: event.spanId,
    catalogVersion: event.catalogVersion,
    payload: event.payload,
  },
});

export class StructuredLoggerObservabilitySink implements ObservabilitySink {
  constructor(
    private readonly logger: ModuleLogger = telemetryLogger,
    private readonly fallback: ObservabilitySink = new NoopObservabilitySink(),
  ) {}

  write(
    event: MasterCatalogTelemetryEventSchemaValue,
  ): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue> {
    try {
      const logMethod = logMethodBySeverity(event.severity);

      this.logger[logMethod](
        `Master Catalog telemetry event: ${event.eventName}`,
        toLogPayload(event),
      );

      return {
        success: true,
        mode: 'SAFE_RESULT',
        data: event,
        errors: [],
      };
    } catch {
      try {
        return this.fallback.write(event);
      } catch {
        return {
          success: true,
          mode: 'SAFE_RESULT',
          data: event,
          errors: [],
        };
      }
    }
  }
}
