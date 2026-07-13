import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import { ErrorCategory, EventSeverity } from '../../../../shared/telemetry/enums.js';
import {
  MasterCatalogListQuerySchema,
  MasterCatalogProductIdParamsSchema,
  MasterCatalogSubproductIdParamsSchema,
} from '../../validators/master-catalog.http.schema.js';
import {
  createMasterCatalogTelemetryEmitter,
  MasterCatalogEventName,
} from '../../telemetry/index.js';
import type { MasterCatalogServiceContract } from '../../services/master-catalog.service.contract.js';
import { masterCatalogService } from '../../services/master-catalog.service.js';
import { MasterCatalogRuntime } from '../../application/master-catalog.runtime.js';

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

const resolveTelemetryFailure = (error: unknown) => {
  if (isZodError(error)) {
    return {
      errorCategory: ErrorCategory.VALIDATION,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: 'Validation error',
    };
  }

  if (error instanceof AppError) {
    switch (error.code) {
      case 'BAD_REQUEST':
      case 'VALIDATION_ERROR':
        return {
          errorCategory: ErrorCategory.VALIDATION,
          errorCode: error.code,
          errorMessage: error.message,
        };
      case 'UNAUTHORIZED':
        return {
          errorCategory: ErrorCategory.AUTHENTICATION,
          errorCode: error.code,
          errorMessage: error.message,
        };
      case 'FORBIDDEN':
        return {
          errorCategory: ErrorCategory.AUTHORIZATION,
          errorCode: error.code,
          errorMessage: error.message,
        };
      case 'CONFLICT':
      case 'NOT_FOUND':
        return {
          errorCategory: ErrorCategory.CONTRACT,
          errorCode: error.code,
          errorMessage: error.message,
        };
      default:
        return {
          errorCategory: ErrorCategory.UNKNOWN,
          errorCode: error.code,
          errorMessage: error.message,
        };
    }
  }

  if (error instanceof Error) {
    return {
      errorCategory: ErrorCategory.UNKNOWN,
      errorCode: 'INTERNAL_ERROR',
      errorMessage: error.message || 'Internal server error',
    };
  }

  return {
    errorCategory: ErrorCategory.UNKNOWN,
    errorCode: 'INTERNAL_ERROR',
    errorMessage: 'Internal server error',
  };
};

const emitTelemetrySafely = (emit: () => void) => {
  try {
    emit();
  } catch {
    return;
  }
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

  private get runtime() {
    return new MasterCatalogRuntime(this.service);
  }

  private async executeWithTelemetry<T>(
    telemetry: ReturnType<typeof createMasterCatalogTelemetryEmitter>,
    startedAt: number,
    execute: () => Promise<T>,
    mapResult: (value: T) => 'SUCCESS' | 'EMPTY' | 'MATCH' | 'MISMATCH' | 'DEFERRED',
  ): Promise<T> {
    const result = await execute();
    emitTelemetrySafely(() => {
      telemetry.primaryUsed({
        eventName: MasterCatalogEventName.PRIMARY_USED,
        severity: EventSeverity.INFO,
        usageCount: 1,
      });
    });
    emitTelemetrySafely(() => {
      telemetry.requestFinished({
        eventName: MasterCatalogEventName.REQUEST_FINISHED,
        severity: EventSeverity.INFO,
        latencyMs: Math.max(Date.now() - startedAt, 0),
        result: mapResult(result),
      });
    });

    return result;
  }

  getTree = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const telemetry = createMasterCatalogTelemetryEmitter(request, {
      source: 'master-catalog.controller',
    });
    const startedAt = Date.now();

    emitTelemetrySafely(() => {
      telemetry.requestStarted({
        eventName: MasterCatalogEventName.REQUEST_STARTED,
        severity: EventSeverity.INFO,
        operation: 'getTree',
        httpMethod: request.method,
        httpRoute: request.url,
      });
    });

    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.executeWithTelemetry(
        telemetry,
        startedAt,
        () =>
          this.runtime.getCatalogTree({
            tenantId,
            ...(query.status !== undefined ? { status: query.status } : {}),
            ...(query.search !== undefined ? { search: query.search } : {}),
          }),
        () => 'SUCCESS',
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const failure = resolveTelemetryFailure(error);

      emitTelemetrySafely(() => {
        telemetry.requestFailed({
          eventName: MasterCatalogEventName.REQUEST_FAILED,
          severity: EventSeverity.ERROR,
          latencyMs: Math.max(Date.now() - startedAt, 0),
          errorCategory: failure.errorCategory,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
        });
      });

      return handleControllerError(error, reply);
    }
  };

  listSegments = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const telemetry = createMasterCatalogTelemetryEmitter(request, {
      source: 'master-catalog.controller',
    });
    const startedAt = Date.now();

    emitTelemetrySafely(() => {
      telemetry.requestStarted({
        eventName: MasterCatalogEventName.REQUEST_STARTED,
        severity: EventSeverity.INFO,
        operation: 'listSegments',
        httpMethod: request.method,
        httpRoute: request.url,
      });
    });

    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.executeWithTelemetry(
        telemetry,
        startedAt,
        () =>
          this.runtime.listSegments({
            tenantId,
            ...(query.status !== undefined ? { status: query.status } : {}),
            ...(query.search !== undefined ? { search: query.search } : {}),
          }),
        (value) => (value.length > 0 ? 'SUCCESS' : 'EMPTY'),
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const failure = resolveTelemetryFailure(error);

      emitTelemetrySafely(() => {
        telemetry.requestFailed({
          eventName: MasterCatalogEventName.REQUEST_FAILED,
          severity: EventSeverity.ERROR,
          latencyMs: Math.max(Date.now() - startedAt, 0),
          errorCategory: failure.errorCategory,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
        });
      });

      return handleControllerError(error, reply);
    }
  };

  listProducts = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const telemetry = createMasterCatalogTelemetryEmitter(request, {
      source: 'master-catalog.controller',
    });
    const startedAt = Date.now();

    emitTelemetrySafely(() => {
      telemetry.requestStarted({
        eventName: MasterCatalogEventName.REQUEST_STARTED,
        severity: EventSeverity.INFO,
        operation: 'listProducts',
        httpMethod: request.method,
        httpRoute: request.url,
      });
    });

    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const result = await this.executeWithTelemetry(
        telemetry,
        startedAt,
        () =>
          this.runtime.listProducts({
            tenantId,
            ...(query.status !== undefined ? { status: query.status } : {}),
            ...(query.search !== undefined ? { search: query.search } : {}),
          }),
        (value) => (value.length > 0 ? 'SUCCESS' : 'EMPTY'),
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const failure = resolveTelemetryFailure(error);

      emitTelemetrySafely(() => {
        telemetry.requestFailed({
          eventName: MasterCatalogEventName.REQUEST_FAILED,
          severity: EventSeverity.ERROR,
          latencyMs: Math.max(Date.now() - startedAt, 0),
          errorCategory: failure.errorCategory,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
        });
      });

      return handleControllerError(error, reply);
    }
  };

  listSubproductsByProduct = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const telemetry = createMasterCatalogTelemetryEmitter(request, {
      source: 'master-catalog.controller',
    });
    const startedAt = Date.now();

    emitTelemetrySafely(() => {
      telemetry.requestStarted({
        eventName: MasterCatalogEventName.REQUEST_STARTED,
        severity: EventSeverity.INFO,
        operation: 'listSubproductsByProduct',
        httpMethod: request.method,
        httpRoute: request.url,
      });
    });

    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const params = MasterCatalogProductIdParamsSchema.parse(request.params);
      const result = await this.executeWithTelemetry(
        telemetry,
        startedAt,
        () =>
          this.runtime.listSubproductsByProduct({
            tenantId,
            productId: params.productId,
            ...(query.status !== undefined ? { status: query.status } : {}),
            ...(query.search !== undefined ? { search: query.search } : {}),
          }),
        (value) => (value.length > 0 ? 'SUCCESS' : 'EMPTY'),
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const failure = resolveTelemetryFailure(error);

      emitTelemetrySafely(() => {
        telemetry.requestFailed({
          eventName: MasterCatalogEventName.REQUEST_FAILED,
          severity: EventSeverity.ERROR,
          latencyMs: Math.max(Date.now() - startedAt, 0),
          errorCategory: failure.errorCategory,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
        });
      });

      return handleControllerError(error, reply);
    }
  };

  listModalitiesBySubproduct = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const telemetry = createMasterCatalogTelemetryEmitter(request, {
      source: 'master-catalog.controller',
    });
    const startedAt = Date.now();

    emitTelemetrySafely(() => {
      telemetry.requestStarted({
        eventName: MasterCatalogEventName.REQUEST_STARTED,
        severity: EventSeverity.INFO,
        operation: 'listModalitiesBySubproduct',
        httpMethod: request.method,
        httpRoute: request.url,
      });
    });

    try {
      const tenantId = getTenantId(request);
      const query = MasterCatalogListQuerySchema.parse(request.query);
      const params = MasterCatalogSubproductIdParamsSchema.parse(request.params);
      const result = await this.executeWithTelemetry(
        telemetry,
        startedAt,
        () =>
          this.runtime.listModalitiesBySubproduct({
            tenantId,
            subproductId: params.subproductId,
            ...(query.status !== undefined ? { status: query.status } : {}),
            ...(query.search !== undefined ? { search: query.search } : {}),
          }),
        (value) => (value.length > 0 ? 'SUCCESS' : 'EMPTY'),
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const failure = resolveTelemetryFailure(error);

      emitTelemetrySafely(() => {
        telemetry.requestFailed({
          eventName: MasterCatalogEventName.REQUEST_FAILED,
          severity: EventSeverity.ERROR,
          latencyMs: Math.max(Date.now() - startedAt, 0),
          errorCategory: failure.errorCategory,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
        });
      });

      return handleControllerError(error, reply);
    }
  };
}

export const masterCatalogController = new MasterCatalogController();
