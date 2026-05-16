import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../../types/index.js';
import type { JWTPayload, TenantContext } from '../../shared/types/index.js';

type TenantBearingSource = Record<string, unknown> | null | undefined;

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
  permissions: payload.permissions ?? [],
  ...(payload.roleId ? { roleId: payload.roleId } : {}),
  ...(payload.role ? { role: payload.role } : {}),
});

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
    throw new AuthenticationError('Authentication required');
  }

  if (!user.tenantId) {
    throw new AuthorizationError('Tenant context is missing from the token');
  }

  request.currentTenant = buildTenantContext(user);

  const requestedTenantId = getRequestedTenantId(request);

  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    throw new AuthorizationError('Cross-tenant access denied');
  }
}
