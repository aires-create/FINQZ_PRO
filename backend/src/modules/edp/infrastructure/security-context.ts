import type { EdpAuditContext, EdpSecurityContext } from '../contracts/envelopes.js';

export interface EdpRuntimeRequestContext {
  correlationId: string;
  causationId?: string | null;
  idempotencyKey?: string | null;
  securityContext: EdpSecurityContext;
  auditContext: EdpAuditContext;
}

export const buildEdpSecurityContext = (request: {
  currentUser?: {
    userId: string;
    tenantId: string;
    role?: string | null;
    permissions?: string[];
  } | null;
}): EdpSecurityContext | null => {
  const user = request.currentUser;

  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    tenantId: user.tenantId,
    role: user.role ?? null,
    permissions: user.permissions ?? [],
    actorType: user.role ?? 'user',
  };
};

export const hasTenantAccess = (
  securityContext: EdpSecurityContext | null,
  tenantId: string,
) => {
  return Boolean(securityContext && securityContext.tenantId === tenantId);
};

