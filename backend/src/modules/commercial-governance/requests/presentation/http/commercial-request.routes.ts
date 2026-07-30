import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../../core/http/middleware.js';
import { requirePermissions } from '../../../../rbac/rbac.guard.js';
import { commercialRequestController } from './commercial-request.controller.js';
import {
  createCommercialRequestRouteSchema,
  getCommercialRequestRouteSchema,
  listCommercialRequestsRouteSchema,
  transitionCommercialRequestRouteSchema,
} from './commercial-request.schema.js';

export async function commercialRequestRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    '/',
    {
      attachValidation: true,
      schema: createCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:create'),
      ],
    },
    commercialRequestController.create,
  );

  app.get(
    '/',
    {
      attachValidation: true,
      schema: listCommercialRequestsRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:read'),
      ],
    },
    commercialRequestController.list,
  );

  app.get(
    '/:id',
    {
      attachValidation: true,
      schema: getCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:read'),
      ],
    },
    commercialRequestController.getById,
  );

  app.post(
    '/:id/submit',
    {
      attachValidation: true,
      schema: transitionCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:submit'),
      ],
    },
    commercialRequestController.submit,
  );

  app.post(
    '/:id/approve',
    {
      attachValidation: true,
      schema: transitionCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:approve'),
      ],
    },
    commercialRequestController.approve,
  );

  app.post(
    '/:id/reject',
    {
      attachValidation: true,
      schema: transitionCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('commercial-request:reject'),
      ],
    },
    commercialRequestController.reject,
  );

  app.post(
    '/:id/close',
    {
      attachValidation: true,
      schema: transitionCommercialRequestRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        // TODO: replace with commercial-request:close when the permission exists.
        requirePermissions('commercial-request:reject'),
      ],
    },
    commercialRequestController.close,
  );
}

export default commercialRequestRoutes;
