import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { logger } from '../../../../../shared/logger.js';
import {
  ConflictingSimulationRuntimeEvidenceError,
  InvalidSimulationRuntimeEvidenceError,
} from '../../domain/simulation-runtime-evidence.errors.js';
import type { SimulationRuntimeEvidenceHttpErrorContract } from './simulation-runtime-evidence.http.contract.js';

type SimulationRuntimeEvidenceErrorResponse = {
  statusCode: number;
  payload: {
    success: false;
    error: SimulationRuntimeEvidenceHttpErrorContract;
  };
};

const isZodError = (error: unknown): error is ZodError =>
  error instanceof ZodError;

const getAppErrorCode = (error: AppError): SimulationRuntimeEvidenceHttpErrorContract['code'] =>
  error.code;

const mapError = (error: unknown): SimulationRuntimeEvidenceErrorResponse => {
  if (isZodError(error)) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
          statusCode: 400,
          details: error.flatten(),
        },
      },
    };
  }

  if (error instanceof InvalidSimulationRuntimeEvidenceError) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
          statusCode: 400,
        },
      },
    };
  }

  if (error instanceof ConflictingSimulationRuntimeEvidenceError) {
    return {
      statusCode: 409,
      payload: {
        success: false,
        error: {
          code: 'CONFLICT',
          message: error.message,
          statusCode: 409,
        },
      },
    };
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      payload: {
        success: false,
        error: {
          code: getAppErrorCode(error),
          message: error.message,
          statusCode: error.statusCode,
          ...(error.details !== undefined ? { details: error.details as Record<string, unknown> | null } : {}),
        },
      },
    };
  }

  return {
    statusCode: 500,
    payload: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        statusCode: 500,
      },
    },
  };
};

export const sendSimulationRuntimeEvidenceError = (
  error: unknown,
  reply: FastifyReply,
): FastifyReply => {
  const mapped = mapError(error);

  if (mapped.statusCode >= 500) {
    logger.error('Simulation runtime evidence controller error', {
      error: error instanceof Error ? error.message : 'unknown_error',
      errorName: error instanceof Error ? error.name : undefined,
    });
  }

  return reply.status(mapped.statusCode).send(mapped.payload);
};

export { mapError as mapSimulationRuntimeEvidenceError };
