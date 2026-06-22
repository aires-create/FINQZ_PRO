import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import {
  PartnerCreateBodySchema,
  PartnerIdParamsSchema,
  PartnerListQuerySchema,
  PartnerUpdateBodySchema,
} from '../../validators/partner.http.schema.js';
import {
  partnerService,
} from '../../services/partner.service.js';
import { PartnerTenantRequiredError } from '../../services/partner.errors.js';
import type { PartnerServiceContract } from '../../services/partner.service.contract.js';

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
    throw new PartnerTenantRequiredError();
  }

  return tenantId;
};

const getActorUserId = (request: FastifyRequest) => {
  const actorUserId = request.currentUser?.userId;

  if (!actorUserId) {
    throw new AppError({
      message: 'Missing user context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return actorUserId;
};

const getCorrelationId = (request: FastifyRequest) => {
  return request.correlationId ?? request.requestId ?? request.id ?? null;
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

  logger.error('Partner controller error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export class PartnerController {
  constructor(private readonly service: PartnerServiceContract = partnerService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = PartnerListQuerySchema.parse(request.query);
      const result = await this.service.listPartners({
        tenantId,
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      });

      const totalPages = result.limit > 0 ? Math.ceil(result.total / result.limit) : 0;

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages,
        },
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const params = PartnerIdParamsSchema.parse(request.params);
      const partner = await this.service.getPartnerById({
        tenantId,
        partnerId: params.id,
      });

      return reply.send({
        success: true,
        data: partner,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const actorUserId = getActorUserId(request);
      const body = PartnerCreateBodySchema.parse(request.body);
      const partner = await this.service.createPartner({
        tenantId,
        actorUserId,
        correlationId: getCorrelationId(request),
        code: body.code,
        name: body.name,
        type: body.type,
        status: body.status,
        ...(body.document !== undefined ? { document: body.document } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      });

      return reply.status(201).send({
        success: true,
        message: 'Partner created successfully',
        data: partner,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const actorUserId = getActorUserId(request);
      const params = PartnerIdParamsSchema.parse(request.params);
      const body = PartnerUpdateBodySchema.parse(request.body);
      const partner = await this.service.updatePartner({
        tenantId,
        actorUserId,
        correlationId: getCorrelationId(request),
        partnerId: params.id,
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.document !== undefined ? { document: body.document } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      });

      return reply.send({
        success: true,
        message: 'Partner updated successfully',
        data: partner,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const actorUserId = getActorUserId(request);
      const params = PartnerIdParamsSchema.parse(request.params);

      await this.service.softDeletePartner({
        tenantId,
        actorUserId,
        correlationId: getCorrelationId(request),
        partnerId: params.id,
      });

      return reply.send({
        success: true,
        message: 'Partner deleted successfully',
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}

export const partnerController = new PartnerController();
