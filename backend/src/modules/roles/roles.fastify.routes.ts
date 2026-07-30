import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { AppError } from '../../shared/errors/index.js';
import { rolesService } from './service.js';
import type { CreateRoleRequest, UpdateRoleRequest } from './types.js';

type PaginationQuery = {
  page?: string;
  limit?: string;
};

type RoleParams = {
  roleId: string;
};

type CreateRoleBody = CreateRoleRequest;
type UpdateRoleBody = UpdateRoleRequest;

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new AppError({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return tenantId;
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

  const message = error instanceof Error ? error.message : 'Unexpected roles error';

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const validateCreateRoleBody = (body: unknown): CreateRoleBody => {
  if (!body || typeof body !== 'object') {
    throw new AppError({
      message: 'Invalid role payload',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const payload = body as Partial<CreateRoleBody>;

  if (!payload.name || typeof payload.name !== 'string') {
    throw new AppError({
      message: 'Role name is required',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  if (!payload.slug || typeof payload.slug !== 'string') {
    throw new AppError({
      message: 'Role slug is required',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    throw new AppError({
      message: 'Role description must be a string',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  if (payload.permissions !== undefined && !isStringArray(payload.permissions)) {
    throw new AppError({
      message: 'Role permissions must be an array of strings',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const validatedPayload: CreateRoleBody = {
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    permissions: payload.permissions ?? [],
  };

  if (payload.description !== undefined) {
    validatedPayload.description = payload.description.trim();
  }

  return validatedPayload;
};

const validateUpdateRoleBody = (body: unknown): UpdateRoleBody => {
  if (!body || typeof body !== 'object') {
    throw new AppError({
      message: 'Invalid role payload',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const payload = body as Partial<UpdateRoleBody>;
  const validatedPayload: UpdateRoleBody = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') {
      throw new AppError({
        message: 'Role name must be a non-empty string',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    validatedPayload.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string') {
      throw new AppError({
        message: 'Role description must be a string',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    validatedPayload.description = payload.description.trim();
  }

  if (payload.permissions !== undefined) {
    if (!isStringArray(payload.permissions)) {
      throw new AppError({
        message: 'Role permissions must be an array of strings',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    validatedPayload.permissions = payload.permissions;
  }

  return validatedPayload;
};

export async function rolesFastifyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get<{ Querystring: PaginationQuery }>('/', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const page = Number(request.query.page ?? 1);
      const limit = Number(request.query.limit ?? 100);
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 100;
      const skip = (safePage - 1) * safeLimit;

      const { roles, total } = await rolesService.getRoles(tenantId, skip, safeLimit);

      return reply.send({
        success: true,
        data: roles,
        message: 'Roles retrieved successfully',
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

  app.post<{ Body: CreateRoleBody }>('/', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const payload = validateCreateRoleBody(request.body);

      const role = await rolesService.createRole(tenantId, payload);

      return reply.status(201).send({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.patch<{ Params: RoleParams; Body: UpdateRoleBody }>('/:roleId', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const payload = validateUpdateRoleBody(request.body);

      const role = await rolesService.updateRole(tenantId, request.params.roleId, payload);

      return reply.send({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete<{ Params: RoleParams }>('/:roleId', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);

      await rolesService.deleteRole(tenantId, request.params.roleId);

      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: RoleParams }>('/:roleId', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const role = await rolesService.getRole(tenantId, request.params.roleId);

      return reply.send({
        success: true,
        data: role,
        message: 'Role retrieved successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}