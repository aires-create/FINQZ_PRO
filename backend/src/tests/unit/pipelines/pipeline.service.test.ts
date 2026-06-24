import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PipelineRepositoryContract } from '../../../modules/pipelines/domain/pipeline-repository.contract.js';
import {
  PipelineNotFoundError,
  PipelineInUseError,
  PipelinesService,
  StageNotFoundError,
  StageInUseError,
} from '../../../modules/pipelines/service.js';

type PipelineRepositoryMock = PipelineRepositoryContract & {
  listByTenant: ReturnType<typeof vi.fn>;
  listActiveByTenant: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findStageById: ReturnType<typeof vi.fn>;
  hasLinkedOpportunitiesForPipeline: ReturnType<typeof vi.fn>;
  hasLinkedOpportunitiesForStage: ReturnType<typeof vi.fn>;
  countActiveByTenant: ReturnType<typeof vi.fn>;
  countActiveStagesByPipeline: ReturnType<typeof vi.fn>;
  createPipeline: ReturnType<typeof vi.fn>;
  updatePipeline: ReturnType<typeof vi.fn>;
  softDeletePipeline: ReturnType<typeof vi.fn>;
  createStage: ReturnType<typeof vi.fn>;
  updateStage: ReturnType<typeof vi.fn>;
  softDeleteStage: ReturnType<typeof vi.fn>;
  reorderStages: ReturnType<typeof vi.fn>;
};

const createRepositoryMock = (): PipelineRepositoryMock =>
  ({
    listByTenant: vi.fn(),
    listActiveByTenant: vi.fn(),
    findById: vi.fn(),
    findStageById: vi.fn(),
    hasLinkedOpportunitiesForPipeline: vi.fn(),
    hasLinkedOpportunitiesForStage: vi.fn(),
    countActiveByTenant: vi.fn(),
    countActiveStagesByPipeline: vi.fn(),
    createPipeline: vi.fn(),
    updatePipeline: vi.fn(),
    softDeletePipeline: vi.fn(),
    createStage: vi.fn(),
    updateStage: vi.fn(),
    softDeleteStage: vi.fn(),
    reorderStages: vi.fn(),
  } satisfies PipelineRepositoryMock);

const serviceSource = readFileSync(
  resolve(process.cwd(), 'src/modules/pipelines/service.ts'),
  'utf8',
);

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {};

  const prismaMock = {
    $transaction: vi.fn(async (callback: (transaction: typeof txMock) => Promise<unknown>) =>
      callback(txMock),
    ),
  };

  return { prismaMock, txMock };
});

vi.mock('../../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

const basePipeline = {
  id: 'pipeline-1',
  tenantId: 'tenant-a',
  name: 'Main Pipeline',
  description: null,
  isDefault: true,
  isActive: true,
  stages: [],
  createdAt: new Date('2026-06-19T00:00:00.000Z'),
  updatedAt: new Date('2026-06-19T00:00:00.000Z'),
  deletedAt: null,
};

const baseStage = {
  id: 'stage-1',
  tenantId: 'tenant-a',
  pipelineId: 'pipeline-1',
  name: 'Novo Lead',
  order: 1,
  isWon: false,
  isLost: false,
  isActive: true,
  createdAt: new Date('2026-06-19T00:00:00.000Z'),
  updatedAt: new Date('2026-06-19T00:00:00.000Z'),
  deletedAt: null,
};

describe('PipelinesService', () => {
  let repository: PipelineRepositoryMock;
  let service: PipelinesService;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new PipelinesService(repository);
    vi.clearAllMocks();
    prismaMock.$transaction.mockClear();
  });

  it('listActiveByTenant delegates to listActivePipelines', async () => {
    repository.listByTenant.mockResolvedValueOnce([basePipeline]);
    const spy = vi.spyOn(service, 'listActivePipelines');

    const result = await service.listActiveByTenant('tenant-a');

    expect(spy).toHaveBeenCalledWith({ tenantId: 'tenant-a' });
    expect(repository.listByTenant).toHaveBeenCalledWith({ tenantId: 'tenant-a' });
    expect(result).toEqual([basePipeline]);
  });

  it('listActivePipelines uses repository.listByTenant', async () => {
    repository.listByTenant.mockResolvedValueOnce([basePipeline]);

    const result = await service.listActivePipelines({ tenantId: 'tenant-a' });

    expect(repository.listByTenant).toHaveBeenCalledWith({ tenantId: 'tenant-a' });
    expect(result).toEqual([basePipeline]);
  });

  it('listActivePipelines passes includeInactive to repository.listByTenant', async () => {
    repository.listByTenant.mockResolvedValueOnce([basePipeline]);

    const result = await service.listActivePipelines({
      tenantId: 'tenant-a',
      includeInactive: true,
    });

    expect(repository.listByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      includeInactive: true,
    });
    expect(result).toEqual([basePipeline]);
  });

  it('constructor injection works', async () => {
    repository.listByTenant.mockResolvedValueOnce([]);

    const injected = new PipelinesService(repository);
    const result = await injected.listActiveByTenant('tenant-a');

    expect(result).toEqual([]);
    expect(repository.listByTenant).toHaveBeenCalledWith({ tenantId: 'tenant-a' });
  });

  it('does not depend on legacy adapter casts', () => {
    expect(serviceSource).not.toContain('asLegacyRepository');
    expect(serviceSource).not.toContain('unknown as PipelineRepositoryContract');
    expect(serviceSource).not.toContain('as never');
  });

  it('createPipeline rejects empty name before repository', async () => {
    await expect(
      service.createPipeline({
        tenantId: 'tenant-a',
        name: '',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Pipeline name is required');

    expect(repository.createPipeline).not.toHaveBeenCalled();
  });

  it('createPipeline delegates with valid input', async () => {
    repository.createPipeline.mockResolvedValueOnce(basePipeline);

    const result = await service.createPipeline({
      tenantId: 'tenant-a',
      name: 'Main Pipeline',
      description: 'Primary pipeline',
      isDefault: true,
      isActive: true,
      actorUserId: 'user-1',
    });

    expect(repository.createPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      name: 'Main Pipeline',
      description: 'Primary pipeline',
      isDefault: true,
      isActive: true,
      stages: undefined,
    });
    expect(result).toBe(basePipeline);
  });

  it('createStage rejects empty name', async () => {
    await expect(
      service.createStage({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: '',
        order: 1,
        isWon: false,
        isLost: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Stage name is required');

    expect(repository.createStage).not.toHaveBeenCalled();
  });

  it('createStage looks up pipeline by tenantId and pipelineId before insert', async () => {
    repository.findById.mockResolvedValueOnce(basePipeline);
    repository.createStage.mockResolvedValueOnce(baseStage);

    const result = await service.createStage({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
      actorUserId: 'user-1',
    });

    expect(repository.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });
    expect(repository.createStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
    });
    expect(result).toBe(baseStage);
  });

  it('createStage throws PipelineNotFoundError when pipeline is missing', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(
      service.createStage({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: 'Novo Lead',
        order: 1,
        isWon: false,
        isLost: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(PipelineNotFoundError);

    expect(repository.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });
    expect(repository.createStage).not.toHaveBeenCalled();
  });

  it('createStage rejects invalid order', async () => {
    await expect(
      service.createStage({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: 'Novo Lead',
        order: 0,
        isWon: false,
        isLost: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Stage order must be greater than or equal to 1');

    expect(repository.createStage).not.toHaveBeenCalled();
  });

  it('createStage rejects isWon=true and isLost=true', async () => {
    await expect(
      service.createStage({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: 'Novo Lead',
        order: 1,
        isWon: true,
        isLost: true,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Stage cannot be won and lost at the same time');

    expect(repository.createStage).not.toHaveBeenCalled();
  });

  it('createStage delegates when pipeline exists', async () => {
    repository.findById.mockResolvedValueOnce(basePipeline);
    repository.createStage.mockResolvedValueOnce(baseStage);

    const result = await service.createStage({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
      actorUserId: 'user-1',
    });

    expect(repository.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });
    expect(repository.createStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
    });
    expect(result).toBe(baseStage);
  });

  it('updateStage validates flags', async () => {
    await expect(
      service.updateStage({
        id: 'stage-1',
        tenantId: 'tenant-a',
        name: 'Novo Lead',
        isWon: true,
        isLost: true,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Stage cannot be won and lost at the same time');

    expect(repository.updateStage).not.toHaveBeenCalled();
  });

  it('updateStage allows inactivation with linked opportunities and forwards isActive=false', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: true,
    });
    repository.countActiveStagesByPipeline.mockResolvedValueOnce(2);
    repository.updateStage.mockResolvedValueOnce(undefined);
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });

    const result = await service.updateStage({
      id: 'stage-1',
      tenantId: 'tenant-a',
      isActive: false,
      actorUserId: 'user-1',
    });

    expect(repository.countActiveStagesByPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    }, txMock);
    expect(repository.hasLinkedOpportunitiesForStage).not.toHaveBeenCalled();
    expect(repository.updateStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      isActive: false,
    }, txMock);
    expect(result).toEqual({
      ...baseStage,
      isActive: false,
    });
  });

  it('updateStage uses a serializable transaction for lifecycle toggles', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: true,
    });
    repository.countActiveStagesByPipeline.mockResolvedValueOnce(2);
    repository.updateStage.mockResolvedValueOnce(undefined);
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });

    await service.updateStage({
      id: 'stage-1',
      tenantId: 'tenant-a',
      isActive: false,
      actorUserId: 'user-1',
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  });

  it('updateStage allows reactivation with isActive=true', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });
    repository.updateStage.mockResolvedValueOnce(undefined);
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: true,
    });

    const result = await service.updateStage({
      id: 'stage-1',
      tenantId: 'tenant-a',
      isActive: true,
      actorUserId: 'user-1',
    });

    expect(repository.countActiveStagesByPipeline).not.toHaveBeenCalled();
    expect(repository.updateStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      isActive: true,
    }, txMock);
    expect(result).toEqual({
      ...baseStage,
      isActive: true,
    });
  });

  it('updateStage blocks inactivation when it is the last active stage', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: true,
    });
    repository.countActiveStagesByPipeline.mockResolvedValueOnce(1);

    await expect(
      service.updateStage({
        id: 'stage-1',
        tenantId: 'tenant-a',
        isActive: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Pipeline must keep one active stage');

    expect(repository.countActiveStagesByPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    }, txMock);
    expect(repository.hasLinkedOpportunitiesForStage).not.toHaveBeenCalled();
    expect(repository.updateStage).not.toHaveBeenCalled();
  });

  it('updatePipeline throws PipelineNotFoundError when record is missing', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(
      service.updatePipeline({
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        name: 'Main Pipeline',
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(PipelineNotFoundError);
  });

  it('updatePipeline blocks inactivation for default pipelines', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: true,
    });

    await expect(
      service.updatePipeline({
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        isActive: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Default pipeline cannot be inactivated');

    expect(repository.countActiveByTenant).not.toHaveBeenCalled();
    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
    expect(repository.updatePipeline).not.toHaveBeenCalled();
  });

  it('updatePipeline blocks inactivation for the last active pipeline', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: false,
      isActive: true,
    });
    repository.countActiveByTenant.mockResolvedValueOnce(1);

    await expect(
      service.updatePipeline({
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        isActive: false,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Tenant must keep one active pipeline');

    expect(repository.countActiveByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
    });
    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
    expect(repository.updatePipeline).not.toHaveBeenCalled();
  });

  it('updatePipeline allows inactivation when another active pipeline exists and target is not default', async () => {
    repository.findById
      .mockResolvedValueOnce({
        ...basePipeline,
        isDefault: false,
        isActive: true,
      })
      .mockResolvedValueOnce({
        ...basePipeline,
        isDefault: false,
        isActive: false,
      });
    repository.countActiveByTenant.mockResolvedValueOnce(2);
    repository.updatePipeline.mockResolvedValueOnce(undefined);

    const result = await service.updatePipeline({
      id: 'pipeline-1',
      tenantId: 'tenant-a',
      isActive: false,
      actorUserId: 'user-1',
    });

    expect(repository.countActiveByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
    });
    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
    expect(repository.updatePipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      isActive: false,
    });
    expect(result).toEqual({
      ...basePipeline,
      isDefault: false,
      isActive: false,
    });
  });

  it('updatePipeline does not query opportunities for inactivation', async () => {
    repository.findById
      .mockResolvedValueOnce({
        ...basePipeline,
        isDefault: false,
        isActive: true,
      })
      .mockResolvedValueOnce({
        ...basePipeline,
        isDefault: false,
        isActive: false,
      });
    repository.countActiveByTenant.mockResolvedValueOnce(2);
    repository.updatePipeline.mockResolvedValueOnce(undefined);

    await service.updatePipeline({
      id: 'pipeline-1',
      tenantId: 'tenant-a',
      isActive: false,
      actorUserId: 'user-1',
    });

    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
  });

  it('updateStage throws StageNotFoundError when record is missing', async () => {
    repository.updateStage.mockResolvedValueOnce(undefined);
    repository.findStageById.mockResolvedValueOnce(null);

    await expect(
      service.updateStage({
        id: 'stage-1',
        tenantId: 'tenant-a',
        name: 'Stage A',
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(StageNotFoundError);
  });

  it('reorderStages rejects empty list', async () => {
    await expect(
      service.reorderStages({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        stages: [],
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('At least one stage is required');

    expect(repository.reorderStages).not.toHaveBeenCalled();
  });

  it('reorderStages delegates when valid', async () => {
    repository.reorderStages.mockResolvedValueOnce([{ count: 1 }]);
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      stages: [baseStage],
    });

    const result = await service.reorderStages({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      stages: [{ id: 'stage-1', order: 2 }],
      actorUserId: 'user-1',
    });

    expect(repository.reorderStages).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      stages: [{ stageId: 'stage-1', order: 2 }],
    });
    expect(repository.findById).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });
    expect(result).toEqual([baseStage]);
  });

  it('reorderStages throws PipelineNotFoundError when pipeline is missing', async () => {
    repository.reorderStages.mockResolvedValueOnce([{ count: 1 }]);
    repository.findById.mockResolvedValueOnce(null);

    await expect(
      service.reorderStages({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        stages: [{ id: 'stage-1', order: 2 }],
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(PipelineNotFoundError);
  });

  it('deactivatePipeline delegates tenantId/pipelineId/actorUserId', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: false,
      isActive: true,
    });
    repository.countActiveByTenant.mockResolvedValueOnce(2);
    repository.hasLinkedOpportunitiesForPipeline.mockResolvedValueOnce(false);
    repository.softDeletePipeline.mockResolvedValueOnce({ count: 1 });

    await service.deactivatePipeline({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      actorUserId: 'user-1',
    });

    expect(repository.softDeletePipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      actorUserId: 'user-1',
    });
  });

  it('deactivatePipeline blocks default pipelines before softDelete', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: true,
    });

    await expect(
      service.deactivatePipeline({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Default pipeline cannot be archived');

    expect(repository.countActiveByTenant).not.toHaveBeenCalled();
    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
    expect(repository.softDeletePipeline).not.toHaveBeenCalled();
  });

  it('deactivatePipeline blocks the last active pipeline before softDelete', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: false,
      isActive: true,
    });
    repository.countActiveByTenant.mockResolvedValueOnce(1);

    await expect(
      service.deactivatePipeline({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Tenant must keep one active pipeline');

    expect(repository.countActiveByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
    });
    expect(repository.hasLinkedOpportunitiesForPipeline).not.toHaveBeenCalled();
    expect(repository.softDeletePipeline).not.toHaveBeenCalled();
  });

  it('deactivatePipeline blocks when pipeline has linked opportunities', async () => {
    repository.findById.mockResolvedValueOnce({
      ...basePipeline,
      isDefault: false,
      isActive: true,
    });
    repository.countActiveByTenant.mockResolvedValueOnce(2);
    repository.hasLinkedOpportunitiesForPipeline.mockResolvedValueOnce(true);

    await expect(
      service.deactivatePipeline({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(PipelineInUseError);

    expect(repository.hasLinkedOpportunitiesForPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });
    expect(repository.softDeletePipeline).not.toHaveBeenCalled();
  });

  it('deactivateStage delegates tenantId/stageId/actorUserId', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });
    repository.hasLinkedOpportunitiesForStage.mockResolvedValueOnce(false);
    repository.softDeleteStage.mockResolvedValueOnce({ count: 1 });

    await service.deactivateStage({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      actorUserId: 'user-1',
    });

    expect(repository.softDeleteStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      actorUserId: 'user-1',
    }, txMock);
  });

  it('deactivateStage uses a serializable transaction', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });
    repository.hasLinkedOpportunitiesForStage.mockResolvedValueOnce(false);
    repository.softDeleteStage.mockResolvedValueOnce({ count: 1 });

    await service.deactivateStage({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      actorUserId: 'user-1',
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  });

  it('deactivateStage blocks when stage has linked opportunities', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: false,
    });
    repository.hasLinkedOpportunitiesForStage.mockResolvedValueOnce(true);

    await expect(
      service.deactivateStage({
        tenantId: 'tenant-a',
        stageId: 'stage-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(StageInUseError);

    expect(repository.hasLinkedOpportunitiesForStage).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
    }, txMock);
    expect(repository.softDeleteStage).not.toHaveBeenCalled();
  });

  it('deactivateStage blocks when stage is the last active stage', async () => {
    repository.findStageById.mockResolvedValueOnce({
      ...baseStage,
      isActive: true,
    });
    repository.countActiveStagesByPipeline.mockResolvedValueOnce(1);

    await expect(
      service.deactivateStage({
        tenantId: 'tenant-a',
        stageId: 'stage-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Pipeline must keep one active stage');

    expect(repository.countActiveStagesByPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    }, txMock);
    expect(repository.hasLinkedOpportunitiesForStage).not.toHaveBeenCalled();
    expect(repository.softDeleteStage).not.toHaveBeenCalled();
  });
});
