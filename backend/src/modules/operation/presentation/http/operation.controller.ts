import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';
import { z } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import {
  CreateOperationBodySchema,
  OperationIdParamsSchema,
  OperationListQuerySchema,
} from '../../validators/operation.schema.js';
import type {
  CreateOperationHandlerContract,
  GetOperationByIdHandlerContract,
  GetOperationByNumberHandlerContract,
  ListOperationsHandlerContract,
  OperationExecutionContext,
} from '../../orchestration/operation.handlers.contract.js';
import {
  createOperationHandler,
  getOperationByIdHandler,
  getOperationByNumberHandler,
  listOperationsHandler,
} from '../../orchestration/operation.handlers.js';

const operationNumberParamsSchema = z
  .object({
    operationNumber: z.string().trim().min(1),
  })
  .strict();

const createOperationHttpBodySchema = CreateOperationBodySchema.omit({
  tenantId: true,
});

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

const getActorId = (request: FastifyRequest) => {
  const actorId = request.currentUser?.userId;

  if (!actorId) {
    throw new AppError({
      message: 'Missing user context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return actorId;
};

const getExecutionContext = (request: FastifyRequest): OperationExecutionContext => ({
  tenantId: getTenantId(request),
  actorId: getActorId(request),
  requestId: request.requestId ?? request.id,
  correlationId: request.correlationId ?? request.requestId ?? request.id,
  idempotencyKey: typeof request.headers['idempotency-key'] === 'string'
    ? request.headers['idempotency-key']
    : typeof request.headers['x-idempotency-key'] === 'string'
      ? request.headers['x-idempotency-key']
      : null,
});

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

  logger.error('Operation controller error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export class OperationController {
  constructor(
    private readonly createHandler: CreateOperationHandlerContract = createOperationHandler,
    private readonly getByIdHandler: GetOperationByIdHandlerContract = getOperationByIdHandler,
    private readonly getByNumberHandler: GetOperationByNumberHandlerContract = getOperationByNumberHandler,
    private readonly listHandler: ListOperationsHandlerContract = listOperationsHandler,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = createOperationHttpBodySchema.parse(request.body);
      const tenantId = getTenantId(request);
      const referenceDate =
        body.referenceDate instanceof Date
          ? body.referenceDate.toISOString()
          : body.referenceDate;
      const command = {
        tenantId,
        opportunityId: body.opportunityId,
        createdById: body.createdById,
        amount: body.amount,
        currency: body.currency,
        ...(body.bankProposalId !== undefined ? { bankProposalId: body.bankProposalId } : {}),
        ...(referenceDate !== undefined ? { referenceDate } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.correlationId !== undefined ? { correlationId: body.correlationId } : {}),
      };
      const result = await this.createHandler.handle(command, getExecutionContext(request));

      return reply.status(201).send({
        success: true,
        message: 'Operation created successfully',
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = OperationListQuerySchema.parse(request.query);
      const listQuery = {
        tenantId,
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.opportunityId !== undefined ? { opportunityId: query.opportunityId } : {}),
        ...(query.bankProposalId !== undefined ? { bankProposalId: query.bankProposalId } : {}),
        ...(query.createdById !== undefined ? { createdById: query.createdById } : {}),
        ...(query.search !== undefined ? { search: query.search } : {}),
      };
      const result = await this.listHandler.handle(listQuery, getExecutionContext(request));

      return reply.send({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const params = OperationIdParamsSchema.parse(request.params);
      const tenantId = getTenantId(request);
      const result = await this.getByIdHandler.handle(
        {
          operationId: params.id,
          tenantId,
        },
        getExecutionContext(request),
      );

      if (!result) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Operation not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };

  getByNumber = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { operationNumber } = operationNumberParamsSchema.parse(request.params);
      const result = await this.getByNumberHandler.handle(
        {
          tenantId: getTenantId(request),
          operationNumber,
        },
        getExecutionContext(request),
      );

      if (!result) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Operation not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleControllerError(error, reply);
    }
  };
}

export const operationController = new OperationController();
