import type { FastifyRequest } from 'fastify';

export type EdpEnvelopePrimitive = string | number | boolean | null;

export type EdpEnvelopeJson =
  | EdpEnvelopePrimitive
  | { [key: string]: EdpEnvelopeJson }
  | EdpEnvelopeJson[];

export interface EdpSecurityContext {
  userId: string;
  tenantId: string;
  role?: string | null;
  permissions: string[];
  actorType?: string | null;
}

export interface EdpAuditContext {
  actorId: string;
  actorType: string;
  source: string;
  requestId: string;
  correlationId: string;
  tenantId: string;
}

export interface EdpCommandEnvelope {
  commandId: string;
  correlationId: string;
  causationId?: string | null;
  tenantId: string;
  userId: string;
  actorType: string;
  source: string;
  aggregateId?: string | null;
  aggregateType: string;
  schemaVersion: string;
  idempotencyKey: string;
  timestamp: string;
  metadata?: Record<string, EdpEnvelopeJson> | null;
  securityContext?: EdpSecurityContext | null;
  auditContext?: EdpAuditContext | null;
}

export interface EdpQueryEnvelope {
  queryId: string;
  correlationId: string;
  tenantId: string;
  userId: string;
  actorType: string;
  source: string;
  schemaVersion: string;
  timestamp: string;
  metadata?: Record<string, EdpEnvelopeJson> | null;
  securityContext?: EdpSecurityContext | null;
  auditContext?: EdpAuditContext | null;
}

export interface EdpResponseEnvelope<TData = unknown> {
  responseId: string;
  correlationId: string;
  tenantId: string;
  schemaVersion: string;
  timestamp: string;
  success: boolean;
  data: TData;
  metadata?: Record<string, EdpEnvelopeJson> | null;
  securityContext?: EdpSecurityContext | null;
  auditContext?: EdpAuditContext | null;
}

export interface EdpErrorEnvelope {
  errorId: string;
  correlationId: string;
  tenantId: string;
  schemaVersion: string;
  timestamp: string;
  code: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  safeMessage: string;
  internalMessage?: string | null;
  retryable: boolean;
  userAction?: string | null;
  auditReference?: string | null;
  providerReference?: string | null;
}

export interface EdpEventEnvelope<TName extends string = string, TPayload = Record<string, unknown>> {
  eventId: string;
  name: TName;
  version: string;
  correlationId: string;
  causationId?: string | null;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: string;
  payload: TPayload;
  metadata?: Record<string, EdpEnvelopeJson> | null;
  securityContext?: EdpSecurityContext | null;
  auditContext?: EdpAuditContext | null;
}

export type EdpFastifyRequest = FastifyRequest & {
  edpContext?: {
    correlationId: string;
    causationId?: string | null;
    idempotencyKey?: string | null;
    securityContext: EdpSecurityContext | null;
    auditContext: EdpAuditContext | null;
  };
};
