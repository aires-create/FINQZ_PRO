import { z } from 'zod';
import { EventSeverity } from './enums.js';
import type {
  TelemetryBaseContext,
  TelemetryLogContext,
  TelemetryMetricContext,
  TelemetryValidationResult,
} from './contracts.js';

const MAX_ID_LENGTH = 128;
const MAX_SOURCE_LENGTH = 256;
const MAX_VERSION_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 2_048;
const MAX_METRIC_NAME_LENGTH = 128;
const MAX_UNIT_LENGTH = 64;
const MAX_LABEL_KEY_LENGTH = 64;
const MAX_LABEL_VALUE_LENGTH = 128;
const MAX_LABEL_COUNT = 8;

const prohibitedMetricLabels = new Set(
  [
    'tenantid',
    'requestid',
    'correlationid',
    'traceid',
    'spanid',
    'userid',
    'errormessage',
  ],
);

const normalizeLabelKey = (key: string) =>
  key.trim().toLowerCase().replace(/[-_\s]/g, '');

const labelKeySchema = z
  .string()
  .min(1)
  .max(MAX_LABEL_KEY_LENGTH)
  .regex(/^[a-zA-Z][a-zA-Z0-9_.:-]*$/);

const labelValueSchema = z.union([
  z.string().min(1).max(MAX_LABEL_VALUE_LENGTH),
  z.number().finite(),
  z.boolean(),
]);

const metricLabelsSchema = z
  .record(labelKeySchema, labelValueSchema)
  .superRefine((labels, ctx) => {
    const keys = Object.keys(labels);

    if (keys.length > MAX_LABEL_COUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: MAX_LABEL_COUNT,
        type: 'array',
        inclusive: true,
        message: `labels must have at most ${MAX_LABEL_COUNT} entries`,
      });
    }

    for (const key of keys) {
      const normalized = normalizeLabelKey(key);

      if (prohibitedMetricLabels.has(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `label ${key} is prohibited`,
        });
      }
    }
  });

const isoTimestamp = z.string().datetime({ offset: true });

export const telemetryBaseContextSchema = z
  .object({
    requestId: z.string().min(1).max(MAX_ID_LENGTH),
    source: z.string().min(1).max(MAX_SOURCE_LENGTH),
    tenantId: z.string().min(1).max(MAX_ID_LENGTH).optional(),
    correlationId: z.string().min(1).max(MAX_ID_LENGTH).optional(),
    traceId: z.string().min(1).max(MAX_ID_LENGTH).optional(),
    spanId: z.string().min(1).max(MAX_ID_LENGTH).optional(),
    catalogVersion: z.string().min(1).max(MAX_VERSION_LENGTH).optional(),
  })
  .strict();

export const telemetryLogSchema = telemetryBaseContextSchema
  .extend({
    timestamp: isoTimestamp,
    level: z.nativeEnum(EventSeverity),
    message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const telemetryMetricSchema = telemetryBaseContextSchema
  .extend({
    timestamp: isoTimestamp,
    name: z.string().min(1).max(MAX_METRIC_NAME_LENGTH),
    kind: z.enum(['counter', 'gauge', 'histogram', 'ratio']),
    value: z.number().finite().nonnegative(),
    unit: z.string().min(1).max(MAX_UNIT_LENGTH).optional(),
    labels: metricLabelsSchema.optional(),
    description: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    numerator: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    denominator: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    population: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    exclusions: z.array(z.string().min(1).max(MAX_MESSAGE_LENGTH)).max(32).optional(),
    sourceMetrics: z.array(z.string().min(1).max(MAX_METRIC_NAME_LENGTH)).max(32).optional(),
  })
  .strict()
  .superRefine((metric, ctx) => {
    if (metric.kind !== 'ratio' && metric.denominator !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['denominator'],
        message: 'denominator is only valid for ratio metrics',
      });
    }
  });

export type TelemetryContextSchemaValue = z.infer<typeof telemetryBaseContextSchema>;
export type TelemetryLogSchemaValue = z.infer<typeof telemetryLogSchema>;
export type TelemetryMetricSchemaValue = z.infer<typeof telemetryMetricSchema>;

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

export const validateTelemetryContext = (
  value: unknown,
): TelemetryValidationResult<TelemetryContextSchemaValue> => {
  return toValidationResult(telemetryBaseContextSchema.safeParse(value));
};

export const validateTelemetryLog = (
  value: unknown,
): TelemetryValidationResult<TelemetryLogSchemaValue> => {
  return toValidationResult(telemetryLogSchema.safeParse(value));
};

export const validateTelemetryMetric = (
  value: unknown,
): TelemetryValidationResult<TelemetryMetricSchemaValue> => {
  return toValidationResult(telemetryMetricSchema.safeParse(value));
};
