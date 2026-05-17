import { createModuleLogger } from '../../shared/logger.js';
import {
  createSecurityEventLog,
  type CreateSecurityEventLogParams,
} from './repository.js';
import type {
  RecordSecurityEventInput,
  SecurityEventMetadata,
  SecurityEventMetadataValue,
} from './types.js';

const logger = createModuleLogger('SecurityEvents');

const sensitiveKeyPattern =
  /(password|senha|token|secret|authorization|cookie|credential|session)/i;
const redactedValue = '[REDACTED]';
const maxMetadataDepth = 4;
const maxMetadataKeys = 50;
const maxArrayItems = 25;
const maxStringLength = 512;

type SecurityEventMetadataRecord = {
  [key: string]: SecurityEventMetadataValue;
};

const isMetadataRecord = (
  value: SecurityEventMetadataValue,
): value is SecurityEventMetadataRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const truncateString = (value: string) => {
  if (value.length <= maxStringLength) {
    return value;
  }

  return `${value.slice(0, maxStringLength)}[TRUNCATED]`;
};

const sanitizeMetadataValue = (
  key: string,
  value: SecurityEventMetadataValue,
  depth: number,
): SecurityEventMetadataValue => {
  if (sensitiveKeyPattern.test(key)) {
    return redactedValue;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (depth >= maxMetadataDepth) {
    return '[MAX_DEPTH]';
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, maxArrayItems)
      .map((item) => sanitizeMetadataValue(key, item, depth + 1));
  }

  if (!isMetadataRecord(value)) {
    return '[UNSUPPORTED]';
  }

  return sanitizeMetadataRecord(value, depth + 1);
};

const sanitizeMetadataRecord = (
  metadata: SecurityEventMetadataRecord,
  depth = 0,
): SecurityEventMetadata => {
  const sanitizedEntries = Object.entries(metadata)
    .slice(0, maxMetadataKeys)
    .map(([key, value]) => [
      key,
      sanitizeMetadataValue(key, value, depth),
    ] as const);

  return Object.fromEntries(sanitizedEntries) as SecurityEventMetadata;
};

const sanitizeMetadata = (
  metadata?: SecurityEventMetadata | null,
): SecurityEventMetadata | undefined => {
  if (!metadata) {
    return undefined;
  }

  const sanitized = sanitizeMetadataRecord(metadata);

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const redactSensitiveText = (value: string) => {
  return value.replace(
    /\b(password|senha|token|secret|authorization|cookie|credential|session)\b\s*[:=]\s*[^,\s}]+/gi,
    '$1=[REDACTED]',
  );
};

const getErrorLogMeta = (error: unknown) => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: redactSensitiveText(error.message),
    };
  }

  return {
    errorName: 'UnknownError',
  };
};

export async function recordSecurityEvent(
  input: RecordSecurityEventInput,
): Promise<void> {
  const metadata = sanitizeMetadata(input.metadata);
  const params: CreateSecurityEventLogParams = {
    eventType: input.eventType,
    severity: input.severity,
    outcome: input.outcome,
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.route ? { route: input.route } : {}),
    ...(input.method ? { method: input.method } : {}),
    ...(metadata ? { metadata } : {}),
  };

  try {
    await createSecurityEventLog(params);
  } catch (error) {
    logger.error('Security event logging failed', {
      eventType: input.eventType,
      requestId: input.requestId,
      ...getErrorLogMeta(error),
    });
  }
}
