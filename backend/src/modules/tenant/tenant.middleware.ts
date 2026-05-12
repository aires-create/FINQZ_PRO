import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../../types';

export const tenantContext = async (request: FastifyRequest, reply: FastifyReply) => {
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

  const requestedTenantId = (request.params as any)?.tenantId ?? (request.body as any)?.tenantId ?? (request.query as any)?.tenantId;
  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    throw new AuthorizationError('Cross-tenant access denied');
  }
};
