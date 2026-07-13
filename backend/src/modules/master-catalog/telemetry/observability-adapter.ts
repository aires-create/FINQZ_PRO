import { sanitizeTelemetryContext } from '../../../shared/telemetry/sanitize.js';
import type { TelemetryValidationResult } from '../../../shared/telemetry/contracts.js';
import { validateTelemetryEvent } from './validation.js';
import type { MasterCatalogTelemetryEventSchemaValue } from './validation.js';
import type { ObservabilitySink } from './observability-sink.js';
import { resolveObservabilitySink } from './observability-factory.js';

export interface ObservabilityAdapter {
  receive(
    event: unknown,
  ): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue>;
}

const safeResult = (): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue> => ({
  success: false,
  mode: 'SAFE_RESULT',
  errors: [
    {
      path: 'event',
      message: 'Observability adapter failed safely',
    },
  ],
});

const preserveIdentityFields = (
  event: Record<string, unknown>,
  sanitized: Record<string, unknown>,
) => ({
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

export const createObservabilityAdapter = (
  sink: ObservabilitySink = resolveObservabilitySink(),
): ObservabilityAdapter => {
  return {
    receive(event: unknown) {
      try {
        const sanitized = sanitizeTelemetryContext((event ?? {}) as Record<string, unknown>);
        const validated = validateTelemetryEvent(
          preserveIdentityFields(
            (event ?? {}) as Record<string, unknown>,
            sanitized as Record<string, unknown>,
          ),
        );

        if (!validated.success) {
          return validated;
        }

        return sink.write(validated.data);
      } catch {
        return safeResult();
      }
    },
  };
};
