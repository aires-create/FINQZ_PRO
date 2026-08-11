import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ConflictingSimulationRuntimeEvidenceError,
  InvalidSimulationRuntimeEvidenceError,
} from '../../../modules/simulation/evidence/index.js';
import { mapSimulationRuntimeEvidenceError } from '../../../modules/simulation/evidence/index.js';

describe('simulation runtime evidence error mapper', () => {
  it('mapeia erro de validação para o envelope global', () => {
    const parsed = z.object({
      name: z.string().min(2),
    }).safeParse({ name: '' });

    expect(parsed.success).toBe(false);

    const result = mapSimulationRuntimeEvidenceError(parsed.error, 'req-1');

    expect(result.statusCode).toBe(400);
    expect(result.payload).toMatchObject({
      success: false,
      requestId: 'req-1',
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
    });
  });

  it('mapeia InvalidSimulationRuntimeEvidenceError para 400', () => {
    const result = mapSimulationRuntimeEvidenceError(
      new InvalidSimulationRuntimeEvidenceError('Invalid evidence'),
      'req-1',
    );

    expect(result.statusCode).toBe(400);
    expect(result.payload).toMatchObject({
      success: false,
      requestId: 'req-1',
      message: 'Invalid evidence',
      code: 'BAD_REQUEST',
    });
  });

  it('mapeia ConflictingSimulationRuntimeEvidenceError para 409', () => {
    const result = mapSimulationRuntimeEvidenceError(
      new ConflictingSimulationRuntimeEvidenceError(
        'sim-runtime-evidence-00000001',
        'SDC-3.4H-HOMOLOGATION-2026-07',
      ),
      'req-1',
    );

    expect(result.statusCode).toBe(409);
    expect(result.payload).toMatchObject({
      success: false,
      requestId: 'req-1',
      code: 'CONFLICT',
    });
  });
});
