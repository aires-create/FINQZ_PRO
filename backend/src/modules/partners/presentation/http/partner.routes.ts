import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';
import { partnerController } from './partner.controller.js';
import {
  createPartnerRouteSchema,
  deletePartnerRouteSchema,
  getPartnerRouteSchema,
  listPartnersRouteSchema,
  updatePartnerRouteSchema,
} from '../../validators/partner.http.schema.js';

export async function partnerRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  /**
   * @swagger
   * /api/v1/partners:
   *   get:
   *     summary: List partners
   *     description: Returns the tenant-scoped partner list. tenantId comes from the authenticated tenant context and actorUserId is not accepted in the body.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *       - in: query
   *         name: status
   *         required: false
   *         schema:
   *           type: string
   *           enum: [prospect, contato, negociacao, ativo, inativo]
   *       - in: query
   *         name: parentId
   *         required: false
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: search
   *         required: false
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 100
   *     responses:
   *       200:
   *         description: Partner list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, data, meta]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 meta:
   *                   type: object
   *                   required: [page, limit, total, totalPages]
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
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
    '/',
    {
      attachValidation: true,
      schema: listPartnersRouteSchema,
      preHandler: [requirePermissions('partner:read')],
    },
    partnerController.list,
  );

  /**
   * @swagger
   * /api/v1/partners/{id}:
   *   get:
   *     summary: Get partner by id
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Partner retrieved successfully
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
   *       404:
   *         description: Not found
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/:id',
    {
      attachValidation: true,
      schema: getPartnerRouteSchema,
      preHandler: [requirePermissions('partner:read')],
    },
    partnerController.getById,
  );

  /**
   * @swagger
   * /api/v1/partners:
   *   post:
   *     summary: Create partner
   *     description: Creates a tenant-scoped partner. tenantId and actorUserId are derived from authenticated context and must not be sent in the body.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [code, name, type, status]
   *             properties:
   *               code:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 120
   *               type:
   *                 type: string
   *                 enum: [COMPANY, FRANQUIA, FRANQUEADO]
   *               status:
   *                 type: string
   *                 enum: [prospect, contato, negociacao, ativo, inativo]
   *               document:
   *                 type: [string, 'null']
   *               email:
   *                 type: [string, 'null']
   *               phone:
   *                 type: [string, 'null']
   *               parentId:
   *                 type: [string, 'null']
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Partner created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, message, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       409:
   *         description: Conflict
   *       500:
   *         description: Internal server error
   */
  app.post(
    '/',
    {
      attachValidation: true,
      schema: createPartnerRouteSchema,
      preHandler: [requirePermissions('partner:create')],
    },
    partnerController.create,
  );

  /**
   * @swagger
   * /api/v1/partners/{id}:
   *   put:
   *     summary: Update partner
   *     description: Updates a tenant-scoped partner. tenantId and actorUserId are derived from authenticated context and must not be sent in the body.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             minProperties: 1
   *             properties:
   *               code:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 120
   *               type:
   *                 type: string
   *                 enum: [COMPANY, FRANQUIA, FRANQUEADO]
   *               status:
   *                 type: string
   *                 enum: [prospect, contato, negociacao, ativo, inativo]
   *               document:
   *                 type: [string, 'null']
   *               email:
   *                 type: [string, 'null']
   *               phone:
   *                 type: [string, 'null']
   *               parentId:
   *                 type: [string, 'null']
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Partner updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, message, data]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Not found
   *       409:
   *         description: Conflict
   *       500:
   *         description: Internal server error
   */
  app.put(
    '/:id',
    {
      attachValidation: true,
      schema: updatePartnerRouteSchema,
      preHandler: [requirePermissions('partner:update')],
    },
    partnerController.update,
  );

  /**
   * @swagger
   * /api/v1/partners/{id}:
   *   delete:
   *     summary: Delete partner
   *     description: Soft deletes a tenant-scoped partner. tenantId and actorUserId are derived from authenticated context and must not be sent in the body.
   *     tags: [Partners]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Partner deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [success, message]
   *               properties:
   *                 success:
   *                   type: boolean
   *                   enum: [true]
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Not found
   *       500:
   *         description: Internal server error
   */
  app.delete(
    '/:id',
    {
      attachValidation: true,
      schema: deletePartnerRouteSchema,
      preHandler: [requirePermissions('partner:delete')],
    },
    partnerController.delete,
  );
}

export default partnerRoutes;
