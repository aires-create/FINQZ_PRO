import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { AppError, BadRequestError } from '../../shared/errors/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import { organizationService, type OrganizationService } from './organization.service.js';
import {
  createOrganizationBodySchema,
  listOrganizationsQuerySchema,
  organizationIdParamsSchema,
  updateOrganizationBodySchema,
} from './organization.schema.js';

const logger = createModuleLogger('OrganizationController');

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new BadRequestError('Missing tenant context');
  }

  return tenantId;
};

const getCurrentUserId = (request: FastifyRequest) => {
  return request.currentUser?.userId ?? request.currentTenant?.userId;
};

const sendValidationError = (reply: FastifyReply, details?: unknown) => {
  return reply.status(400).send({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      ...(details ? { details } : {}),
    },
  });
};

const hasFastifyValidationError = (request: FastifyRequest) => {
  return Boolean(request.validationError);
};

const handleControllerError = (error: unknown, reply: FastifyReply) => {
  if (error instanceof ZodError) {
    return sendValidationError(reply, error.flatten());
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
  }

  logger.error('Unexpected organization controller error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export class OrganizationController {
  constructor(private readonly service: OrganizationService = organizationService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const query = listOrganizationsQuerySchema.parse(request.query);

      logger.info('List organizations request', {
        tenantId,
        userId: getCurrentUserId(request),
      });

      const result = await this.service.listOrganizations(tenantId, query);

      return reply.send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const { id } = organizationIdParamsSchema.parse(request.params);
      const organization = await this.service.getOrganizationById(tenantId, id);

      return reply.send({
        success: true,
        data: organization,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const body = createOrganizationBodySchema.parse(request.body);
      const organization = await this.service.createOrganization(tenantId, body);

      return reply.status(201).send({
        success: true,
        message: 'Organization created successfully',
        data: organization,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const { id } = organizationIdParamsSchema.parse(request.params);
      const body = updateOrganizationBodySchema.parse(request.body);
      const organization = await this.service.updateOrganization(
        tenantId,
        id,
        body,
      );

      return reply.send({
        success: true,
        message: 'Organization updated successfully',
        data: organization,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  softDelete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (hasFastifyValidationError(request)) {
        return sendValidationError(reply);
      }

      const tenantId = getTenantId(request);
      const { id } = organizationIdParamsSchema.parse(request.params);

      await this.service.softDeleteOrganization(tenantId, id);

      return reply.send({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}

export const organizationController = new OrganizationController();
