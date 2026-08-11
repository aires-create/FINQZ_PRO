import type { FastifyReply } from 'fastify';
import type { ZodError } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import {
  InvalidCollateralError,
  InvalidSimulationRequestError,
  LegacyExecutionError,
  UnsupportedProductError,
  UnsupportedSubproductError,
} from '../../application/index.js';

type SimulationRuntimeErrorResponse = {
  statusCode: number;
  payload: {
    success: false;
    requestId: string;
    message: string;
    code?: string;
    errors?: string[];
  };
};

const isZodError = (error: unknown): error is ZodError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'flatten' in error &&
    typeof (error as ZodError).flatten === 'function'
  );
};

const getStatusCode = (error: unknown): number => {
  if (isZodError(error) || error instanceof InvalidSimulationRequestError) {
    return 400;
  }

  if (
    error instanceof UnsupportedProductError ||
    error instanceof UnsupportedSubproductError ||
    error instanceof InvalidCollateralError
  ) {
    return 422;
  }

  if (error instanceof LegacyExecutionError) {
    return 500;
  }

  if (error instanceof AppError) {
    return error.statusCode;
  }

  return 500;
};

const getCode = (error: unknown): string => {
  if (isZodError(error)) {
    return 'VALIDATION_ERROR';
  }

  if (error instanceof UnsupportedProductError) {
    return 'UNSUPPORTED_PRODUCT';
  }

  if (error instanceof UnsupportedSubproductError) {
    return 'UNSUPPORTED_SUBPRODUCT';
  }

  if (error instanceof InvalidCollateralError) {
    return 'INVALID_COLLATERAL';
  }

  if (error instanceof InvalidSimulationRequestError) {
    return 'INVALID_SIMULATION_REQUEST';
  }

  if (error instanceof LegacyExecutionError) {
    return 'LEGACY_EXECUTION_ERROR';
  }

  if (error instanceof AppError) {
    return error.code;
  }

  return 'INTERNAL_SERVER_ERROR';
};

const getMessage = (error: unknown): string => {
  if (isZodError(error)) {
    return 'Validation error';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Internal server error';
};

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

export const mapSimulationRuntimeError = (
  error: unknown,
  requestId: string,
): SimulationRuntimeErrorResponse => {
  const statusCode = getStatusCode(error);

  const payload: SimulationRuntimeErrorResponse['payload'] = {
    success: false,
    requestId,
    message: getMessage(error),
    code: getCode(error),
  };

  const errors = getErrors(error);

  if (errors) {
    payload.errors = errors;
  }

  return {
    statusCode,
    payload,
  };
};

export const sendSimulationRuntimeError = (
  error: unknown,
  reply: FastifyReply,
): FastifyReply => {
  const requestId = reply.request.requestId ?? reply.request.id;
  const mapped = mapSimulationRuntimeError(error, requestId);

  if (mapped.statusCode >= 500) {
    logger.error('Simulation runtime controller error', { error });
  }

  return reply.status(mapped.statusCode).send(mapped.payload);
};
