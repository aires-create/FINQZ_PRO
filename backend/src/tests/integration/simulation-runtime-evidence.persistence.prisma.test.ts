import { randomUUID } from 'node:crypto';

import { PrismaClient, Prisma } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { ConflictingSimulationRuntimeEvidenceError } from '../../modules/simulation/evidence/index.js';
import { SimulationRuntimeEvidencePrismaRepository } from '../../modules/simulation/evidence/index.js';
import type { SimulationRuntimeEvidenceRecord } from '../../modules/simulation/evidence/index.js';

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
  console.info(`[Simulation Runtime Evidence persistence runtime against Prisma/PostgreSQL] DATABASE_URL=${maskDatabaseUrl(databaseUrl)}`);
}

const canRunRealSuite = Boolean(databaseUrl);
const prisma = canRunRealSuite
  ? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  : null;

if (canRunRealSuite) {
  await prisma!.$connect();
}

const suite = canRunRealSuite ? describe : describe.skip;

const requiredTable = 'simulation_runtime_evidence';

const createTenant = async (suffix: string) =>
  prisma!.tenant.create({
    data: {
      id: randomUUID(),
      name: `Simulation Runtime Evidence Prisma Test ${suffix}`,
      domain: null,
    },
  });

const deleteTenant = async (tenantId: string) => {
  await prisma!.tenant.delete({
    where: { id: tenantId },
  });
};

const buildEvidence = (
  overrides: Partial<SimulationRuntimeEvidenceRecord> = {},
): SimulationRuntimeEvidenceRecord => ({
  tenantId: 'tenant-a',
  evidenceId: 'evidence-1',
  campaignId: 'campaign-1',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  tenantIdHash: 'tenant-hash',
  opportunityIdHash: 'opportunity-hash',
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'PRODUCT-1',
  subproductCode: 'SUB-1',
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
  receivedByUserId: null,
  receivedAt: new Date('2026-07-10T12:00:01.000Z'),
  ...overrides,
});

suite('Simulation Runtime Evidence persistence runtime against Prisma/PostgreSQL', () => {
  afterAll(async () => {
    if (canRunRealSuite) {
      await prisma!.$disconnect();
    }
  });

  it('confirms the migration created the expected table', async () => {
    const rows = await prisma!.$queryRaw<Array<{ regclass: string | null }>>(
      Prisma.sql`select to_regclass(${`public.${requiredTable}`})::text as regclass`,
    );

    expect(rows[0]?.regclass).toBe(requiredTable);
  });

  it('persists and isolates sanitized runtime evidence by tenant and campaign', async () => {
    const tenantA = await createTenant('tenant-a');
    const tenantB = await createTenant('tenant-b');

    try {
      const repository = new SimulationRuntimeEvidencePrismaRepository(prisma!);
      const evidenceA = buildEvidence({
        tenantId: tenantA.id,
        evidenceId: 'evidence-a',
        campaignId: 'campaign-a',
        correlationId: 'correlation-a',
        requestId: 'request-a',
      });
      const evidenceASecondCampaign = buildEvidence({
        tenantId: tenantA.id,
        evidenceId: 'evidence-campaign-b',
        campaignId: 'campaign-b',
        correlationId: 'correlation-campaign-b',
        requestId: 'request-campaign-b',
      });
      const evidenceB = buildEvidence({
        tenantId: tenantB.id,
        evidenceId: 'evidence-b',
        campaignId: 'campaign-a',
        correlationId: 'correlation-b',
        requestId: 'request-b',
      });

      const savedA = await repository.save(evidenceA);
      await repository.save(evidenceASecondCampaign);
      const savedB = await repository.save(evidenceB);

      expect(savedA.tenantId).toBe(tenantA.id);
      expect(savedB.tenantId).toBe(tenantB.id);
      expect(await repository.findByIdentity(tenantA.id, 'campaign-a', 'evidence-a')).toMatchObject({
        tenantId: tenantA.id,
        campaignId: 'campaign-a',
        evidenceId: 'evidence-a',
      });
      expect(await repository.listByCampaign(tenantA.id, 'campaign-a')).toHaveLength(1);
      expect(await repository.listByCampaign(tenantA.id, 'campaign-b')).toHaveLength(1);
      expect(await repository.listByCampaign(tenantB.id, 'campaign-a')).toHaveLength(1);
    } finally {
      await deleteTenant(tenantB.id);
      await deleteTenant(tenantA.id);
    }
  });

  it('replays identical evidence and rejects conflicting retries', async () => {
    const tenant = await createTenant('retry');

    try {
      const repository = new SimulationRuntimeEvidencePrismaRepository(prisma!);
      const input = buildEvidence({
        tenantId: tenant.id,
        evidenceId: 'evidence-retry',
        campaignId: 'campaign-retry',
        correlationId: 'correlation-retry',
        requestId: 'request-retry',
      });

      const first = await repository.save(input);
      const second = await repository.save(input);

      expect(second).toEqual(first);

      await expect(
        repository.save(
          buildEvidence({
            tenantId: tenant.id,
            evidenceId: 'evidence-retry',
            campaignId: 'campaign-retry',
            correlationId: 'correlation-retry-2',
            requestId: 'request-retry-2',
            canonicalStatus: 'rejected',
          }),
        ),
      ).rejects.toBeInstanceOf(ConflictingSimulationRuntimeEvidenceError);
    } finally {
      await deleteTenant(tenant.id);
    }
  });

  it('cascades evidence deletion when the tenant is removed', async () => {
    const tenant = await createTenant('cascade');

    try {
      const repository = new SimulationRuntimeEvidencePrismaRepository(prisma!);
      await repository.save(
        buildEvidence({
          tenantId: tenant.id,
          evidenceId: 'evidence-cascade',
          campaignId: 'campaign-cascade',
          correlationId: 'correlation-cascade',
          requestId: 'request-cascade',
        }),
      );

      await deleteTenant(tenant.id);

      const remaining = await prisma!.simulationRuntimeEvidence.findMany({
        where: {
          tenantId: tenant.id,
        },
      });

      expect(remaining).toHaveLength(0);
    } finally {
      await prisma!.simulationRuntimeEvidence.deleteMany({
        where: {
          tenantId: tenant.id,
        },
      });
    }
  });
});
