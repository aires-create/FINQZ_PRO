import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../../types/index.js';
import { prisma } from '../../core/prisma/client.js';
import type {
  JWTPayload,
  OwnershipMetadata,
  TenantContext,
  TenantScopeRole,
} from '../../shared/types/index.js';
import { recordRequestSecurityEvent } from '../../modules/security-events/index.js';

type TenantBearingSource = Record<string, unknown> | null | undefined;
type ErrorWithCode = {
  code?: unknown;
};

const jwtAuthRequiredCodes = new Set([
  'FST_JWT_NO_AUTHORIZATION_IN_HEADER',
  'FST_JWT_NO_AUTHORIZATION_IN_COOKIE',
]);

const jwtExpiredCodes = new Set([
  'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED',
]);

const TENANT_ADMIN_ROLE_TYPES = new Set(['ADMIN', 'SYSTEM']);
const TENANT_ADMIN_ROLE_NAMES = new Set([
  'admin',
  'owner',
  'super_admin',
  'tenant_admin',
  'matrix',
  'matriz',
  'root',
]);

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const code = (error as ErrorWithCode).code;

  return typeof code === 'string' ? code : undefined;
};

const asRecord = (value: unknown): TenantBearingSource => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
};

const getStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return getStringValue(value[0]);
  }

  return undefined;
};

const getRequestedTenantId = (request: FastifyRequest): string | undefined => {
  const params = asRecord(request.params);
  const body = asRecord(request.body);
  const query = asRecord(request.query);

  return (
    getStringValue(params?.tenantId) ??
    getStringValue(body?.tenantId) ??
    getStringValue(query?.tenantId)
  );
};

const normalizeRoleName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
};

const isTenantAdminRole = (role: {
  slug?: string | null;
  name?: string | null;
  type?: string | null;
}) => {
  const roleType = role.type?.trim().toUpperCase();
  if (roleType && TENANT_ADMIN_ROLE_TYPES.has(roleType)) {
    return true;
  }

  const roleSlug = normalizeRoleName(role.slug);
  const roleName = normalizeRoleName(role.name);

  return Boolean(
    (roleSlug && TENANT_ADMIN_ROLE_NAMES.has(roleSlug)) ||
      (roleName && TENANT_ADMIN_ROLE_NAMES.has(roleName)),
  );
};

const resolveScopeRole = (
  partnerId: string | null | undefined,
  roles: Array<{ slug?: string | null; name?: string | null; type?: string | null }>,
): TenantScopeRole => {
  if (roles.some((role) => isTenantAdminRole(role))) {
    return 'tenant_admin';
  }

  if (partnerId) {
    return 'partner_user';
  }

  return 'owner_user';
};

const resolveTenantContextFromDatabase = async (
  payload: JWTPayload,
): Promise<TenantContext | null> => {
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      tenantId: payload.tenantId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      tenantId: true,
      organizationId: true,
      partnerId: true,
      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const roles = user.userRoles
    .map((userRole) => userRole.role)
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    slug: string;
    type: string | null;
  }>;

  const organizationId = payload.organizationId ?? user.organizationId ?? undefined;
  const partnerId = payload.partnerId ?? user.partnerId ?? undefined;
  const scopeRole = payload.scopeRole ?? resolveScopeRole(partnerId, roles);

  const ownership: OwnershipMetadata = {
    userId: user.id,
    ...(organizationId ? { organizationId } : {}),
    ...(partnerId ? { partnerId } : {}),
    scopeRole,
  };

  return {
    tenantId: user.tenantId,
    userId: user.id,
    ...(organizationId ? { organizationId } : {}),
    ...(partnerId ? { partnerId } : {}),
    scopeRole,
    ownership,
    permissions: payload.permissions ?? [],
    ...(payload.roleId ? { roleId: payload.roleId } : {}),
    ...(payload.role ? { role: payload.role } : {}),
  };
};

export const isJwtPayload = (payload: unknown): payload is JWTPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<JWTPayload>;

  return Boolean(
    getStringValue(candidate.userId) &&
      getStringValue(candidate.tenantId),
  );
};

export const buildTenantContext = (payload: JWTPayload): TenantContext => ({
  tenantId: payload.tenantId,
  userId: payload.userId,
  ...(payload.organizationId ? { organizationId: payload.organizationId } : {}),
  ...(payload.partnerId ? { partnerId: payload.partnerId } : {}),
  ...(payload.scopeRole ? { scopeRole: payload.scopeRole } : {}),
  ...(payload.ownership ? { ownership: payload.ownership } : {}),
  permissions: payload.permissions ?? [],
  ...(payload.roleId ? { roleId: payload.roleId } : {}),
  ...(payload.role ? { role: payload.role } : {}),
});

const recordJwtVerificationFailure = (
  request: FastifyRequest,
  error: unknown,
) => {
  const code = getErrorCode(error);

  if (code && jwtAuthRequiredCodes.has(code)) {
    recordRequestSecurityEvent(request, {
      eventType: 'AUTH_REQUIRED',
      severity: 'LOW',
      outcome: 'BLOCKED',
      metadata: {
        reason: 'missing_authorization',
        source: 'jwt_authenticate',
      },
    });
    return;
  }

  if (code && jwtExpiredCodes.has(code)) {
    recordRequestSecurityEvent(request, {
      eventType: 'JWT_EXPIRED',
      severity: 'LOW',
      outcome: 'BLOCKED',
      metadata: {
        reason: 'token_expired',
        source: 'jwt_authenticate',
      },
    });
    return;
  }

  recordRequestSecurityEvent(request, {
    eventType: 'JWT_INVALID',
    severity: 'MEDIUM',
    outcome: 'BLOCKED',
    metadata: {
      reason: code ?? 'token_verification_failed',
      source: 'jwt_authenticate',
    },
  });
};

/**
 * Fastify middleware to authenticate JWT tokens
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JWTPayload>();

    if (!isJwtPayload(payload)) {
      recordRequestSecurityEvent(request, {
        eventType: 'JWT_INVALID',
        severity: 'MEDIUM',
        outcome: 'BLOCKED',
        metadata: {
          reason: 'invalid_payload',
          source: 'jwt_authenticate',
        },
      });
      throw new AuthenticationError('Invalid token payload', 401);
    }

    request.currentUser = payload;
    request.currentTenant = buildTenantContext(payload);
  } catch (error) {
    request.currentUser = null;
    request.currentTenant = null;

    if (error instanceof AuthenticationError) {
      throw error;
    }

    recordJwtVerificationFailure(request, error);

    throw new AuthenticationError('Invalid or expired access token', 401);
  }
}

/**
 * Fastify middleware for tenant context validation
 */
export async function tenantContextMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = request.currentUser;

  if (!isJwtPayload(user)) {
    recordRequestSecurityEvent(request, {
      eventType: 'AUTH_REQUIRED',
      severity: 'LOW',
      outcome: 'BLOCKED',
      metadata: {
        reason: 'missing_authenticated_user',
        source: 'tenant_context',
      },
    });
    throw new AuthenticationError('Authentication required');
  }

  if (!user.tenantId) {
    throw new AuthorizationError('Tenant context is missing from the token');
  }

  const resolvedTenantContext = await resolveTenantContextFromDatabase(user);

  if (!resolvedTenantContext) {
    throw new AuthorizationError('User context could not be resolved');
  }

  request.currentUser = {
    ...user,
    ...(resolvedTenantContext.organizationId ? { organizationId: resolvedTenantContext.organizationId } : {}),
    ...(resolvedTenantContext.partnerId ? { partnerId: resolvedTenantContext.partnerId } : {}),
    ...(resolvedTenantContext.scopeRole ? { scopeRole: resolvedTenantContext.scopeRole } : {}),
    ...(resolvedTenantContext.ownership ? { ownership: resolvedTenantContext.ownership } : {}),
  };

  request.currentTenant = resolvedTenantContext;

  const requestedTenantId = getRequestedTenantId(request);

  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    recordRequestSecurityEvent(request, {
      eventType: 'CROSS_TENANT_ACCESS_DENIED',
      severity: 'HIGH',
      outcome: 'BLOCKED',
      tenantId: user.tenantId,
      userId: user.userId,
      metadata: {
        requestedTenantId,
        source: 'tenant_context',
      },
    });
    throw new AuthorizationError('Cross-tenant access denied');
  }
}
