import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import { membershipsController } from './memberships.controller.js';
import { createMembershipRouteSchema } from './memberships.schema.js';

export async function membershipsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.post(
    '/',
    {
      attachValidation: true,
      schema: createMembershipRouteSchema,
      preHandler: [requirePermissions('membership:create')],
    },
    membershipsController.create,
  );
}

export default membershipsRoutes;
