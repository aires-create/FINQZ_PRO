import type { FastifyInstance, FastifyReply } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { AppError } from '../../shared/errors/index.js';
import { permissionsService } from './service.js';

type PaginationQuery = {
  page?: string;
  limit?: string;
};

type PermissionParams = {
  permissionId: string;
};

type ResourceParams = {
  resource: string;
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  const message = error instanceof Error ? error.message : 'Unexpected permissions error';

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
};

export async function permissionsFastifyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get<{ Querystring: PaginationQuery }>('/', async (request, reply) => {
    try {
      const page = Number(request.query.page ?? 1);
      const limit = Number(request.query.limit ?? 500);
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 500;
      const skip = (safePage - 1) * safeLimit;

      const { permissions, total } = await permissionsService.getPermissions(skip, safeLimit);

      return reply.send({
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: ResourceParams }>('/resource/:resource', async (request, reply) => {
    try {
      const permissions = await permissionsService.getPermissionsByResource(request.params.resource);

      return reply.send({
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: PermissionParams }>('/:permissionId', async (request, reply) => {
    try {
      const permission = await permissionsService.getPermission(request.params.permissionId);

      return reply.send({
        success: true,
        data: permission,
        message: 'Permission retrieved successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
