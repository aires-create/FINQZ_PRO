import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../../types';
import type { JWTPayload } from '../../shared/types';

/**
 * Fastify middleware to authenticate JWT tokens
 */
export async function authenticate(request: any, reply: any): Promise<void> {
  try {
    await request.jwtVerify();
    const payload = request.user as JWTPayload;
    request.currentUser = payload;
    request.currentTenant = {
      tenantId: payload.tenantId,
      userId: payload.userId,
      roleId: payload.roleId,
    };
  } catch (error) {
    reply.status(401).send({
      success: false,
      message: 'Invalid or expired access token',
      statusCode: 401,
    });
  }
}

/**
 * Fastify middleware for tenant context validation
 */
export async function tenantContextMiddleware(request: any, reply: any): Promise<void> {
  const user = request.currentUser;
  
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!user.tenantId) {
    throw new AuthorizationError('Tenant context is missing from the token');
  }

  request.currentTenant = {
    tenantId: user.tenantId,
    userId: user.userId,
    roleId: user.roleId,
  };

  const requestedTenantId = 
    (request.params as any)?.tenantId ?? 
    (request.body as any)?.tenantId ?? 
    (request.query as any)?.tenantId;

  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    throw new AuthorizationError('Cross-tenant access denied');
  }
}
