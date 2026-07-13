import { z } from 'zod';
import { ErrorCategory, EventSeverity } from '../../../shared/telemetry/enums.js';
import type { TelemetryValidationResult } from '../../../shared/telemetry/contracts.js';
import {
  MasterCatalogConsumer,
  MasterCatalogEventName,
  MasterCatalogSourceType,
  MASTER_CATALOG_TELEMETRY_EVENT_VERSION,
} from './enums.js';

const MAX_ID_LENGTH = 128;
const MAX_SOURCE_LENGTH = 256;
const MAX_VERSION_LENGTH = 64;
const MAX_REASON_LENGTH = 512;
const MAX_ROUTE_LENGTH = 256;
const MAX_CODE_LENGTH = 128;
const MAX_LABEL_LENGTH = 64;

const isoTimestamp = z.string().datetime({ offset: true });
const requiredString = (limit: number) => z.string().min(1).max(limit);

const masterCatalogEventBaseSchema = z
  .object({
    eventVersion: z.literal(MASTER_CATALOG_TELEMETRY_EVENT_VERSION),
    eventName: z.nativeEnum(MasterCatalogEventName),
    severity: z.nativeEnum(EventSeverity),
    timestamp: isoTimestamp,
    requestId: requiredString(MAX_ID_LENGTH),
    consumer: z.nativeEnum(MasterCatalogConsumer),
    sourceType: z.nativeEnum(MasterCatalogSourceType),
    source: requiredString(MAX_SOURCE_LENGTH),
    tenantId: requiredString(MAX_ID_LENGTH).optional(),
    correlationId: requiredString(MAX_ID_LENGTH).optional(),
    traceId: requiredString(MAX_ID_LENGTH).optional(),
    spanId: requiredString(MAX_ID_LENGTH).optional(),
    catalogVersion: requiredString(MAX_VERSION_LENGTH).optional(),
  })
  .strict();

const lifecyclePayload = z
  .object({
    primary: z.boolean(),
    fallback: z.boolean(),
    shadow: z.boolean(),
  })
  .strict();

const shadowPayload = z
  .object({
    primary: z.boolean(),
    fallback: z.boolean(),
    shadow: z.literal(true),
  })
  .strict();

const requestStartedPayloadSchema = lifecyclePayload.extend({
  primary: z.literal(false),
  fallback: z.literal(false),
  shadow: z.literal(false),
  operation: requiredString(MAX_LABEL_LENGTH).optional(),
  httpMethod: requiredString(16).optional(),
  httpRoute: requiredString(MAX_ROUTE_LENGTH).optional(),
});

const requestFinishedPayloadSchema = lifecyclePayload.extend({
  shadow: z.literal(false),
  latencyMs: z.number().finite().nonnegative(),
  result: z.enum(['SUCCESS', 'EMPTY', 'MATCH', 'MISMATCH', 'DEFERRED']),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }
});

const requestFailedPayloadSchema = lifecyclePayload.extend({
  shadow: z.literal(false),
  latencyMs: z.number().finite().nonnegative().optional(),
  errorCategory: z.nativeEnum(ErrorCategory),
  errorCode: requiredString(MAX_CODE_LENGTH),
  errorMessage: requiredString(MAX_REASON_LENGTH),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }
});

const primaryUsedPayloadSchema = z
  .object({
    primary: z.literal(true),
    fallback: z.literal(false),
    shadow: z.literal(false),
    usageCount: z.number().finite().nonnegative().optional(),
  })
  .strict();

const fallbackUsedPayloadSchema = z
  .object({
    primary: z.literal(false),
    fallback: z.literal(true),
    shadow: z.literal(false),
    fallbackReason: requiredString(MAX_REASON_LENGTH),
  })
  .strict();

const shadowStartedPayloadSchema = shadowPayload.extend({
  comparedSource: requiredString(MAX_SOURCE_LENGTH),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }
});

const shadowFinishedPayloadSchema = shadowPayload.extend({
  latencyMs: z.number().finite().nonnegative(),
  comparedCount: z.number().finite().nonnegative(),
  matchedCount: z.number().finite().nonnegative(),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }

  if (payload.matchedCount > payload.comparedCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['matchedCount'],
      message: 'matchedCount cannot exceed comparedCount',
    });
  }
});

const shadowDivergencePayloadSchema = shadowPayload.extend({
  divergenceCount: z.number().finite().nonnegative(),
  divergenceCategory: requiredString(MAX_REASON_LENGTH),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }
});

const parityResultPayloadSchema = shadowPayload.extend({
  comparedCount: z.number().finite().nonnegative(),
  matchedCount: z.number().finite().nonnegative(),
  parityScore: z.number().finite().nonnegative().max(100),
  result: z.enum(['PASS', 'FAIL', 'DEFERRED']),
}).superRefine((payload, ctx) => {
  if (payload.primary && payload.fallback) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fallback'],
      message: 'primary and fallback cannot both be true',
    });
  }

  if (payload.matchedCount > payload.comparedCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['matchedCount'],
      message: 'matchedCount cannot exceed comparedCount',
    });
  }
});

const consumerRegisteredPayloadSchema = z
  .object({
    primary: z.literal(false),
    fallback: z.literal(false),
    shadow: z.literal(false),
    registryKind: z.enum(['STATIC_TAXONOMY', 'OPERATIONAL_REGISTRY']),
  })
  .strict();

const cacheHitPayloadSchema = z
  .object({
    primary: z.literal(false),
    fallback: z.literal(false),
    shadow: z.literal(false),
    cacheKey: requiredString(MAX_REASON_LENGTH),
    cacheScope: requiredString(MAX_LABEL_LENGTH),
    hitCount: z.number().finite().nonnegative().optional(),
  })
  .strict();

const cacheMissPayloadSchema = z
  .object({
    primary: z.literal(false),
    fallback: z.literal(false),
    shadow: z.literal(false),
    cacheKey: requiredString(MAX_REASON_LENGTH),
    cacheScope: requiredString(MAX_LABEL_LENGTH),
    missReason: requiredString(MAX_REASON_LENGTH),
  })
  .strict();

const withBase = <T extends z.ZodTypeAny>(
  eventName: MasterCatalogEventName,
  severity: EventSeverity,
  payloadSchema: T,
) =>
  masterCatalogEventBaseSchema.extend({
    eventName: z.literal(eventName),
    severity: z.literal(severity),
    payload: payloadSchema,
  });

export const masterCatalogRequestStartedEventSchema = withBase(
  MasterCatalogEventName.REQUEST_STARTED,
  EventSeverity.INFO,
  requestStartedPayloadSchema,
).strict();

export const masterCatalogRequestFinishedEventSchema = withBase(
  MasterCatalogEventName.REQUEST_FINISHED,
  EventSeverity.INFO,
  requestFinishedPayloadSchema,
).strict();

export const masterCatalogRequestFailedEventSchema = withBase(
  MasterCatalogEventName.REQUEST_FAILED,
  EventSeverity.ERROR,
  requestFailedPayloadSchema,
).strict();

export const masterCatalogPrimaryUsedEventSchema = withBase(
  MasterCatalogEventName.PRIMARY_USED,
  EventSeverity.INFO,
  primaryUsedPayloadSchema,
).strict();

export const masterCatalogFallbackUsedEventSchema = withBase(
  MasterCatalogEventName.FALLBACK_USED,
  EventSeverity.WARN,
  fallbackUsedPayloadSchema,
).strict();

export const masterCatalogShadowStartedEventSchema = withBase(
  MasterCatalogEventName.SHADOW_STARTED,
  EventSeverity.INFO,
  shadowStartedPayloadSchema,
).strict();

export const masterCatalogShadowFinishedEventSchema = withBase(
  MasterCatalogEventName.SHADOW_FINISHED,
  EventSeverity.INFO,
  shadowFinishedPayloadSchema,
).strict();

export const masterCatalogShadowDivergenceEventSchema = withBase(
  MasterCatalogEventName.SHADOW_DIVERGENCE,
  EventSeverity.WARN,
  shadowDivergencePayloadSchema,
).strict();

export const masterCatalogParityResultEventSchema = withBase(
  MasterCatalogEventName.PARITY_RESULT,
  EventSeverity.INFO,
  parityResultPayloadSchema,
).strict();

export const masterCatalogConsumerRegisteredEventSchema = withBase(
  MasterCatalogEventName.CONSUMER_REGISTERED,
  EventSeverity.INFO,
  consumerRegisteredPayloadSchema,
).strict();

export const masterCatalogCacheHitEventSchema = withBase(
  MasterCatalogEventName.CACHE_HIT,
  EventSeverity.DEBUG,
  cacheHitPayloadSchema,
).strict();

export const masterCatalogCacheMissEventSchema = withBase(
  MasterCatalogEventName.CACHE_MISS,
  EventSeverity.DEBUG,
  cacheMissPayloadSchema,
).strict();

export const masterCatalogTelemetryEventSchema = z.discriminatedUnion('eventName', [
  masterCatalogRequestStartedEventSchema,
  masterCatalogRequestFinishedEventSchema,
  masterCatalogRequestFailedEventSchema,
  masterCatalogPrimaryUsedEventSchema,
  masterCatalogFallbackUsedEventSchema,
  masterCatalogShadowStartedEventSchema,
  masterCatalogShadowFinishedEventSchema,
  masterCatalogShadowDivergenceEventSchema,
  masterCatalogParityResultEventSchema,
  masterCatalogConsumerRegisteredEventSchema,
  masterCatalogCacheHitEventSchema,
  masterCatalogCacheMissEventSchema,
]);

export type MasterCatalogTelemetryEventSchemaValue = z.infer<
  typeof masterCatalogTelemetryEventSchema
>;
export type MasterCatalogTelemetryContextSchemaValue = z.infer<
  typeof masterCatalogEventBaseSchema
>;

const toValidationResult = <T>(
  result: z.SafeParseReturnType<unknown, T>,
): TelemetryValidationResult<T> => {
  if (result.success) {
    return {
      success: true,
      mode: 'SAFE_RESULT',
      data: result.data,
      errors: [],
    };
  }

  return {
    success: false,
    mode: 'SAFE_RESULT',
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
};

export const validateTelemetryEvent = (
  value: unknown,
): TelemetryValidationResult<MasterCatalogTelemetryEventSchemaValue> => {
  return toValidationResult(masterCatalogTelemetryEventSchema.safeParse(value));
};

export const validateTelemetryContext = (
  value: unknown,
): TelemetryValidationResult<MasterCatalogTelemetryContextSchemaValue> => {
  return toValidationResult(masterCatalogEventBaseSchema.safeParse(value));
};
