import { randomUUID } from 'node:crypto';

import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { CollectSimulationRuntimeEvidenceUseCase } from '../../../modules/simulation/evidence/index.js';
import {
  ConflictingSimulationRuntimeEvidenceError,
} from '../../../modules/simulation/evidence/index.js';
import { SimulationRuntimeEvidenceController } from '../../../modules/simulation/evidence/index.js';
import type {
  SimulationRuntimeEvidenceHttpRequestBodyContract,
} from '../../../modules/simulation/evidence/index.js';
import type { SimulationRuntimeEvidenceRepository } from '../../../modules/simulation/evidence/index.js';

const buildBody = (): SimulationRuntimeEvidenceHttpRequestBodyContract => ({
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

const buildRecord = (overrides = {}) => ({
  tenantId: 'tenant-a',
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  tenantIdHash: null,
  opportunityIdHash: null,
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'LOAN_WITH_COLLATERAL',
  subproductCode: 'AUTO_EQUITY',
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

const createRepository = () =>
  ({
    findByIdentity: vi.fn(),
    listByCampaign: vi.fn(),
    save: vi.fn(),
  }) satisfies SimulationRuntimeEvidenceRepository;

const createReply = () => ({
  request: {
    id: 'reply-req-1',
    requestId: 'reply-req-1',
  },
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
}) as unknown as FastifyReply;

const createRequest = (
  body: SimulationRuntimeEvidenceHttpRequestBodyContract,
  tenantId: string | null = 'tenant-a',
) =>
  ({
    body,
    currentTenant: tenantId
      ? {
          tenantId,
          userId: 'user-1',
        }
      : null,
    currentUser: {
      userId: 'user-1',
      tenantId: tenantId ?? 'tenant-a',
      permissions: ['simulation:evidence:write'],
    },
    id: randomUUID(),
    requestId: randomUUID(),
  }) as unknown as FastifyRequest;

describe('SimulationRuntimeEvidenceController', () => {
  it('returns 201 for a new evidence ingestion', async () => {
    const repository = createRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({
      repository,
    });
    const executeSpy = vi.spyOn(useCase, 'execute').mockResolvedValueOnce(buildRecord());
    const controller = new SimulationRuntimeEvidenceController({
      repository,
      useCase,
    });
    const reply = createReply();

    (repository.findByIdentity as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await controller.ingest(createRequest(buildBody()), reply);

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceId: 'sim-runtime-evidence-00000001',
      }),
      expect.objectContaining({
        tenantId: 'tenant-a',
        receivedByUserId: 'user-1',
      }),
    );
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          evidenceId: 'sim-runtime-evidence-00000001',
        }),
      }),
    );
  });

  it('returns 200 for an identical retry', async () => {
    const repository = createRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({
      repository,
    });
    const executeSpy = vi.spyOn(useCase, 'execute').mockResolvedValueOnce(buildRecord());
    const controller = new SimulationRuntimeEvidenceController({
      repository,
      useCase,
    });
    const reply = createReply();
    const record = buildRecord();

    (repository.findByIdentity as ReturnType<typeof vi.fn>).mockResolvedValueOnce(record);

    await controller.ingest(createRequest(buildBody()), reply);

    expect(executeSpy).not.toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          evidenceId: 'sim-runtime-evidence-00000001',
        }),
      }),
    );
  });

  it('returns 409 for a conflicting retry', async () => {
    const repository = createRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({
      repository,
    });
    const controller = new SimulationRuntimeEvidenceController({
      repository,
      useCase,
    });
    const reply = createReply();

    (repository.findByIdentity as ReturnType<typeof vi.fn>).mockResolvedValueOnce(buildRecord());
    vi.spyOn(useCase, 'execute').mockRejectedValueOnce(
      new ConflictingSimulationRuntimeEvidenceError(
        'sim-runtime-evidence-00000001',
        'SDC-3.4H-HOMOLOGATION-2026-07',
      ),
    );

    await controller.ingest(
      createRequest(
        {
          ...buildBody(),
          canonicalStatus: 'rejected',
        },
      ),
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(409);
  });

  it('returns 400 for invalid evidence', async () => {
    const repository = createRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({
      repository,
    });
    const controller = new SimulationRuntimeEvidenceController({
      repository,
      useCase,
    });
    const reply = createReply();

    await controller.ingest(
      createRequest({
        ...buildBody(),
        shadowMode: false,
      } as never),
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(400);
    expect((repository.findByIdentity as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('returns 403 when the tenant context is missing', async () => {
    const repository = createRepository();
    const useCase = new CollectSimulationRuntimeEvidenceUseCase({
      repository,
    });
    const controller = new SimulationRuntimeEvidenceController({
      repository,
      useCase,
    });
    const reply = createReply();

    await controller.ingest(createRequest(buildBody(), null), reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect((repository.findByIdentity as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
