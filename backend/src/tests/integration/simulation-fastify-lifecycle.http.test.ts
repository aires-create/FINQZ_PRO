import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const noopPlugin = vi.hoisted(() => async () => undefined);

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

vi.mock('../../core/http/plugins/rate-limit.plugin.js', () => ({
  enterpriseRateLimitPlugin: noopPlugin,
}));

vi.mock('../../modules/auth/auth.routes.js', () => ({
  default: noopPlugin,
}));

vi.mock('../../modules/crm/routes.js', () => ({
  crmRoutes: noopPlugin,
}));

vi.mock('../../modules/audit/routes.js', () => ({
  auditRoutes: noopPlugin,
}));

vi.mock('../../modules/commercial/index.js', () => ({
  commercialRoutes: noopPlugin,
}));

vi.mock('../../modules/commercial-governance/commercial-governance.module.js', () => ({
  commercialGovernanceRoutes: noopPlugin,
}));

vi.mock('../../modules/integrations/integrations.module.js', () => ({
  integrationsRoutes: noopPlugin,
}));

vi.mock('../../modules/organization/organization.routes.js', () => ({
  organizationRoutes: noopPlugin,
}));

vi.mock('../../modules/memberships/memberships.routes.js', () => ({
  membershipsRoutes: noopPlugin,
}));

vi.mock('../../modules/users/users.routes.js', () => ({
  default: noopPlugin,
}));

vi.mock('../../modules/roles/roles.fastify.routes.js', () => ({
  rolesFastifyRoutes: noopPlugin,
}));

vi.mock('../../modules/permissions/permissions.fastify.routes.js', () => ({
  permissionsFastifyRoutes: noopPlugin,
}));

vi.mock('../../modules/opportunities/routes.js', () => ({
  opportunitiesRoutes: noopPlugin,
}));

vi.mock('../../modules/operation/presentation/http/operation.routes.js', () => ({
  operationRoutes: noopPlugin,
}));

vi.mock('../../modules/master-catalog/presentation/http/master-catalog.routes.js', () => ({
  masterCatalogRoutes: noopPlugin,
}));

vi.mock('../../modules/pipelines/routes.js', () => ({
  pipelinesRoutes: noopPlugin,
}));

vi.mock('../../modules/partners/presentation/http/partner.routes.js', () => ({
  partnerRoutes: noopPlugin,
}));

vi.mock('../../modules/partner-acquisition/http/partner-acquisition.routes.js', () => ({
  partnerAcquisitionRoutes: noopPlugin,
}));

vi.mock('../../modules/edp/presentation/http/edp.routes.js', () => ({
  edpRoutes: noopPlugin,
}));

vi.mock('../../modules/auth/repositories/auth.repository.js', () => ({
  authRepository: {
    findUserForTenantContext: vi.fn(async (userId: string, tenantId: string) => ({
      id: userId,
      tenantId,
      organizationId: null,
      partnerId: null,
      userRoles: [],
    })),
  },
}));

vi.mock('../../modules/simulation/presentation/http/simulation-runtime.controller.js', () => runtimeControllerMock);

vi.mock('../../modules/simulation/evidence/composition/index.js', () => ({
  createSimulationRuntimeEvidenceComposition: () => ({
    repository: {},
    useCase: {},
    controller: evidenceControllerMock,
  }),
}));

import { buildFastifyApp } from '../../core/http/fastify.js';
import { generateAccessToken } from '../../utils/jwt.js';

const buildRuntimePayload = () => ({
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

const buildEvidencePayload = () => ({
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

describe('Simulation Fastify lifecycle integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildFastifyApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('runtime without auth currently reproduces the serialization failure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      payload: buildRuntimePayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime with invalid token returns 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: buildRuntimePayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime without permission returns 403', async () => {
    const token = generateAccessToken({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['opportunity:read'],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: buildRuntimePayload(),
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime authorized keeps success', async () => {
    const token = generateAccessToken({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['simulation:execute'],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: buildRuntimePayload(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        executionId: 'exec-1',
      },
    });
  });

  it('runtime evidence without auth currently reproduces the serialization failure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      payload: buildEvidencePayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime evidence with invalid token returns 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: buildEvidencePayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime evidence without permission returns 403', async () => {
    const token = generateAccessToken({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['simulation:execute'],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: buildEvidencePayload(),
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).not.toContain('FST_ERR_FAILED_ERROR_SERIALIZATION');
  });

  it('runtime evidence authorized keeps success', async () => {
    const token = generateAccessToken({
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['simulation:evidence:write'],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime-evidence',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: buildEvidencePayload(),
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        evidenceId: 'sim-runtime-evidence-00000001',
      },
    });
  });
});
