import type { ErrorCategory, EventSeverity } from '../../../shared/telemetry/enums.js';
import type {
  TelemetryBaseContext,
  TelemetryLogContext,
  TelemetryMetricContext,
  TelemetryMetricLabels,
} from '../../../shared/telemetry/contracts.js';
import type {
  MasterCatalogConsumer,
  MasterCatalogEventName,
  MasterCatalogSourceType,
  MasterCatalogTelemetryEventVersion,
} from './enums.js';

export interface MasterCatalogTelemetryBaseContext extends TelemetryBaseContext {
  consumer: MasterCatalogConsumer;
  sourceType: MasterCatalogSourceType;
  eventVersion: MasterCatalogTelemetryEventVersion;
}

export interface MasterCatalogTelemetryEventContext
  extends MasterCatalogTelemetryBaseContext {
  eventName: MasterCatalogEventName;
  severity: EventSeverity;
  timestamp: string;
}

export interface MasterCatalogRequestStartedPayload {
  primary: false;
  fallback: false;
  shadow: false;
  operation?: string;
  httpMethod?: string;
  httpRoute?: string;
}

export interface MasterCatalogRequestFinishedPayload {
  primary: boolean;
  fallback: boolean;
  shadow: false;
  latencyMs: number;
  result: 'SUCCESS' | 'EMPTY' | 'MATCH' | 'MISMATCH' | 'DEFERRED';
}

export interface MasterCatalogRequestFailedPayload {
  primary: boolean;
  fallback: boolean;
  shadow: false;
  latencyMs?: number;
  errorCategory: ErrorCategory;
  errorCode: string;
  errorMessage: string;
}

export interface MasterCatalogPrimaryUsedPayload {
  primary: true;
  fallback: false;
  shadow: false;
  usageCount?: number;
}

export interface MasterCatalogFallbackUsedPayload {
  primary: false;
  fallback: true;
  shadow: false;
  fallbackReason: string;
}

export interface MasterCatalogShadowStartedPayload {
  primary: boolean;
  fallback: boolean;
  shadow: true;
  comparedSource: string;
}

export interface MasterCatalogShadowFinishedPayload {
  primary: boolean;
  fallback: boolean;
  shadow: true;
  latencyMs: number;
  comparedCount: number;
  matchedCount: number;
}

export interface MasterCatalogShadowDivergencePayload {
  primary: boolean;
  fallback: boolean;
  shadow: true;
  divergenceCount: number;
  divergenceCategory: string;
}

export interface MasterCatalogParityResultPayload {
  primary: boolean;
  fallback: boolean;
  shadow: true;
  comparedCount: number;
  matchedCount: number;
  parityScore: number;
  result: 'PASS' | 'FAIL' | 'DEFERRED';
}

export interface MasterCatalogConsumerRegisteredPayload {
  primary: false;
  fallback: false;
  shadow: false;
  registryKind: 'STATIC_TAXONOMY' | 'OPERATIONAL_REGISTRY';
}

export interface MasterCatalogCacheHitPayload {
  primary: false;
  fallback: false;
  shadow: false;
  cacheKey: string;
  cacheScope: string;
  hitCount?: number;
}

export interface MasterCatalogCacheMissPayload {
  primary: false;
  fallback: false;
  shadow: false;
  cacheKey: string;
  cacheScope: string;
  missReason: string;
}

export interface MasterCatalogTelemetryEventRecord<
  TPayload,
> extends MasterCatalogTelemetryEventContext {
  payload: TPayload;
}

export interface MasterCatalogTelemetryLogRecord
  extends MasterCatalogTelemetryBaseContext,
    TelemetryLogContext {}

export interface MasterCatalogTelemetryMetricRecord
  extends MasterCatalogTelemetryBaseContext,
    TelemetryMetricContext {
  labels?: TelemetryMetricLabels;
}
