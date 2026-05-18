import type { FastifyRequest } from 'fastify';

import { config } from '../../config/app.js';
import { createModuleLogger } from '../../shared/logger.js';
import {
  createSecurityEventLog,
  type CreateSecurityEventLogParams,
} from './repository.js';
import type {
  RecordSecurityEventInput,
  SecurityEventContext,
  SecurityEventMetadata,
  SecurityEventMetadataValue,
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType,
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

export interface RecordRequestSecurityEventInput {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  outcome: SecurityEventOutcome;
  tenantId?: string | null;
  userId?: string | null;
  metadata?: SecurityEventMetadata | null;
  dedupeKey?: string;
}

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const getRequestRoute = (request: FastifyRequest) => {
  return request.routeOptions?.url ?? request.url;
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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getErrorCode = (error: unknown) => {
  if (!isRecord(error)) {
    return undefined;
  }

  const errorCode = error.code;

  if (typeof errorCode === 'string' || typeof errorCode === 'number') {
    return String(errorCode);
  }

  return undefined;
};

const getErrorLogMeta = (error: unknown) => {
  const meta: Record<string, unknown> = {
    errorName: 'UnknownError',
    errorCode: getErrorCode(error),
  };

  if (error instanceof Error) {
    meta.errorName = error.name;
    meta.errorMessage =
      config.nodeEnv === 'production'
        ? 'Security event logging failed'
        : redactSensitiveText(error.message);

    if (config.nodeEnv !== 'production' && error.stack) {
      meta.stack = redactSensitiveText(error.stack);
    }
  }

  return meta;
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
      severity: input.severity,
      outcome: input.outcome,
      requestId: input.requestId,
      tenantId: input.tenantId,
      userId: input.userId,
      method: input.method,
      route: input.route,
      ip: input.ipAddress,
      userAgent: input.userAgent,
      ...getErrorLogMeta(error),
    });
  }
}

export function getSecurityEventContextFromRequest(
  request: FastifyRequest,
): SecurityEventContext {
  const userAgent = getHeaderValue(request.headers['user-agent']);
  const route = getRequestRoute(request);

  return {
    ...(request.currentTenant?.tenantId
      ? { tenantId: request.currentTenant.tenantId }
      : {}),
    ...(request.currentUser?.userId
      ? { userId: request.currentUser.userId }
      : {}),
    ...(request.normalizedIp ?? request.ip
      ? { ipAddress: request.normalizedIp ?? request.ip }
      : {}),
    ...(userAgent ? { userAgent } : {}),
    ...(request.requestId ?? request.id
      ? { requestId: request.requestId ?? request.id }
      : {}),
    ...(route ? { route } : {}),
    ...(request.method ? { method: request.method } : {}),
  };
}

export function hasRecordedSecurityEvent(request: FastifyRequest): boolean {
  return Boolean(request.securityEventLogKeys?.length);
}

export function recordRequestSecurityEvent(
  request: FastifyRequest,
  input: RecordRequestSecurityEventInput,
): void {
  const eventKey = input.dedupeKey ?? input.eventType;
  const recordedKeys = request.securityEventLogKeys ?? [];

  if (recordedKeys.includes(eventKey)) {
    return;
  }

  request.securityEventLogKeys = [...recordedKeys, eventKey];

  const { dedupeKey: _dedupeKey, ...eventInput } = input;

  void recordSecurityEvent({
    ...getSecurityEventContextFromRequest(request),
    ...eventInput,
  });
}
