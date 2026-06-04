import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { logger } from '../../shared/logger.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import { TenantScopeViolationError } from '../opportunities/services/opportunities.service.js';
import { pipelinesService } from './service.js';

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;
  if (!tenantId) {
    throw new TenantScopeViolationError('tenant', 'missing');
  }

  return tenantId;
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof TenantScopeViolationError) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message,
      },
    });
  }

  logger.error('Pipelines route error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export async function pipelinesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get(
    '/',
    { preHandler: [requirePermissions('pipeline:read')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const data = await pipelinesService.listActiveByTenant(tenantId);

        return reply.send({
          success: true,
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );
}

export default pipelinesRoutes;
