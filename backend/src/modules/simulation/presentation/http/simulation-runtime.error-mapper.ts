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
import type { SimulationRuntimeHttpErrorContract } from './simulation-runtime.http.contract.js';

type SimulationRuntimeErrorResponse = {
  statusCode: number;
  payload: {
    success: false;
    error: SimulationRuntimeHttpErrorContract;
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

const getDetails = (error: unknown): Record<string, unknown> | null | undefined => {
  if (error instanceof UnsupportedProductError) {
    return {
      productId: error.productId,
      productCode: error.productCode,
    };
  }

  if (error instanceof UnsupportedSubproductError) {
    return {
      subproductId: error.subproductId,
      subproductCode: error.subproductCode,
    };
  }

  if (error instanceof InvalidCollateralError) {
    return {
      collateralKind: error.collateralKind,
    };
  }

  if (error instanceof InvalidSimulationRequestError) {
    return null;
  }

  if (error instanceof LegacyExecutionError) {
    return null;
  }

  if (error instanceof AppError) {
    return (error.details as Record<string, unknown> | null | undefined) ?? null;
  }

  return null;
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

export const mapSimulationRuntimeError = (
  error: unknown,
): SimulationRuntimeErrorResponse => {
  const statusCode = getStatusCode(error);
  const details: Record<string, unknown> | null | undefined = isZodError(error)
    ? (error.flatten() as unknown as Record<string, unknown>)
    : getDetails(error);

  const payload: SimulationRuntimeErrorResponse['payload'] = {
    success: false,
    error: {
      code: getCode(error),
      message: getMessage(error),
      statusCode,
      ...(details !== null && details !== undefined ? { details } : {}),
    },
  };

  return {
    statusCode,
    payload,
  };
};

export const sendSimulationRuntimeError = (
  error: unknown,
  reply: FastifyReply,
): FastifyReply => {
  const mapped = mapSimulationRuntimeError(error);

  if (mapped.statusCode >= 500) {
    logger.error('Simulation runtime controller error', { error });
  }

  return reply.status(mapped.statusCode).send(mapped.payload);
};
