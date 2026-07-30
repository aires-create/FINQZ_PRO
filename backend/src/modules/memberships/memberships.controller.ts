import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { createModuleLogger } from '../../shared/logger.js';
import type { Prisma } from '@prisma/client';
import type { CreateMembershipRequest } from './types.js';
import { AppError as SharedAppError } from '../../shared/errors/index.js';
import {
  AppError as LegacyAppError,
  AuthorizationError as LegacyAuthorizationError,
  ValidationError as LegacyValidationError,
} from '../../types/index.js';
import { membershipsService, type MembershipsService } from './service.js';
import {
  createMembershipBodySchema,
  type CreateMembershipBodyDto,
} from './memberships.schema.js';

const logger = createModuleLogger('MembershipsFastifyController');

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new SharedAppError({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return tenantId;
};

const getCurrentUserId = (request: FastifyRequest) => {
  const userId = request.currentUser?.userId ?? request.currentTenant?.userId;

  if (!userId) {
    throw new SharedAppError({
      message: 'Authentication required',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return userId;
};

const sendValidationError = (reply: FastifyReply, details?: unknown) =>
  reply.status(400).send({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      ...(details ? { details } : {}),
    },
  });

const hasFastifyValidationError = (request: FastifyRequest) =>
  Boolean(request.validationError);

const handleControllerError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return sendValidationError(reply, error.flatten());
  }

  if (error instanceof SharedAppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
  }

  if (error instanceof LegacyValidationError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.errors ?? null,
      },
    });
  }

  if (error instanceof LegacyAuthorizationError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message,
      },
    });
  }

  if (error instanceof LegacyAppError) {
    const code =
      error.statusCode === 404
        ? 'NOT_FOUND'
        : error.statusCode === 409
          ? 'CONFLICT'
          : error.statusCode === 401
            ? 'UNAUTHORIZED'
            : error.statusCode === 403
              ? 'FORBIDDEN'
              : error.statusCode === 400
                ? 'BAD_REQUEST'
                : 'INTERNAL_ERROR';

    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code,
        message: error.message,
      },
    });
  }

  logger.error('Unexpected memberships controller error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export class MembershipsController {
  constructor(private readonly service: MembershipsService = membershipsService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const actorUserId = getCurrentUserId(request);
      const body = createMembershipBodySchema.parse(request.body) as CreateMembershipBodyDto;
      const data: CreateMembershipRequest = {
        userId: body.userId,
        organizationId: body.organizationId,
        role: body.role,
        ...(body.permissions !== undefined
          ? { permissions: body.permissions as Prisma.InputJsonValue }
          : {}),
      };
      const membership = await this.service.createMembership(tenantId, actorUserId, data);

      return reply.status(201).send({
        success: true,
        message: 'Membership created successfully',
        data: membership,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}

export const membershipsController = new MembershipsController();
