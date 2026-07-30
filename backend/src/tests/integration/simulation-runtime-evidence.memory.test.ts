import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { CollectSimulationRuntimeEvidenceUseCase } from '../../modules/simulation/evidence/application/collect-simulation-runtime-evidence.use-case.js';
import { ConflictingSimulationRuntimeEvidenceError } from '../../modules/simulation/evidence/domain/simulation-runtime-evidence.errors.js';
import { InMemorySimulationRuntimeEvidenceRepository } from '../../modules/simulation/evidence/infrastructure/in-memory/simulation-runtime-evidence.in-memory.repository.js';
import type { SimulationRuntimeEvidenceRecord } from '../../modules/simulation/evidence/domain/simulation-runtime-evidence.types.js';

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

describe('Simulation Runtime Evidence memory', () => {
  it('saves runtime evidence through the in-memory use case', async () => {
    const repository = new InMemorySimulationRuntimeEvidenceRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({ repository });

    const record = await useCase.execute(
      buildEvidence({
        tenantId: 'tenant-a',
        evidenceId: 'evidence-a',
        campaignId: 'CAMPAIGN-A',
        correlationId: 'correlation-a',
        requestId: 'request-a',
      }),
      {
        tenantId: 'tenant-a',
        receivedAt: new Date('2026-07-10T12:01:00.000Z'),
        receivedByUserId: 'user-a',
      },
    );

    expect(record).toMatchObject({
      tenantId: 'tenant-a',
      campaignId: 'CAMPAIGN-A',
      evidenceId: 'evidence-a',
      receivedByUserId: 'user-a',
    });
    expect(await repository.findByIdentity('tenant-a', 'CAMPAIGN-A', 'evidence-a')).toMatchObject({
      tenantId: 'tenant-a',
      campaignId: 'CAMPAIGN-A',
      evidenceId: 'evidence-a',
    });
  });

  it('replays identical evidence and rejects conflicting retries', async () => {
    const repository = new InMemorySimulationRuntimeEvidenceRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({ repository });

    const input = buildEvidence({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-retry',
      campaignId: 'CAMPAIGN-RETRY',
      correlationId: 'correlation-retry',
      requestId: 'request-retry',
    });

    const first = await useCase.execute(input, {
      tenantId: 'tenant-a',
      receivedAt: new Date('2026-07-10T12:01:00.000Z'),
      receivedByUserId: null,
    });
    const second = await useCase.execute(input, {
      tenantId: 'tenant-a',
      receivedAt: new Date('2026-07-10T12:01:00.000Z'),
      receivedByUserId: null,
    });

    expect(second).toEqual(first);

    await expect(
      useCase.execute(
        buildEvidence({
          tenantId: 'tenant-a',
          evidenceId: 'evidence-retry',
          campaignId: 'CAMPAIGN-RETRY',
          correlationId: 'correlation-retry-2',
          requestId: 'request-retry-2',
          canonicalStatus: 'rejected',
        }),
        {
          tenantId: 'tenant-a',
          receivedAt: new Date('2026-07-10T12:01:00.000Z'),
          receivedByUserId: null,
        },
      ),
    ).rejects.toBeInstanceOf(ConflictingSimulationRuntimeEvidenceError);
  });

  it('isolates evidence by tenant and campaign', async () => {
    const repository = new InMemorySimulationRuntimeEvidenceRepository();

    await repository.save(buildEvidence({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-a',
      campaignId: 'CAMPAIGN-A',
      correlationId: 'correlation-a',
      requestId: 'request-a',
    }));
    await repository.save(buildEvidence({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-b',
      campaignId: 'CAMPAIGN-B',
      correlationId: 'correlation-b',
      requestId: 'request-b',
    }));
    await repository.save(buildEvidence({
      tenantId: 'tenant-b',
      evidenceId: 'evidence-c',
      campaignId: 'CAMPAIGN-A',
      correlationId: 'correlation-c',
      requestId: 'request-c',
    }));

    expect(await repository.listByCampaign('tenant-a', 'CAMPAIGN-A')).toHaveLength(1);
    expect(await repository.listByCampaign('tenant-a', 'CAMPAIGN-B')).toHaveLength(1);
    expect(await repository.listByCampaign('tenant-b', 'CAMPAIGN-A')).toHaveLength(1);
  });

  it('uses unique ids when replaying through different evidence ids', async () => {
    const repository = new InMemorySimulationRuntimeEvidenceRepository();
    const first = await repository.save(buildEvidence({
      tenantId: 'tenant-a',
      evidenceId: `evidence-${randomUUID()}`,
      campaignId: 'CAMPAIGN-X',
    }));

    const second = await repository.save(buildEvidence({
      tenantId: 'tenant-a',
      evidenceId: `evidence-${randomUUID()}`,
      campaignId: 'CAMPAIGN-X',
    }));

    expect(first.evidenceId).not.toBe(second.evidenceId);
    expect(await repository.listByCampaign('tenant-a', 'CAMPAIGN-X')).toHaveLength(2);
  });
});
