export const securityEventTypes = [
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGIN_SUCCEEDED',
  'JWT_INVALID',
  'JWT_EXPIRED',
  'AUTH_REQUIRED',
  'ACCESS_FORBIDDEN',
  'RBAC_PERMISSION_DENIED',
  'CROSS_TENANT_ACCESS_DENIED',
  'RATE_LIMIT_EXCEEDED',
  'REFRESH_TOKEN_INVALID',
  'REFRESH_TOKEN_EXPIRED',
  'REFRESH_TOKEN_REVOKED',
] as const;

export type SecurityEventType = (typeof securityEventTypes)[number];

export const securityEventSeverities = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export type SecurityEventSeverity =
  (typeof securityEventSeverities)[number];

export const securityEventOutcomes = [
  'SUCCESS',
  'FAILURE',
  'BLOCKED',
] as const;

export type SecurityEventOutcome = (typeof securityEventOutcomes)[number];

export type SecurityEventMetadataPrimitive = string | number | boolean | null;

export type SecurityEventMetadataValue =
  | SecurityEventMetadataPrimitive
  | SecurityEventMetadataValue[]
  | { [key: string]: SecurityEventMetadataValue };

export type SecurityEventMetadata = Record<string, SecurityEventMetadataValue>;

export interface SecurityEventContext {
  tenantId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  route?: string | null;
  method?: string | null;
  metadata?: SecurityEventMetadata | null;
}

export interface RecordSecurityEventInput extends SecurityEventContext {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  outcome: SecurityEventOutcome;
}
