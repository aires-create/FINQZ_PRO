import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import { AppError } from '../../../../../shared/errors/index.js';
import { logger } from '../../../../../shared/logger.js';
import type { CommercialRequestListFilters } from '../../types/commercial-request.types.js';
import { commercialRequestService } from '../../services/commercial-request.service.js';
import {
  ApproveCommercialRequestUseCase,
  CloseCommercialRequestUseCase,
  CreateCommercialRequestUseCase,
  GetCommercialRequestByIdUseCase,
  ListCommercialRequestsUseCase,
  RejectCommercialRequestUseCase,
  SubmitCommercialRequestUseCase,
} from '../../use-cases/index.js';
import type {
  CommercialRequestIdParamsDto,
  CreateCommercialRequestBodyDto,
  ListCommercialRequestsQueryDto,
} from './commercial-request.schema.js';
import {
  commercialRequestIdParamsSchema,
  createCommercialRequestBodySchema,
  listCommercialRequestsQuerySchema,
} from './commercial-request.schema.js';

const isZodError = (error: unknown): error is ZodError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'flatten' in error &&
    typeof (error as ZodError).flatten === 'function'
  );
};

const sendControllerError = (
  error: unknown,
  reply: FastifyReply,
): void => {
  if (isZodError(error)) {
    reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  logger.error('Commercial request controller error', { error });
  reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

const getTenantId = (request: FastifyRequest): string => {
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

const getCurrentUserId = (request: FastifyRequest): string => {
  const userId = request.currentUser?.userId ?? request.currentTenant?.userId;

  if (!userId) {
    throw new AppError({
      message: 'Missing user context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return userId;
};

const getIdParams = (request: FastifyRequest): CommercialRequestIdParamsDto => {
  return commercialRequestIdParamsSchema.parse(request.params);
};

export class CommercialRequestController {
  constructor(
    private readonly createUseCase = new CreateCommercialRequestUseCase(
      commercialRequestService,
    ),
    private readonly submitUseCase = new SubmitCommercialRequestUseCase(
      commercialRequestService,
    ),
    private readonly approveUseCase = new ApproveCommercialRequestUseCase(
      commercialRequestService,
    ),
    private readonly rejectUseCase = new RejectCommercialRequestUseCase(
      commercialRequestService,
    ),
    private readonly closeUseCase = new CloseCommercialRequestUseCase(
      commercialRequestService,
    ),
    private readonly getByIdUseCase = new GetCommercialRequestByIdUseCase(
      commercialRequestService,
    ),
    private readonly listUseCase = new ListCommercialRequestsUseCase(
      commercialRequestService,
    ),
  ) {}

  create = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const requestedByUserId = getCurrentUserId(request);
      const body = createCommercialRequestBodySchema.parse(
        request.body,
      ) as CreateCommercialRequestBodyDto;

      const result = await this.createUseCase.execute({
        tenantId,
        requestedByUserId,
        reason: body.reason,
        justification: body.justification,
      });

      reply.status(201).send({
        success: true,
        message: 'Commercial request created successfully',
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  list = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = listCommercialRequestsQuerySchema.parse(
        request.query,
      ) as ListCommercialRequestsQueryDto;
      const { page, pageSize } = query;
      const filters: CommercialRequestListFilters = {};

      if (query.status !== undefined) filters.status = query.status;
      if (query.requestedByUserId !== undefined) {
        filters.requestedByUserId = query.requestedByUserId;
      }
      if (query.fromRequestedAt !== undefined) {
        filters.fromRequestedAt = query.fromRequestedAt;
      }
      if (query.toRequestedAt !== undefined) {
        filters.toRequestedAt = query.toRequestedAt;
      }
      if (query.search !== undefined) filters.search = query.search;

      const result = await this.listUseCase.execute({
        tenantId,
        page,
        pageSize,
        filters,
      });

      reply.send({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        },
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  getById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const params = getIdParams(request);
      const result = await this.getByIdUseCase.execute({
        tenantId,
        requestId: params.id,
      });

      if (!result) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Commercial request not found',
          },
        });
        return;
      }

      reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  submit = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.submitUseCase.execute({
        tenantId: getTenantId(request),
        requestId: getIdParams(request).id,
        submittedByUserId: getCurrentUserId(request),
      });

      reply.send({
        success: true,
        message: 'Commercial request submitted successfully',
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  approve = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.approveUseCase.execute({
        tenantId: getTenantId(request),
        requestId: getIdParams(request).id,
        approvedByUserId: getCurrentUserId(request),
      });

      reply.send({
        success: true,
        message: 'Commercial request approved successfully',
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  reject = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.rejectUseCase.execute({
        tenantId: getTenantId(request),
        requestId: getIdParams(request).id,
        rejectedByUserId: getCurrentUserId(request),
      });

      reply.send({
        success: true,
        message: 'Commercial request rejected successfully',
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };

  close = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.closeUseCase.execute({
        tenantId: getTenantId(request),
        requestId: getIdParams(request).id,
        closedByUserId: getCurrentUserId(request),
      });

      reply.send({
        success: true,
        message: 'Commercial request closed successfully',
        data: result,
      });
    } catch (error) {
      sendControllerError(error, reply);
    }
  };
}

export const commercialRequestController = new CommercialRequestController();
