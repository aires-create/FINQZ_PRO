import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticationError, AuthorizationError } from '../../../types/index.js';

const evidenceControllerMock = vi.hoisted(() => ({
  ingest: vi.fn(async (_request: unknown, reply: { status: (code: number) => { send: (payload: unknown) => unknown }; }) => {
    return reply.status(201).send({
      success: true,
      data: {
        evidenceId: 'sim-runtime-evidence-00000001',
        campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
        requestId: 'request-1',
        correlationId: 'correlation-1',
        executionId: 'execution-1',
        productCode: 'LOAN_WITH_COLLATERAL',
        subproductCode: 'AUTO_EQUITY',
        comparisonStatus: 'EQUIVALENT',
        divergenceCategory: 'NONE',
        shadowMode: true,
        timestamp: '2026-07-10T12:00:00.000Z',
        receivedAt: '2026-07-10T12:00:01.000Z',
      },
    });
  }),
}));

const runtimeControllerMock = vi.hoisted(() => ({
  simulationRuntimeController: {
    execute: vi.fn(async (_request: unknown, reply: { send: (payload: unknown) => unknown }) => {
      return reply.send({
        success: true,
        data: {
          executionId: 'exec-1',
          correlationId: 'corr-1',
          tenant: { id: 'tenant-1' },
          product: { id: 'product-1', code: 'PROD', name: 'Produto' },
          subproduct: { id: 'subproduct-1', code: 'SUB', name: 'Subproduto' },
          status: 'CALCULATED',
          decision: { status: 'APPROVED', reasons: [] },
          result: [],
          proposals: [],
          ranking: { candidates: [] },
          warnings: [],
          rejectionReasons: [],
          snapshotReference: { snapshotId: 'snapshot-1', snapshotVersion: '1' },
          auditReference: { auditId: 'audit-1' },
          engineVersion: '3.2.0',
          catalogVersion: '3.1.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          executionTimestamp: '2026-07-09T00:00:00.000Z',
          compatibilityMode: 'CANONICAL',
        },
      });
    }),
  },
}));

vi.mock('../../../core/http/middleware.js', () => ({
  authenticate: async (request: { headers: Record<string, string | undefined>; currentUser?: { userId: string; tenantId: string; permissions: string[] }; currentTenant?: { tenantId: string; userId: string } }) => {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Authentication required');
    }

    if (request.headers.authorization === 'Bearer invalid-token') {
      throw new AuthenticationError('Invalid or expired access token');
    }

    const permissionsHeader = request.headers['x-user-permissions'] ?? '';
    request.currentUser = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: permissionsHeader
        ? permissionsHeader.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
        : [],
    };
  },
  tenantContextMiddleware: async (request: { currentUser?: { userId: string; tenantId: string } & Record<string, unknown>; currentTenant?: { tenantId: string; userId: string } }) => {
    request.currentTenant = {
      tenantId: 'tenant-1',
      userId: request.currentUser?.userId ?? 'user-1',
    };
  },
}));

vi.mock('../../../modules/rbac/rbac.guard.js', () => ({
  requirePermissions: (permission: string | string[]) => {
    const required = Array.isArray(permission) ? permission : [permission];

    return async (request: { currentUser?: { permissions: string[] } }) => {
      const userPermissions = request.currentUser?.permissions ?? [];
      const allowed = required.every((item) => userPermissions.includes(item));

      if (!allowed) {
        throw new AuthorizationError('Insufficient permissions');
      }
    };
  },
}));

vi.mock('../../../modules/simulation/evidence/composition/index.js', () => ({
  createSimulationRuntimeEvidenceComposition: () => ({
    repository: {},
    useCase: {},
    controller: evidenceControllerMock,
  }),
}));

vi.mock('../../../modules/simulation/presentation/http/simulation-runtime.controller.js', () => runtimeControllerMock);

import { simulationRuntimeRoutes } from '../../../modules/simulation/presentation/http/simulation-runtime.routes.js';
import { simulationRuntimeEvidenceRoutes } from '../../../modules/simulation/evidence/index.js';

const buildBody = () => ({
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'LOAN_WITH_COLLATERAL',
  subproductCode: 'AUTO_EQUITY',
  canonicalStatus: 'approved',
  comparisonStatus: 'EQUIVALENT',
  divergenceCategory: 'NONE',
  divergenceCount: 0,
  financialCriticalCount: 0,
  financialMinorCount: 0,
  structuralCount: 0,
  missingCanonicalFieldCount: 0,
  missingLegacyFieldCount: 0,
  mappingFailure: false,
  runtimeFailure: false,
  unsupportedScenario: false,
  legacyDurationMs: null,
  runtimeDurationMs: 120,
  fallbackUsed: false,
  shadowMode: true,
  comparatorVersion: '1.0.0',
  contractVersion: '1.0.0',
  catalogVersion: '1.0.0',
  engineVersion: '1.0.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
});

describe('simulation runtime evidence routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode =
        error instanceof AuthenticationError || error instanceof AuthorizationError
          ? error.statusCode
          : 500;
      reply.status(statusCode).send({
        success: false,
        requestId: _request.requestId ?? _request.id,
        message: error instanceof Error ? error.message : 'Internal server error',
        ...(error instanceof AuthenticationError
          ? { code: 'UNAUTHORIZED' }
          : error instanceof AuthorizationError
            ? { code: 'FORBIDDEN' }
            : {}),
      });
    });

    await app.register(simulationRuntimeRoutes, {
      prefix: '/api/v1/simulations',
    });

    await app.register(simulationRuntimeEvidenceRoutes, {
      prefix: '/api/v1/simulations',
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects evidence ingestion without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      payload: buildBody(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  });

  it('rejects evidence ingestion with invalid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: buildBody(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Invalid or expired access token',
      code: 'UNAUTHORIZED',
    });
  });

  it('rejects evidence ingestion without simulation:evidence:write', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'simulation:execute',
      },
      payload: buildBody(),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Insufficient permissions',
      code: 'FORBIDDEN',
    });
  });

  it('accepts authorized evidence ingestion and keeps /runtime working', async () => {
    const evidenceResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'simulation:evidence:write',
      },
      payload: buildBody(),
    });

    expect(evidenceResponse.statusCode).toBe(201);
    expect(evidenceControllerMock.ingest).toHaveBeenCalledTimes(1);

    const runtimeResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'simulation:execute',
      },
      payload: {
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
      },
    });

    expect(runtimeResponse.statusCode).toBe(200);
    expect(runtimeControllerMock.simulationRuntimeController.execute).toHaveBeenCalledTimes(1);
  });
});
