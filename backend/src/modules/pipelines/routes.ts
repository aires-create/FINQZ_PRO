import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { logger } from '../../shared/logger.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import { TenantScopeViolationError } from '../opportunities/services/opportunities.service.js';
import { pipelinesService } from './service.js';
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

  app.post(
    '/',
    { preHandler: [requirePermissions('pipeline:create')] },
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
          pipelineId: params.stageId,
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
