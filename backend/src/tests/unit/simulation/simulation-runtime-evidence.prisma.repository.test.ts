import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictingSimulationRuntimeEvidenceError } from '../../../modules/simulation/evidence/index.js';
import { SimulationRuntimeEvidencePrismaRepository } from '../../../modules/simulation/evidence/index.js';
import type { SimulationRuntimeEvidenceRecord } from '../../../modules/simulation/evidence/index.js';

const createRecord = (
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
  receivedByUserId: 'user-1',
  receivedAt: new Date('2026-07-10T12:00:01.000Z'),
  ...overrides,
});

const createClient = () => {
  const client = {
    simulationRuntimeEvidence: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };

  return client as unknown as {
    simulationRuntimeEvidence: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
};

describe('SimulationRuntimeEvidencePrismaRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new evidence record', async () => {
    const client = createClient();
    client.simulationRuntimeEvidence.findUnique.mockResolvedValueOnce(null);
    client.simulationRuntimeEvidence.create.mockResolvedValueOnce({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
      timestamp: new Date('2026-07-10T12:00:00.000Z'),
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
      receivedByUserId: 'user-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
      createdAt: new Date('2026-07-10T12:00:02.000Z'),
    });

    const repository = new SimulationRuntimeEvidencePrismaRepository(client as never);
    const evidence = createRecord();

    const saved = await repository.save(evidence);

    expect(client.simulationRuntimeEvidence.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_campaignId_evidenceId: {
          tenantId: 'tenant-a',
          campaignId: 'campaign-1',
          evidenceId: 'evidence-1',
        },
      },
    });
    expect(client.simulationRuntimeEvidence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-a',
        campaignId: 'campaign-1',
        timestamp: new Date('2026-07-10T12:00:00.000Z'),
        receivedAt: new Date('2026-07-10T12:00:01.000Z'),
      }),
    });
    expect(saved.evidenceId).toBe('evidence-1');
  });

  it('finds evidence by identity', async () => {
    const client = createClient();
    client.simulationRuntimeEvidence.findUnique.mockResolvedValueOnce({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
      timestamp: new Date('2026-07-10T12:00:00.000Z'),
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
      receivedByUserId: 'user-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
      createdAt: new Date('2026-07-10T12:00:02.000Z'),
    });

    const repository = new SimulationRuntimeEvidencePrismaRepository(client as never);
    const record = await repository.findByIdentity('tenant-a', 'campaign-1', 'evidence-1');

    expect(record).toMatchObject({
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
    });
  });

  it('returns the existing evidence for an identical retry without updating the row', async () => {
    const client = createClient();
    client.simulationRuntimeEvidence.findUnique.mockResolvedValueOnce({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
      timestamp: new Date('2026-07-10T12:00:00.000Z'),
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
      receivedByUserId: 'user-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
      createdAt: new Date('2026-07-10T12:00:02.000Z'),
    });

    const repository = new SimulationRuntimeEvidencePrismaRepository(client as never);
    const evidence = createRecord();

    const saved = await repository.save(evidence);

    expect(saved).toMatchObject({
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
    });
    expect(client.simulationRuntimeEvidence.create).not.toHaveBeenCalled();
  });

  it('rejects a conflicting retry for the same identity', async () => {
    const client = createClient();
    client.simulationRuntimeEvidence.findUnique.mockResolvedValueOnce({
      tenantId: 'tenant-a',
      evidenceId: 'evidence-1',
      campaignId: 'campaign-1',
      timestamp: new Date('2026-07-10T12:00:00.000Z'),
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
      receivedByUserId: 'user-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
      createdAt: new Date('2026-07-10T12:00:02.000Z'),
    });

    const repository = new SimulationRuntimeEvidencePrismaRepository(client as never);

    await expect(
      repository.save(
        createRecord({
          canonicalStatus: 'rejected',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictingSimulationRuntimeEvidenceError);
    expect(client.simulationRuntimeEvidence.create).not.toHaveBeenCalled();
  });

  it('lists evidence in deterministic order and respects tenant and campaign isolation', async () => {
    const client = createClient();
    client.simulationRuntimeEvidence.findMany.mockResolvedValueOnce([
      {
        tenantId: 'tenant-a',
        evidenceId: 'evidence-1',
        campaignId: 'campaign-1',
        timestamp: new Date('2026-07-10T11:00:00.000Z'),
        environment: 'homologation',
        tenantIdHash: null,
        opportunityIdHash: null,
        requestId: 'request-1',
        correlationId: 'correlation-1',
        executionId: 'execution-1',
        productCode: 'PRODUCT-1',
        subproductCode: 'SUB-1',
        legacyStatus: null,
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
        runtimeDurationMs: 100,
        fallbackUsed: false,
        shadowMode: true,
        comparatorVersion: '1.0.0',
        contractVersion: '1.0.0',
        catalogVersion: '1.0.0',
        engineVersion: '1.0.0',
        policyVersion: '1.0.0',
        strategyVersion: '1.0.0',
        receivedByUserId: null,
        receivedAt: new Date('2026-07-10T11:00:01.000Z'),
        createdAt: new Date('2026-07-10T11:00:02.000Z'),
      },
      {
        tenantId: 'tenant-a',
        evidenceId: 'evidence-2',
        campaignId: 'campaign-1',
        timestamp: new Date('2026-07-10T12:00:00.000Z'),
        environment: 'homologation',
        tenantIdHash: null,
        opportunityIdHash: null,
        requestId: 'request-2',
        correlationId: 'correlation-2',
        executionId: 'execution-2',
        productCode: 'PRODUCT-1',
        subproductCode: 'SUB-1',
        legacyStatus: null,
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
        runtimeDurationMs: 150,
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
        createdAt: new Date('2026-07-10T12:00:02.000Z'),
      },
    ]);

    const repository = new SimulationRuntimeEvidencePrismaRepository(client as never);

    const list = await repository.listByCampaign('tenant-a', 'campaign-1');

    expect(client.simulationRuntimeEvidence.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        campaignId: 'campaign-1',
      },
      orderBy: [
        { timestamp: 'asc' },
        { createdAt: 'asc' },
        { evidenceId: 'asc' },
      ],
    });
    expect(list.map((record) => record.evidenceId)).toEqual(['evidence-1', 'evidence-2']);
  });
});
