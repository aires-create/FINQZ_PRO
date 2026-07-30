import { describe, expect, it } from 'vitest';

import type { SimulationApplicationExecutionResult } from '../../../modules/simulation/application/simulation.application.context.js';
import type { SimulationRequest, SimulationResult } from '../../../modules/simulation/contracts/simulation.contract.js';
import {
  buildSimulationRuntimeOptions,
  buildSimulationRuntimeRequest,
  mapSimulationRuntimeExecutionToHttpResponse,
} from '../../../modules/simulation/presentation/http/simulation-runtime.http.mapper.js';

const buildBody = () => ({
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

const buildRequest = (): SimulationRequest => ({
  tenant: {
    id: 'tenant-1',
  },
  product: {
    id: 'product-1',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
  },
  subproduct: {
    id: 'subproduct-1',
    productId: 'product-1',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
  },
  customer: {
    id: 'customer-1',
    role: 'customer',
    name: 'Cliente Teste',
  },
  participants: [],
  guarantees: [],
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'simulation-runtime-http',
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

const buildResult = (request: SimulationRequest): SimulationResult => ({
  ...request,
  result: [
    {
      key: 'requestedAmount',
      label: 'Valor solicitado',
      value: 100000,
      unit: 'BRL',
    },
  ],
  proposals: [],
  ranking: {
    candidates: [],
  },
  decision: {
    status: 'APPROVED',
    reasons: [],
  },
  rejectionReasons: [],
  alerts: [],
  warnings: [],
  snapshot: {
    snapshotId: 'snap-1',
    snapshotVersion: '1',
  },
  proposalReference: {
    proposalId: 'proposal-1',
  },
  auditReference: {
    auditId: 'audit-1',
  },
  executionId: 'exec-1',
  executionTimestamp: '2026-07-09T00:00:00.000Z',
  engineVersion: '3.2.0',
  catalogVersion: '3.1.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'simulation-runtime-http',
    createdAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  status: 'CALCULATED',
});

describe('simulation runtime http mapper', () => {
  it('hidrata tenant e tracing do request', () => {
    const request = {
      currentTenant: { tenantId: 'tenant-1', userId: 'user-1' },
      currentUser: { userId: 'user-1', tenantId: 'tenant-1' },
      requestId: 'req-1',
      correlationId: 'corr-1',
      id: 'fastify-1',
    } as never;

    const mapped = buildSimulationRuntimeRequest(request, buildBody());

    expect(mapped.tenant.id).toBe('tenant-1');
    expect(mapped.execution?.requestId).toBe('req-1');
    expect(mapped.execution?.correlationId).toBe('corr-1');
    expect(mapped.execution?.performedBy).toBe('user-1');
  });

  it('mapeia a execução oficial para um payload HTTP canônico', () => {
    const request = buildRequest();
    const execution: SimulationApplicationExecutionResult = {
      context: {
        request,
        executionId: 'exec-1',
        correlationId: 'corr-1',
        productAdapter: {} as never,
        result: buildResult(request),
        snapshot: {
          snapshotId: 'snap-1',
          tenantId: 'tenant-1',
          opportunityId: 'opportunity-1',
          simulationId: 'snap-1',
          executionId: 'exec-1',
          correlationId: 'corr-1',
          request,
          result: buildResult(request),
          catalogVersion: '3.1.0',
          engineVersion: '3.2.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          createdAt: '2026-07-09T00:00:00.000Z',
          createdBy: 'user-1',
          source: 'simulation-runtime-http',
          compatibilityMode: 'CANONICAL',
        },
        executionEnvelope: {
          executionId: 'exec-1',
          correlationId: 'corr-1',
          requestHash: 'hash-1',
          request,
          legacyInput: {} as never,
          legacyResult: {} as never,
          canonicalResult: buildResult(request),
          snapshotReference: {
            snapshotId: 'snap-1',
            snapshotVersion: '1',
          },
          auditReference: {
            auditId: 'audit-1',
          },
          engineVersion: '3.2.0',
          catalogVersion: '3.1.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          compatibilityMode: 'CANONICAL',
          executionTimestamp: '2026-07-09T00:00:00.000Z',
        },
      },
      result: buildResult(request),
        snapshot: {
          snapshotId: 'snap-1',
          tenantId: 'tenant-1',
          opportunityId: 'opportunity-1',
          simulationId: 'snap-1',
          executionId: 'exec-1',
          correlationId: 'corr-1',
          request,
          result: buildResult(request),
          catalogVersion: '3.1.0',
          engineVersion: '3.2.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          createdAt: '2026-07-09T00:00:00.000Z',
          createdBy: 'user-1',
          source: 'simulation-runtime-http',
          compatibilityMode: 'CANONICAL',
        },
      executionEnvelope: {
        executionId: 'exec-1',
        correlationId: 'corr-1',
        requestHash: 'hash-1',
        request,
        legacyInput: {} as never,
        legacyResult: {} as never,
        canonicalResult: buildResult(request),
        snapshotReference: {
          snapshotId: 'snap-1',
          snapshotVersion: '1',
        },
        auditReference: {
          auditId: 'audit-1',
        },
        engineVersion: '3.2.0',
        catalogVersion: '3.1.0',
        policyVersion: '1.0.0',
        strategyVersion: '1.0.0',
        compatibilityMode: 'CANONICAL',
        executionTimestamp: '2026-07-09T00:00:00.000Z',
      },
    };

    const response = mapSimulationRuntimeExecutionToHttpResponse(execution, {
      requestId: 'req-1',
      id: 'fastify-1',
    } as never);

    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          executionId: 'exec-1',
          correlationId: 'corr-1',
          tenant: { id: 'tenant-1' },
          product: expect.objectContaining({
            code: 'EMPRESTIMO_COM_GARANTIA',
          }),
          subproduct: expect.objectContaining({
            code: 'AUTO_EQUITY',
          }),
        }),
      }),
    );
    expect(JSON.stringify(response)).not.toContain('legacyInput');
    expect(JSON.stringify(response)).not.toContain('legacyResult');
  });
});
