import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { afterAll, describe, expect, it } from 'vitest';

import { authJwtPlugin } from '../../modules/auth/jwt.plugin.js';
import { simulationRuntimeEvidenceRoutes } from '../../modules/simulation/evidence/index.js';
import { SimulationRuntimeEvidencePrismaRepository } from '../../modules/simulation/evidence/index.js';
import type { SimulationRuntimeEvidenceRecord } from '../../modules/simulation/evidence/index.js';
import { prisma } from '../../database/prisma.js';
import { generateAccessToken } from '../../utils/jwt.js';

const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

const maskDatabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.host || 'unknown-host';
    const database = url.pathname.replace(/^\//, '') || 'unknown-db';

    return `${url.protocol}//${host}/${database}`;
  } catch {
    return 'invalid-database-url';
  }
};

if (databaseUrl) {
  console.info(`[Simulation Runtime Evidence HTTP integration] DATABASE_URL=${maskDatabaseUrl(databaseUrl)}`);
}

const canRunRealSuite = Boolean(databaseUrl);
const suite = canRunRealSuite ? describe : describe.skip;

const buildBody = (
  overrides: Partial<SimulationRuntimeEvidenceRecord> = {},
): Record<string, unknown> => ({
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  tenantIdHash: 'tenant-hash-0001',
  opportunityIdHash: 'opportunity-hash-0001',
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'LOAN_WITH_COLLATERAL',
  subproductCode: 'AUTO_EQUITY',
  legacyStatus: 'approved',
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
  ...overrides,
});

const createTenantUser = async (label: string) => {
  const tenant = await prisma.tenant.create({
    data: {
      id: randomUUID(),
      name: `Simulation Runtime Evidence HTTP ${label}`,
      domain: null,
    },
  });

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      email: `${label}-${tenant.id}@finqz-pro.test`,
      emailNormalized: `${label}-${tenant.id}@finqz-pro.test`.toLowerCase(),
      password: 'Test123!@#',
      firstName: 'HTTP',
      lastName: 'Tester',
      isActive: true,
      isEmailVerified: true,
    },
  });

  return {
    tenant,
    user,
  };
};

const deleteTenant = async (tenantId: string) => {
  await prisma.tenant.delete({
    where: { id: tenantId },
  });
};

const createApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: (error as { code?: string }).code ?? 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode,
        ...(error instanceof Error && 'details' in error && (error as { details?: unknown }).details !== undefined
          ? { details: (error as { details?: Record<string, unknown> | null }).details }
          : {}),
      },
    });
  });

  await app.register(authJwtPlugin);
  await app.register(simulationRuntimeEvidenceRoutes, {
    prefix: '/api/v1/simulations',
  });

  await app.ready();
  return app;
};

suite('Simulation Runtime Evidence HTTP integration', () => {
  let app: FastifyInstance | undefined;

  afterAll(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }

    if (canRunRealSuite) {
      await prisma.$disconnect();
    }
  });

  it('enforces auth, permissions, persistence, isolation and idempotency', async () => {
    const tenantA = await createTenantUser('tenant-a');
    const tenantB = await createTenantUser('tenant-b');

    try {
      app = await createApp();

      const repository = new SimulationRuntimeEvidencePrismaRepository();
      const tokenAWrite = generateAccessToken({
        userId: tenantA.user.id,
        tenantId: tenantA.tenant.id,
        permissions: ['simulation:evidence:write'],
      });
      const tokenANoWrite = generateAccessToken({
        userId: tenantA.user.id,
        tenantId: tenantA.tenant.id,
        permissions: ['simulation:execute'],
      });
      const tokenBWrite = generateAccessToken({
        userId: tenantB.user.id,
        tenantId: tenantB.tenant.id,
        permissions: ['simulation:evidence:write'],
      });

      const unauthorizedResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        payload: buildBody(),
      });

      expect(unauthorizedResponse.statusCode).toBe(401);

      const forbiddenResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        headers: {
          authorization: `Bearer ${tokenANoWrite}`,
        },
        payload: buildBody(),
      });

      expect(forbiddenResponse.statusCode).toBe(403);

      const createdResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        headers: {
          authorization: `Bearer ${tokenAWrite}`,
        },
        payload: buildBody({
          evidenceId: 'sim-runtime-evidence-00000001',
          campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
        }),
      });

      expect(createdResponse.statusCode).toBe(201);
      expect(createdResponse.json()).toMatchObject({
        success: true,
        data: {
          evidenceId: 'sim-runtime-evidence-00000001',
          campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
        },
      });

      const replayResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        headers: {
          authorization: `Bearer ${tokenAWrite}`,
        },
        payload: buildBody(),
      });

      expect(replayResponse.statusCode).toBe(200);

      const conflictResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        headers: {
          authorization: `Bearer ${tokenAWrite}`,
        },
        payload: buildBody({
          canonicalStatus: 'rejected',
        }),
      });

      expect(conflictResponse.statusCode).toBe(409);

      const tenantIsolationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/simulations/runtime-evidence',
        headers: {
          authorization: `Bearer ${tokenBWrite}`,
        },
        payload: buildBody(),
      });

      expect(tenantIsolationResponse.statusCode).toBe(201);

      const crossTenantAttempt = await app.inject({
        method: 'POST',
        url: `/api/v1/simulations/runtime-evidence?tenantId=${tenantB.tenant.id}`,
        headers: {
          authorization: `Bearer ${tokenAWrite}`,
        },
        payload: buildBody({
          evidenceId: 'sim-runtime-evidence-cross',
        }),
      });

      expect(crossTenantAttempt.statusCode).toBe(403);

      expect(
        await repository.listByCampaign(tenantA.tenant.id, 'SDC-3.4H-HOMOLOGATION-2026-07'),
      ).toHaveLength(1);
      expect(
        await repository.listByCampaign(tenantB.tenant.id, 'SDC-3.4H-HOMOLOGATION-2026-07'),
      ).toHaveLength(1);
    } finally {
      await deleteTenant(tenantB.tenant.id);
      await deleteTenant(tenantA.tenant.id);
    }
  });
});
