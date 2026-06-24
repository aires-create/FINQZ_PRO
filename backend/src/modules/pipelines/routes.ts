import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { logger } from '../../shared/logger.js';
import { ConflictError } from '../../shared/errors/AppError.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import { TenantScopeViolationError } from '../opportunities/services/opportunities.service.js';
import {
  PipelineNotFoundError,
  StageNotFoundError,
  pipelinesService,
} from './service.js';
import {
  createPipelineBodySchema,
  createStageBodySchema,
  pipelineIdParamsSchema,
  reorderStagesBodySchema,
  stageIdParamsSchema,
  updatePipelineBodySchema,
  updateStageBodySchema,
} from './validators/pipeline.http.schema.js';

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;
  if (!tenantId) {
    throw new TenantScopeViolationError('tenant', 'missing');
  }

  return tenantId;
};

const getActorId = (request: FastifyRequest) => {
  return request.currentUser?.userId ?? request.currentTenant?.userId ?? null;
};

const requireActorId = (request: FastifyRequest) => {
  const actorId = getActorId(request);

  if (!actorId) {
    throw new TenantScopeViolationError('user', 'missing');
  }

  return actorId;
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: error.flatten(),
      },
    });
  }

  if (error instanceof PipelineNotFoundError || error instanceof StageNotFoundError) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    });
  }

  if (error instanceof TenantScopeViolationError) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message,
      },
    });
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      success: false,
      error: {
        code: 'CONFLICT',
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

  app.post(
    '/',
    { preHandler: [requirePermissions('pipeline:create')] },
    /**
     * @swagger
     * /api/v1/pipelines:
     *   post:
     *     summary: Create pipeline
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *               description:
     *                 type: string
     *                 nullable: true
     *               isDefault:
     *                 type: boolean
     *               isActive:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Pipeline created successfully
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
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: [success, error]
     *               properties:
     *                 success:
     *                   type: boolean
     *                   enum: [false]
     *                 error:
     *                   type: object
     *                   properties:
     *                     code:
     *                       type: string
     *                       enum: [VALIDATION_ERROR]
     *                     message:
     *                       type: string
     *                     details:
     *                       type: object
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const body = createPipelineBodySchema.parse(request.body);
        const data = await pipelinesService.createPipeline({
          tenantId,
          actorUserId,
          name: body.name,
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
        });

        return reply.status(201).send({
          success: true,
          message: 'Pipeline created successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.put(
    '/:pipelineId',
    { preHandler: [requirePermissions('pipeline:update')] },
    /**
     * @swagger
     * /api/v1/pipelines/{pipelineId}:
     *   put:
     *     summary: Update pipeline
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: pipelineId
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
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *               description:
     *                 type: string
     *                 nullable: true
     *               isDefault:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Pipeline updated successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Pipeline not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = pipelineIdParamsSchema.parse(request.params);
        const body = updatePipelineBodySchema.parse(request.body);
        const data = await pipelinesService.updatePipeline({
          tenantId,
          actorUserId,
          id: params.pipelineId,
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        });

        return reply.send({
          success: true,
          message: 'Pipeline updated successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.delete(
    '/:pipelineId',
    { preHandler: [requirePermissions('pipeline:delete')] },
    /**
     * @swagger
     * /api/v1/pipelines/{pipelineId}:
     *   delete:
     *     summary: Delete pipeline
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: pipelineId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Pipeline deleted successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Pipeline not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = pipelineIdParamsSchema.parse(request.params);

        await pipelinesService.deactivatePipeline({
          tenantId,
          actorUserId,
          pipelineId: params.pipelineId,
        });

        return reply.send({
          success: true,
          message: 'Pipeline deleted successfully',
          data: {
            id: params.pipelineId,
          },
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.post(
    '/:pipelineId/stages',
    { preHandler: [requirePermissions('stage:create')] },
    /**
     * @swagger
     * /api/v1/pipelines/{pipelineId}/stages:
     *   post:
     *     summary: Create stage
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: pipelineId
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
     *             required: [name, order, isWon, isLost]
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *               order:
     *                 type: integer
     *                 minimum: 1
     *               isWon:
     *                 type: boolean
     *               isLost:
     *                 type: boolean
     *             description: isWon and isLost must not be true at the same time.
     *     responses:
     *       201:
     *         description: Stage created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Pipeline not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = pipelineIdParamsSchema.parse(request.params);
        const body = createStageBodySchema.parse(request.body);
        const data = await pipelinesService.createStage({
          tenantId,
          actorUserId,
          pipelineId: params.pipelineId,
          ...body,
        });

        return reply.status(201).send({
          success: true,
          message: 'Stage created successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.put(
    '/stages/:stageId',
    { preHandler: [requirePermissions('stage:update')] },
    /**
     * @swagger
     * /api/v1/pipelines/stages/{stageId}:
     *   put:
     *     summary: Update stage
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: stageId
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
     *             properties:
     *               name:
     *                 type: string
     *                 minLength: 1
     *               order:
     *                 type: integer
     *                 minimum: 1
     *               isWon:
     *                 type: boolean
     *               isLost:
     *                 type: boolean
     *             description: isWon and isLost must not be true at the same time.
     *     responses:
     *       200:
     *         description: Stage updated successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Stage not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = stageIdParamsSchema.parse(request.params);
        const body = updateStageBodySchema.parse(request.body);
        const data = await pipelinesService.updateStage({
          tenantId,
          actorUserId,
          id: params.stageId,
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.order !== undefined ? { order: body.order } : {}),
          ...(body.isWon !== undefined ? { isWon: body.isWon } : {}),
          ...(body.isLost !== undefined ? { isLost: body.isLost } : {}),
        });

        return reply.send({
          success: true,
          message: 'Stage updated successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.delete(
    '/stages/:stageId',
    { preHandler: [requirePermissions('stage:delete')] },
    /**
     * @swagger
     * /api/v1/pipelines/stages/{stageId}:
     *   delete:
     *     summary: Delete stage
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: stageId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Stage deleted successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Stage not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = stageIdParamsSchema.parse(request.params);

        await pipelinesService.deactivateStage({
          tenantId,
          actorUserId,
          stageId: params.stageId,
        });

        return reply.send({
          success: true,
          message: 'Stage deleted successfully',
          data: {
            id: params.stageId,
          },
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.patch(
    '/:pipelineId/stages/reorder',
    { preHandler: [requirePermissions('stage:update')] },
    /**
     * @swagger
     * /api/v1/pipelines/{pipelineId}/stages/reorder:
     *   patch:
     *     summary: Reorder stages
     *     tags: [Pipeline]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: pipelineId
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
     *             required: [stages]
     *             properties:
     *               stages:
     *                 type: array
     *                 minItems: 1
     *                 items:
     *                   type: object
     *                   required: [stageId, order]
     *                   properties:
     *                     stageId:
     *                       type: string
     *                       format: uuid
     *                     order:
     *                       type: integer
     *                       minimum: 1
     *     responses:
     *       200:
     *         description: Stages reordered successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: Pipeline not found
     *       500:
     *         description: Internal server error
     */
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorUserId = requireActorId(request);
        const params = pipelineIdParamsSchema.parse(request.params);
        const body = reorderStagesBodySchema.parse(request.body);
        const data = await pipelinesService.reorderStages({
          tenantId,
          actorUserId,
          pipelineId: params.pipelineId,
          stages: body.stages.map((stage) => ({
            id: stage.stageId,
            order: stage.order,
          })),
        });

        return reply.send({
          success: true,
          message: 'Stages reordered successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );
}

export default pipelinesRoutes;
