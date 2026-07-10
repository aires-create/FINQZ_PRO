import { describe, expect, it } from 'vitest';

import {
  CollectSimulationRuntimeEvidenceUseCase,
  ConflictingSimulationRuntimeEvidenceError,
  InMemorySimulationRuntimeEvidenceRepository,
  InvalidSimulationRuntimeEvidenceError,
} from '../../../modules/simulation/evidence/index.js';
import type {
  SimulationRuntimeEvidenceContext,
  SimulationRuntimeEvidenceInput,
} from '../../../modules/simulation/evidence/index.js';

const buildInput = (
  overrides: Partial<SimulationRuntimeEvidenceInput> = {},
): SimulationRuntimeEvidenceInput => ({
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  tenantIdHash: 'tenant-hash',
  opportunityIdHash: 'opportunity-hash',
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
  contractVersion: 'COMPATIBILITY',
  catalogVersion: '1.0.0',
  engineVersion: '1.0.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
  ...overrides,
});

const context: SimulationRuntimeEvidenceContext = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  receivedAt: new Date('2026-07-10T12:00:01.000Z'),
  receivedByUserId: '22222222-2222-2222-2222-222222222222',
};

describe('Simulation Runtime Evidence domain', () => {
  it('collects and stores sanitized Shadow Mode evidence', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    const result = await useCase.execute(
      buildInput(),
      context,
    );

    expect(result.tenantId).toBe(context.tenantId);
    expect(result.campaignId).toBe(
      'SDC-3.4H-HOMOLOGATION-2026-07',
    );
    expect(result.shadowMode).toBe(true);
    expect(result.runtimeDurationMs).toBe(120);

    await expect(
      repository.listByCampaign(
        context.tenantId,
        result.campaignId,
      ),
    ).resolves.toHaveLength(1);
  });

  it('returns the existing record for an identical retry', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    const input = buildInput();

    const first = await useCase.execute(input, context);
    const second = await useCase.execute(input, context);

    expect(second).toEqual(first);

    await expect(
      repository.listByCampaign(
        context.tenantId,
        input.campaignId,
      ),
    ).resolves.toHaveLength(1);
  });

  it('rejects a conflicting retry for the same identity', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    const input = buildInput();

    await useCase.execute(input, context);

    await expect(
      useCase.execute(
        buildInput({
          canonicalStatus: 'rejected',
        }),
        context,
      ),
    ).rejects.toBeInstanceOf(
      ConflictingSimulationRuntimeEvidenceError,
    );
  });

  it('rejects evidence that does not originate from Shadow Mode', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    await expect(
      useCase.execute(
        buildInput({
          shadowMode: false,
        }),
        context,
      ),
    ).rejects.toBeInstanceOf(
      InvalidSimulationRuntimeEvidenceError,
    );
  });

  it('rejects invalid negative counters', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    await expect(
      useCase.execute(
        buildInput({
          divergenceCount: -1,
        }),
        context,
      ),
    ).rejects.toBeInstanceOf(
      InvalidSimulationRuntimeEvidenceError,
    );
  });

  it('isolates evidence by tenant and campaign', async () => {
    const repository =
      new InMemorySimulationRuntimeEvidenceRepository();
    const useCase =
      new CollectSimulationRuntimeEvidenceUseCase({
        repository,
      });

    await useCase.execute(buildInput(), context);

    await useCase.execute(
      buildInput({
        evidenceId: 'sim-runtime-evidence-00000002',
        campaignId: 'SDC-3.4H-HOMOLOGATION-2026-08',
      }),
      context,
    );

    await useCase.execute(
      buildInput(),
      {
        ...context,
        tenantId:
          '33333333-3333-3333-3333-333333333333',
      },
    );

    await expect(
      repository.listByCampaign(
        context.tenantId,
        'SDC-3.4H-HOMOLOGATION-2026-07',
      ),
    ).resolves.toHaveLength(1);
  });
});
