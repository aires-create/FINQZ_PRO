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
