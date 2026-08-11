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
    requestId: string;
    message: string;
    code?: string;
    errors?: string[];
  };
};

const isZodError = (error: unknown): error is ZodError =>
  error instanceof ZodError;

const getAppErrorCode = (error: AppError): string => error.code;

const getErrors = (error: unknown): string[] | undefined => {
  if (!isZodError(error)) {
    return undefined;
  }

  const issues = error.issues;

  if (issues.every((item) => typeof item.message === 'string')) {
    return issues.map((item) => item.message);
  }

  return undefined;
};

const mapError = (
  error: unknown,
  requestId: string,
): SimulationRuntimeEvidenceErrorResponse => {
  if (isZodError(error)) {
    const errors = getErrors(error);

    return {
      statusCode: 400,
      payload: {
        success: false,
        requestId,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        ...(errors ? { errors } : {}),
      },
    };
  }

  if (error instanceof InvalidSimulationRuntimeEvidenceError) {
    return {
      statusCode: 400,
      payload: {
        success: false,
        requestId,
        message: error.message,
        code: 'BAD_REQUEST',
      },
    };
  }

  if (error instanceof ConflictingSimulationRuntimeEvidenceError) {
    return {
      statusCode: 409,
      payload: {
        success: false,
        requestId,
        message: error.message,
        code: 'CONFLICT',
      },
    };
  }

  if (error instanceof AppError) {
    const code = getAppErrorCode(error);

    return {
      statusCode: error.statusCode,
      payload: {
        success: false,
        requestId,
        message: error.message,
        code,
      },
    };
  }

  return {
    statusCode: 500,
    payload: {
      success: false,
      requestId,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };
};

export const sendSimulationRuntimeEvidenceError = (
  error: unknown,
  reply: FastifyReply,
): FastifyReply => {
  const requestId = reply.request.requestId ?? reply.request.id;
  const mapped = mapError(error, requestId);

  if (mapped.statusCode >= 500) {
    logger.error('Simulation runtime evidence controller error', {
      error: error instanceof Error ? error.message : 'unknown_error',
      errorName: error instanceof Error ? error.name : undefined,
    });
  }

  return reply.status(mapped.statusCode).send({
    ...mapped.payload,
  });
};

export { mapError as mapSimulationRuntimeEvidenceError };
