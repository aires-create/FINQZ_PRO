import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { AppError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger.js';
import type {
  CommercialTableFiltersDto,
  CreateCommercialTableDto,
  ReplaceCommercialConditionsDto,
  UpdateCommercialTableDto,
} from './dto/commercial-table.dto.js';
import { commercialService } from './services/commercial.service.js';
import {
  commercialTableFiltersSchema,
  createCommercialTableSchema,
  replaceCommercialConditionsSchema,
  updateCommercialTableSchema,
} from './validators/commercial.validator.js';

type TableParams = {
  id: string;
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

const isZodError = (error: unknown): error is ZodError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'flatten' in error &&
    typeof (error as ZodError).flatten === 'function'
  );
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

  logger.error('Commercial route error', { error });

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

const stripUndefinedValues = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
};

export async function commercialRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get('/tables', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const filters = stripUndefinedValues(
        commercialTableFiltersSchema.parse(request.query),
      ) as CommercialTableFiltersDto;
      const tables = await commercialService.listTables(tenantId, filters);

      return reply.send({
        success: true,
        data: tables,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: TableParams }>('/tables/:id', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      const table = await commercialService.getTableDetails(
        tenantId,
        request.params.id,
      );

      return reply.send({
        success: true,
        data: table,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: CreateCommercialTableDto }>(
    '/tables',
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const body = createCommercialTableSchema.parse(
          request.body,
        ) as CreateCommercialTableDto;
        const table = await commercialService.createTable(tenantId, body);

        return reply.status(201).send({
          success: true,
          message: 'Commercial table created successfully',
          data: table,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.patch<{ Params: TableParams; Body: UpdateCommercialTableDto }>(
    '/tables/:id',
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const body = updateCommercialTableSchema.parse(
          request.body,
        ) as UpdateCommercialTableDto;
        const table = await commercialService.updateTable(
          tenantId,
          request.params.id,
          body,
        );

        return reply.send({
          success: true,
          message: 'Commercial table updated successfully',
          data: table,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.delete<{ Params: TableParams }>('/tables/:id', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);
      await commercialService.deleteTable(tenantId, request.params.id);

      return reply.send({
        success: true,
        message: 'Commercial table deleted successfully',
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.put<{ Params: TableParams; Body: ReplaceCommercialConditionsDto }>(
    '/tables/:id/conditions',
    async (request, reply) => {
      try {
        const tenantId = getTenantId(request);
        const body = replaceCommercialConditionsSchema.parse(
          request.body,
        ) as ReplaceCommercialConditionsDto;
        const table = await commercialService.replaceConditions(
          tenantId,
          request.params.id,
          body,
        );

        return reply.send({
          success: true,
          message: 'Commercial table conditions replaced successfully',
          data: table,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );
}
