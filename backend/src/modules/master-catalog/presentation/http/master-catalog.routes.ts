import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';
import { masterCatalogController } from './master-catalog.controller.js';

export async function masterCatalogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get(
    '/tree',
    { preHandler: [requirePermissions('master-catalog:read')] },
    masterCatalogController.getTree,
  );

  app.get(
    '/segments',
    { preHandler: [requirePermissions('master-catalog:read')] },
    masterCatalogController.listSegments,
  );

  app.get(
    '/products',
    { preHandler: [requirePermissions('master-catalog:read')] },
    masterCatalogController.listProducts,
  );

  app.get(
    '/products/:productId/subproducts',
    { preHandler: [requirePermissions('master-catalog:read')] },
    masterCatalogController.listSubproductsByProduct,
  );

  app.get(
    '/subproducts/:subproductId/modalities',
    { preHandler: [requirePermissions('master-catalog:read')] },
    masterCatalogController.listModalitiesBySubproduct,
  );
}

export default masterCatalogRoutes;
