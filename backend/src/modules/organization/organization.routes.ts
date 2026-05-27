import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import { organizationController } from './organization.controller.js';
import {
  createOrganizationRouteSchema,
  deleteOrganizationRouteSchema,
  getOrganizationRouteSchema,
  listOrganizationsRouteSchema,
  updateOrganizationRouteSchema,
} from './organization.schema.js';

export async function organizationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get(
    '/',
    {
      attachValidation: true,
      schema: listOrganizationsRouteSchema,
      preHandler: [requirePermissions('organization:read')],
    },
    organizationController.list,
  );

  app.get(
    '/:id',
    {
      attachValidation: true,
      schema: getOrganizationRouteSchema,
      preHandler: [requirePermissions('organization:read')],
    },
    organizationController.getById,
  );

  app.post(
    '/',
    {
      attachValidation: true,
      schema: createOrganizationRouteSchema,
      preHandler: [requirePermissions('organization:create')],
    },
    organizationController.create,
  );

  app.patch(
    '/:id',
    {
      attachValidation: true,
      schema: updateOrganizationRouteSchema,
      preHandler: [requirePermissions('organization:update')],
    },
    organizationController.update,
  );

  app.delete(
    '/:id',
    {
      attachValidation: true,
      schema: deleteOrganizationRouteSchema,
      preHandler: [requirePermissions('organization:delete')],
    },
    organizationController.softDelete,
  );
}

export default organizationRoutes;
