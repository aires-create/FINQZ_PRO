import { describe, expect, it } from 'vitest';

import {
  simulationRuntimeRequestBodySchema,
  simulationRuntimeRouteInventory,
  simulationRuntimeRouteSchema,
} from '../../../modules/simulation/presentation/http/simulation-runtime.http.schema.js';

const buildPayload = () => ({
  product: {
    id: 'product-1',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
  },
  subproduct: {
    id: 'subproduct-1',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
  },
  customer: {
    role: 'customer',
    name: 'Cliente Teste',
  },
  participants: [],
  guarantees: [],
  parameters: {
    requestedAmount: 100000,
    term: 60,
    monthlyRate: 2.09,
  },
  metadata: {
    compatibilityMode: 'CANONICAL',
    createdAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  versioning: {
    version: '3.2.0',
  },
});

describe('simulation runtime http schema', () => {
  it('aceita o payload canônico do runtime', () => {
    const payload = simulationRuntimeRequestBodySchema.parse(buildPayload());

    expect(payload.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(payload.subproduct.code).toBe('AUTO_EQUITY');
    expect(payload.metadata.compatibilityMode).toBe('CANONICAL');
  });

  it('expõe somente a rota oficial de runtime', () => {
    expect(simulationRuntimeRouteInventory).toEqual([
      {
        method: 'POST',
        path: '/runtime',
        permission: 'simulation:execute',
      },
    ]);
    expect(simulationRuntimeRouteSchema.tags).toContain('Simulation Runtime');
  });
});
