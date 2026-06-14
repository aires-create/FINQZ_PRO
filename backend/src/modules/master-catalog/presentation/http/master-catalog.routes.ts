import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';
import { masterCatalogController } from './master-catalog.controller.js';
import {
  getMasterCatalogTreeRouteSchema,
  listMasterCatalogModalitiesBySubproductRouteSchema,
  listMasterCatalogProductsRouteSchema,
  listMasterCatalogSegmentsRouteSchema,
  listMasterCatalogSubproductsByProductRouteSchema,
} from '../../validators/master-catalog.http.schema.js';

export async function masterCatalogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  /**
   * @swagger
   * /api/v1/master-catalog/tree:
   *   get:
   *     summary: Get the master catalog tree
   *     tags: [Master Catalog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Master catalog tree retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/tree',
    {
      attachValidation: true,
      schema: getMasterCatalogTreeRouteSchema,
      preHandler: [requirePermissions('master-catalog:read')],
    },
    masterCatalogController.getTree,
  );

  /**
   * @swagger
   * /api/v1/master-catalog/segments:
   *   get:
   *     summary: List master catalog segments
   *     tags: [Master Catalog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Master catalog segments retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/segments',
    {
      attachValidation: true,
      schema: listMasterCatalogSegmentsRouteSchema,
      preHandler: [requirePermissions('master-catalog:read')],
    },
    masterCatalogController.listSegments,
  );

  /**
   * @swagger
   * /api/v1/master-catalog/products:
   *   get:
   *     summary: List master catalog products
   *     tags: [Master Catalog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Master catalog products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/products',
    {
      attachValidation: true,
      schema: listMasterCatalogProductsRouteSchema,
      preHandler: [requirePermissions('master-catalog:read')],
    },
    masterCatalogController.listProducts,
  );

  /**
   * @swagger
   * /api/v1/master-catalog/products/{productId}/subproducts:
   *   get:
   *     summary: List master catalog subproducts by product
   *     tags: [Master Catalog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Master catalog subproducts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/products/:productId/subproducts',
    {
      attachValidation: true,
      schema: listMasterCatalogSubproductsByProductRouteSchema,
      preHandler: [requirePermissions('master-catalog:read')],
    },
    masterCatalogController.listSubproductsByProduct,
  );

  /**
   * @swagger
   * /api/v1/master-catalog/subproducts/{subproductId}/modalities:
   *   get:
   *     summary: List master catalog modalities by subproduct
   *     tags: [Master Catalog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: subproductId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Master catalog modalities retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/subproducts/:subproductId/modalities',
    {
      attachValidation: true,
      schema: listMasterCatalogModalitiesBySubproductRouteSchema,
      preHandler: [requirePermissions('master-catalog:read')],
    },
    masterCatalogController.listModalitiesBySubproduct,
  );
}

export default masterCatalogRoutes;
