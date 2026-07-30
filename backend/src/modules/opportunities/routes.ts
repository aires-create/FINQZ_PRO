import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger.js';
import { requirePermissions } from '../rbac/rbac.guard.js';
import {
  type CreateOpportunityInput,
  InvalidCustomerError,
  InvalidLeadError,
  InvalidPipelineError,
  InvalidStageError,
  type OpportunityAccessScope,
  type MoveOpportunityStageInput,
  OpportunityNotFoundError,
  opportunitiesService,
  TenantScopeViolationError,
  type UpdateOpportunityInput,
} from './services/opportunities.service.js';
import {
  createOpportunityIntakeBodySchema,
  createOpportunityBodySchema,
  listOpportunitiesQuerySchema,
  moveOpportunityStageBodySchema,
  updateOpportunityBodySchema,
} from './validators/opportunities.validator.js';

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
    throw new TenantScopeViolationError('tenant', 'missing');
  }

  return tenantId;
};

const getActorId = (request: FastifyRequest) => {
  return request.currentUser?.userId ?? request.currentTenant?.userId ?? null;
};

const getOpportunityScope = (request: FastifyRequest): OpportunityAccessScope => {
  const currentTenant = request.currentTenant;

  if (!currentTenant) {
    throw new TenantScopeViolationError('tenant', 'missing');
  }

  return currentTenant;
};

const withDefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as {
    [K in keyof T as undefined extends T[K] ? never : K]: Exclude<T[K], undefined>;
  } & {
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
  };
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
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

  if (error instanceof OpportunityNotFoundError) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    });
  }

  if (
    error instanceof InvalidPipelineError ||
    error instanceof InvalidStageError ||
    error instanceof InvalidCustomerError ||
    error instanceof InvalidLeadError
  ) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
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

  logger.error('Opportunities route error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

export async function opportunitiesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get(
    '/',
    { preHandler: [requirePermissions('opportunity:read')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const query = listOpportunitiesQuerySchema.parse(request.query);
        const scope = getOpportunityScope(request);
        const params = withDefined({
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          search: query.search,
          status: query.status,
          pipelineId: query.pipelineId,
          stageId: query.stageId,
          customerId: query.customerId,
          ownerId: query.ownerId,
        });
        const result = await opportunitiesService.list(tenantId, params, scope);

        return reply.send({
          success: true,
          data: result.data,
          total: result.total,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.get(
    '/:id',
    { preHandler: [requirePermissions('opportunity:read')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const scope = getOpportunityScope(request);
        const { id } = request.params as { id: string };
        const data = await opportunitiesService.getById(tenantId, id, scope);

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
    '/intake',
    { preHandler: [requirePermissions('opportunity:create')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const userId = getActorId(request);

        if (!userId) {
          throw new TenantScopeViolationError('user', 'missing');
        }

        const parsedBody = createOpportunityIntakeBodySchema.parse(request.body);
        const body = {
          opportunity: withDefined({
            title: parsedBody.opportunity.title,
            amount: parsedBody.opportunity.amount,
            pipelineId: parsedBody.opportunity.pipelineId,
            stageId: parsedBody.opportunity.stageId,
            productId: parsedBody.opportunity.productId,
            subproductId: parsedBody.opportunity.subproductId,
            modalityId: parsedBody.opportunity.modalityId,
            ownerId: parsedBody.opportunity.ownerId,
            description: parsedBody.opportunity.description,
            probability: parsedBody.opportunity.probability,
            currency: parsedBody.opportunity.currency,
            expectedCloseDate: parsedBody.opportunity.expectedCloseDate,
          }),
          customer: withDefined({
            id: parsedBody.customer.id,
            cpfCnpj: parsedBody.customer.cpfCnpj,
            email: parsedBody.customer.email,
            firstName: parsedBody.customer.firstName,
            lastName: parsedBody.customer.lastName,
            phone: parsedBody.customer.phone,
            birthDate: parsedBody.customer.birthDate,
            documentType: parsedBody.customer.documentType,
            address: parsedBody.customer.address,
            bankData: parsedBody.customer.bankData,
            profession: parsedBody.customer.profession,
            maritalStatus: parsedBody.customer.maritalStatus,
            gender: parsedBody.customer.gender,
            notes: parsedBody.customer.notes,
          }),
          ...(parsedBody.options
            ? {
                options: withDefined({
                  updateExistingCustomer: parsedBody.options.updateExistingCustomer,
                  allowCreateCustomer: parsedBody.options.allowCreateCustomer,
                }),
              }
            : {}),
        };
        const data = await opportunitiesService.createOpportunityIntake(
          tenantId,
          userId,
          body,
        );

        return reply.status(201).send({
          success: true,
          message: 'Opportunity intake created successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.post(
    '/',
    { preHandler: [requirePermissions('opportunity:create')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorId = getActorId(request);
        const scope = getOpportunityScope(request);
        const body = createOpportunityBodySchema.parse(request.body);
        const input: CreateOpportunityInput = withDefined({
          tenantId,
          actorId,
          title: body.title,
          amount: body.amount,
          pipelineId: body.pipelineId,
          stageId: body.stageId,
          productId: body.productId,
          subproductId: body.subproductId,
          modalityId: body.modalityId,
          customerId: body.customerId,
          leadId: body.leadId,
          ownerId: body.ownerId,
          description: body.description,
          probability: body.probability,
          currency: body.currency,
          expectedCloseDate: body.expectedCloseDate,
        });
        const data = await opportunitiesService.create(input, scope);

        return reply.status(201).send({
          success: true,
          message: 'Opportunity created successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.put(
    '/:id',
    { preHandler: [requirePermissions('opportunity:update')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorId = getActorId(request);
        const scope = getOpportunityScope(request);
        const { id } = request.params as { id: string };
        const body = updateOpportunityBodySchema.parse(request.body);
        const input: UpdateOpportunityInput = withDefined({
          tenantId,
          actorId,
          opportunityId: id,
          title: body.title,
          description: body.description,
          amount: body.amount,
          probability: body.probability,
          status: body.status,
          expectedCloseDate: body.expectedCloseDate,
          ownerId: body.ownerId,
          customerId: body.customerId,
          leadId: body.leadId,
          productId: body.productId,
          subproductId: body.subproductId,
          modalityId: body.modalityId,
        });
        const data = await opportunitiesService.update(input, scope);

        return reply.send({
          success: true,
          message: 'Opportunity updated successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.patch(
    '/:id/stage',
    { preHandler: [requirePermissions('opportunity:move_stage')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorId = getActorId(request);
        const scope = getOpportunityScope(request);
        const { id } = request.params as { id: string };
        const body = moveOpportunityStageBodySchema.parse(request.body);
        const input: MoveOpportunityStageInput = withDefined({
          tenantId,
          actorId,
          opportunityId: id,
          stageId: body.stageId,
          pipelineId: body.pipelineId,
        });
        const data = await opportunitiesService.moveStage(input, scope);

        return reply.send({
          success: true,
          message: 'Opportunity stage moved successfully',
          data,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.delete(
    '/:id',
    { preHandler: [requirePermissions('opportunity:delete')] },
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const actorId = getActorId(request);
        const scope = getOpportunityScope(request);
        const { id } = request.params as { id: string };
        await opportunitiesService.archive({
          tenantId,
          actorId,
          opportunityId: id,
        }, scope);

        return reply.send({
          success: true,
          message: 'Opportunity archived successfully',
          data: { id },
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );
}

export default opportunitiesRoutes;
