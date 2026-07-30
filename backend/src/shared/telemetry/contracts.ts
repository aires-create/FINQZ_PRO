import type { EventSeverity } from './enums.js';

export interface TelemetryBaseContext {
  requestId: string;
  source: string;
  tenantId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  catalogVersion?: string;
}

export interface TelemetryLogContext extends TelemetryBaseContext {
  timestamp: string;
  level: EventSeverity;
  message: string;
}

export type TelemetryMetricKind = 'counter' | 'gauge' | 'histogram' | 'ratio';

export type TelemetryMetricLabelValue = string | number | boolean;

export type TelemetryMetricLabels = Record<string, TelemetryMetricLabelValue>;

export interface TelemetryMetricContext extends TelemetryBaseContext {
  timestamp: string;
  name: string;
  kind: TelemetryMetricKind;
  value: number;
  unit?: string;
  labels?: TelemetryMetricLabels;
}

export interface TelemetryValidationError {
  path: string;
  message: string;
}

export type TelemetryValidationResult<T> =
  | {
      success: true;
      mode: 'SAFE_RESULT';
      data: T;
      errors: [];
    }
  | {
      success: false;
      mode: 'SAFE_RESULT';
      data?: undefined;
      errors: TelemetryValidationError[];
    };

export interface TelemetryLogRecord extends TelemetryLogContext {
  context?: Record<string, unknown>;
}

export interface TelemetryMetricRecord extends TelemetryMetricContext {
  description?: string;
  numerator?: string;
  denominator?: string;
  population?: string;
  exclusions?: string[];
  sourceMetrics?: string[];
}
