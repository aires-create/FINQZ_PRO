import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import {
  MasterCatalogListQuerySchema,
  MasterCatalogProductIdParamsSchema,
  MasterCatalogSubproductIdParamsSchema,
} from '../../validators/master-catalog.http.schema.js';
import type { MasterCatalogServiceContract } from '../../services/master-catalog.service.contract.js';
import { masterCatalogService } from '../../services/master-catalog.service.js';

const isZodError = (error: unknown): error is ZodError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'flatten' in error &&
    typeof (error as ZodError).flatten === 'function'
  );
};

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

const handleControllerError = (error: unknown, reply: FastifyReply) => {
  if (isZodError(error)) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: error.flatten(),
      },
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
  }

  logger.error('MasterCatalog controller error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export class MasterCatalogController {
  constructor(
    private readonly service: MasterCatalogServiceContract = masterCatalogService,
  ) {}

  getTree = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.service.getCatalogTree({
        tenantId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  listSegments = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.service.listSegments({
        tenantId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  listProducts = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.service.listProducts({
        tenantId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  listSubproductsByProduct = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const params = MasterCatalogProductIdParamsSchema.parse(request.params);
      const result = await this.service.listSubproductsByProduct({
        tenantId,
        productId: params.productId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  listModalitiesBySubproduct = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const params = MasterCatalogSubproductIdParamsSchema.parse(request.params);
      const result = await this.service.listModalitiesBySubproduct({
        tenantId,
        subproductId: params.subproductId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}

export const masterCatalogController = new MasterCatalogController();
