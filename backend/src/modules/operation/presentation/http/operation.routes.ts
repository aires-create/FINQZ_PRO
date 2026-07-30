import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';
import { operationController } from './operation.controller.js';

export async function operationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.post(
    '/',
    { preHandler: [requirePermissions('operation:create')] },
    operationController.create,
  );

  app.get(
    '/',
    { preHandler: [requirePermissions('operation:read')] },
    operationController.list,
  );

  app.get(
    '/number/:operationNumber',
    { preHandler: [requirePermissions('operation:read')] },
    operationController.getByNumber,
  );

  app.get(
    '/:id',
    { preHandler: [requirePermissions('operation:read')] },
    operationController.getById,
  );
}

export default operationRoutes;
