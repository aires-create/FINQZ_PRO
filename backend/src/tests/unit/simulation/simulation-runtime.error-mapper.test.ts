import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  InvalidCollateralError,
  InvalidSimulationRequestError,
  LegacyExecutionError,
  UnsupportedProductError,
  UnsupportedSubproductError,
} from '../../../modules/simulation/application/index.js';
import { mapSimulationRuntimeError } from '../../../modules/simulation/presentation/http/simulation-runtime.error-mapper.js';

describe('simulation runtime error mapper', () => {
  it('mapeia erro de validação para 400 sem stack', () => {
    const parsed = z.object({
      name: z.string().min(2),
    }).safeParse({ name: '' });

    expect(parsed.success).toBe(false);

    const result = mapSimulationRuntimeError(parsed.error);

    expect(result.statusCode).toBe(400);
    expect(result.payload.error.code).toBe('VALIDATION_ERROR');
    expect(result.payload.error.message).toBe('Validation error');
  });

  it('mapeia UnsupportedProductError para 422 com detalhes', () => {
    const result = mapSimulationRuntimeError(new UnsupportedProductError('product-1', 'PROD'));

    expect(result.statusCode).toBe(422);
    expect(result.payload.error.code).toBe('UNSUPPORTED_PRODUCT');
    expect(result.payload.error.details).toMatchObject({
      productId: 'product-1',
      productCode: 'PROD',
    });
  });

  it('mapeia UnsupportedSubproductError para 422', () => {
    const result = mapSimulationRuntimeError(new UnsupportedSubproductError('subproduct-1', 'SUB'));

    expect(result.statusCode).toBe(422);
    expect(result.payload.error.code).toBe('UNSUPPORTED_SUBPRODUCT');
  });

  it('mapeia InvalidCollateralError para 422', () => {
    const result = mapSimulationRuntimeError(new InvalidCollateralError('vehicle'));

    expect(result.statusCode).toBe(422);
    expect(result.payload.error.code).toBe('INVALID_COLLATERAL');
  });

  it('mapeia InvalidSimulationRequestError para 400', () => {
    const result = mapSimulationRuntimeError(new InvalidSimulationRequestError('Invalid request'));

    expect(result.statusCode).toBe(400);
    expect(result.payload.error.code).toBe('INVALID_SIMULATION_REQUEST');
  });

  it('mapeia LegacyExecutionError para 500', () => {
    const result = mapSimulationRuntimeError(new LegacyExecutionError('boom'));

    expect(result.statusCode).toBe(500);
    expect(result.payload.error.code).toBe('LEGACY_EXECUTION_ERROR');
  });
});
