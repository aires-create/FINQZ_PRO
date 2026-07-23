import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import { ConflictingSimulationRuntimeEvidenceError } from '../../modules/simulation/evidence/domain/simulation-runtime-evidence.errors.js';
import type { SimulationRuntimeEvidenceRecord } from '../../modules/simulation/evidence/domain/simulation-runtime-evidence.types.js';
import { InMemorySimulationRuntimeEvidenceRepository } from '../../modules/simulation/evidence/infrastructure/in-memory/simulation-runtime-evidence.in-memory.repository.js';

const buildEvidence = (
  overrides: Partial<SimulationRuntimeEvidenceRecord> = {},
): SimulationRuntimeEvidenceRecord => ({
  tenantId: 'tenant-a',
  evidenceId: 'evidence-1',
  campaignId: 'CAMPAIGN-1',
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

describe('Simulation Runtime Evidence persistence memory', () => {
  const repository = new InMemorySimulationRuntimeEvidenceRepository();

  afterEach(() => {
    void repository.listByCampaign('tenant-a', 'CAMPAIGN-1');
  });

  it('saves and finds sanitized runtime evidence by tenant and campaign', async () => {
    const tenantA = `tenant-${randomUUID()}`;
    const tenantB = `tenant-${randomUUID()}`;

    const evidenceA = buildEvidence({
      tenantId: tenantA,
      evidenceId: 'evidence-a',
      campaignId: 'CAMPAIGN-A',
      correlationId: 'correlation-a',
      requestId: 'request-a',
    });
    const evidenceB = buildEvidence({
      tenantId: tenantB,
      evidenceId: 'evidence-b',
      campaignId: 'CAMPAIGN-A',
      correlationId: 'correlation-b',
      requestId: 'request-b',
    });

    const savedA = await repository.save(evidenceA);
    const savedB = await repository.save(evidenceB);

    expect(savedA.tenantId).toBe(tenantA);
    expect(savedB.tenantId).toBe(tenantB);
    expect(await repository.findByIdentity(tenantA, 'CAMPAIGN-A', 'evidence-a')).toMatchObject({
      tenantId: tenantA,
      campaignId: 'CAMPAIGN-A',
      evidenceId: 'evidence-a',
    });
    expect(await repository.listByCampaign(tenantA, 'CAMPAIGN-A')).toHaveLength(1);
    expect(await repository.listByCampaign(tenantB, 'CAMPAIGN-A')).toHaveLength(1);
  });

  it('replays identical evidence and rejects conflicting retries', async () => {
    const tenant = `tenant-${randomUUID()}`;
    const input = buildEvidence({
      tenantId: tenant,
      evidenceId: 'evidence-retry',
      campaignId: 'CAMPAIGN-RETRY',
      correlationId: 'correlation-retry',
      requestId: 'request-retry',
    });

    const first = await repository.save(input);
    const second = await repository.save(input);

    expect(second).toEqual(first);

    await expect(
      repository.save(
        buildEvidence({
          tenantId: tenant,
          evidenceId: 'evidence-retry',
          campaignId: 'CAMPAIGN-RETRY',
          correlationId: 'correlation-retry-2',
          requestId: 'request-retry-2',
          canonicalStatus: 'rejected',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictingSimulationRuntimeEvidenceError);
  });

  it('cascades evidence deletion by tenant key prefix in memory', async () => {
    const tenant = `tenant-${randomUUID()}`;

    await repository.save(
      buildEvidence({
        tenantId: tenant,
        evidenceId: 'evidence-cascade',
        campaignId: 'CAMPAIGN-CASCADE',
        correlationId: 'correlation-cascade',
        requestId: 'request-cascade',
      }),
    );

    expect(await repository.listByCampaign(tenant, 'CAMPAIGN-CASCADE')).toHaveLength(1);
  });
});
