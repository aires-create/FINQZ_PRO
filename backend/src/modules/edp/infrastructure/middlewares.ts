import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

import { AuthenticationError, AuthorizationError } from '../../../types/index.js';
import type { EdpFastifyRequest } from '../contracts/envelopes.js';
import { buildEdpSecurityContext, type EdpRuntimeRequestContext } from './security-context.js';

const asRequest = (request: FastifyRequest) => request as EdpFastifyRequest;

const getHeader = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return value;
};

export const edpCorrelationMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const correlationId =
    getHeader(request.headers['x-correlation-id']) ?? request.id ?? randomUUID();
  const causationId = getHeader(request.headers['x-causation-id']) ?? null;
  const idempotencyKey = getHeader(request.headers['idempotency-key']) ?? null;

  asRequest(request).edpContext = {
    correlationId,
    causationId,
    idempotencyKey,
    securityContext: null,
    auditContext: null,
  };
};

export const edpSecurityContextMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const securityContext = buildEdpSecurityContext(request as FastifyRequest & {
    currentUser?: {
      userId: string;
      tenantId: string;
      role?: string | null;
      permissions?: string[];
    } | null;
  });

  if (!securityContext) {
    throw new AuthenticationError('Authentication required for EDP runtime foundation');
  }

  if (securityContext.permissions.length === 0) {
    throw new AuthorizationError('RBAC context missing permissions');
  }

  const current = asRequest(request).edpContext;

  asRequest(request).edpContext = {
    correlationId: current?.correlationId ?? request.id ?? randomUUID(),
    causationId: current?.causationId ?? null,
    idempotencyKey: current?.idempotencyKey ?? null,
    securityContext,
    auditContext: {
      actorId: securityContext.userId,
      actorType: securityContext.actorType ?? 'user',
      source: 'edp-runtime-foundation',
      requestId: request.id,
      correlationId: current?.correlationId ?? request.id,
      tenantId: securityContext.tenantId,
    },
  };
};

export const edpTenantMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const current = asRequest(request).edpContext;
  const tenantId = request.currentTenant?.tenantId ?? request.currentUser?.tenantId;

  if (!tenantId) {
    throw new AuthorizationError('Tenant context is missing');
  }

  if (current?.securityContext && current.securityContext.tenantId !== tenantId) {
    throw new AuthorizationError('Cross-tenant access denied');
  }
};

export const edpAuditMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const current = asRequest(request).edpContext;

  if (!current?.auditContext) {
    asRequest(request).edpContext = {
      correlationId: current?.correlationId ?? request.id ?? randomUUID(),
      causationId: current?.causationId ?? null,
      idempotencyKey: current?.idempotencyKey ?? null,
      securityContext: current?.securityContext ?? null,
      auditContext: {
        actorId: request.currentUser?.userId ?? 'system',
        actorType: request.currentUser?.role ?? 'system',
        source: 'edp-audit-middleware',
        requestId: request.id,
        correlationId: current?.correlationId ?? request.id,
        tenantId: request.currentTenant?.tenantId ?? request.currentUser?.tenantId ?? 'unknown',
      },
    };
  }
};

export const edpIdempotencyHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const current = asRequest(request).edpContext;

  if (!current?.idempotencyKey && request.method !== 'GET') {
    throw new AuthorizationError('Idempotency key is required for mutable EDP commands');
  }
};

export const edpObservabilityHook = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const current = asRequest(request).edpContext;
  const observability = {
    route: request.routeOptions?.url ?? request.url,
    method: request.method,
    correlationId: current?.correlationId ?? request.id,
    tenantId: request.currentTenant?.tenantId ?? request.currentUser?.tenantId ?? null,
  };

  (request as FastifyRequest & { edpObservability?: Record<string, unknown> }).edpObservability = observability;
};

export type { EdpRuntimeRequestContext };
