import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    stage: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    opportunity: {
      count: vi.fn(),
    },
  };

  const prismaMock = {
    $transaction: vi.fn(async (callback: (transaction: typeof txMock) => Promise<unknown>) =>
      callback(txMock),
    ),
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    stage: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    opportunity: {
      count: vi.fn(),
    },
  };

  return { prismaMock, txMock };
});

vi.mock('../../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { pipelinesRepository } from '../../../modules/pipelines/repository.js';

describe('pipelinesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findById applies tenantId and deletedAt null', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce(null);

    await pipelinesRepository.findById({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });

    expect(prismaMock.pipeline.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      include: expect.objectContaining({
        stages: expect.objectContaining({
          where: {
            deletedAt: null,
          },
        }),
      }),
    });
  });

  it('findStageById applies tenantId and deletedAt null', async () => {
    prismaMock.stage.findFirst.mockResolvedValueOnce(null);

    await pipelinesRepository.findStageById({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
    });

    expect(prismaMock.stage.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'stage-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: expect.objectContaining({
        id: true,
        tenantId: true,
        pipelineId: true,
        isActive: true,
        deletedAt: true,
      }),
    });
  });

  it('listByTenant filters deletedAt null and isActive true by default', async () => {
    prismaMock.pipeline.findMany.mockResolvedValueOnce([]);

    await pipelinesRepository.listByTenant({
      tenantId: 'tenant-a',
    });

    expect(prismaMock.pipeline.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
      },
      include: expect.objectContaining({
        stages: expect.objectContaining({
          where: {
            deletedAt: null,
          },
        }),
      }),
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  });

  it('listByTenant includes inactive pipelines when requested', async () => {
    prismaMock.pipeline.findMany.mockResolvedValueOnce([]);

    await pipelinesRepository.listByTenant({
      tenantId: 'tenant-a',
      includeInactive: true,
    });

    expect(prismaMock.pipeline.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      include: expect.objectContaining({
        stages: expect.objectContaining({
          where: {
            deletedAt: null,
          },
        }),
      }),
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  });

  it('hasLinkedOpportunitiesForPipeline checks linked active opportunities', async () => {
    prismaMock.opportunity.count.mockResolvedValueOnce(2);

    const result = await pipelinesRepository.hasLinkedOpportunitiesForPipeline({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });

    expect(prismaMock.opportunity.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        deletedAt: null,
      },
    });
    expect(result).toBe(true);
  });

  it('hasLinkedOpportunitiesForStage checks linked active opportunities', async () => {
    prismaMock.opportunity.count.mockResolvedValueOnce(0);

    const result = await pipelinesRepository.hasLinkedOpportunitiesForStage({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
    });

    expect(prismaMock.opportunity.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        stageId: 'stage-1',
        deletedAt: null,
      },
    });
    expect(result).toBe(false);
  });

  it('countActiveByTenant counts active non-deleted pipelines for tenant', async () => {
    prismaMock.pipeline.count.mockResolvedValueOnce(3);

    const result = await pipelinesRepository.countActiveByTenant({
      tenantId: 'tenant-a',
    });

    expect(prismaMock.pipeline.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
      },
    });
    expect(result).toBe(3);
  });

  it('createPipeline does not require code', async () => {
    txMock.pipeline.create.mockResolvedValueOnce({ id: 'pipeline-1' });

    await pipelinesRepository.createPipeline({
      tenantId: 'tenant-a',
      name: 'Main Pipeline',
      description: null,
      isDefault: true,
      isActive: true,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.pipeline.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        name: 'Main Pipeline',
        description: null,
        isDefault: true,
        isActive: true,
      },
      include: expect.any(Object),
    });
    expect(txMock.pipeline.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
        isDefault: true,
        id: {
          not: 'pipeline-1',
        },
      },
      data: {
        isDefault: false,
      },
    });
  });

  it('updatePipeline keeps one active default per tenant when enabling default', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({
      id: 'pipeline-1',
      isDefault: false,
    });
    txMock.pipeline.updateMany.mockResolvedValueOnce({ count: 1 });

    await pipelinesRepository.updatePipeline({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Main Pipeline',
      isDefault: true,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.pipeline.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        isDefault: true,
      },
    });
    expect(txMock.pipeline.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        name: 'Main Pipeline',
        isDefault: true,
      },
    });
    expect(txMock.pipeline.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
        isDefault: true,
        id: {
          not: 'pipeline-1',
        },
      },
      data: {
        isDefault: false,
      },
    });
  });

  it('updatePipeline blocks disabling the last active default', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({
      id: 'pipeline-1',
      isDefault: true,
    });
    txMock.pipeline.count.mockResolvedValueOnce(1);

    await expect(
      pipelinesRepository.updatePipeline({
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        isDefault: false,
      }),
    ).rejects.toThrow('Tenant must keep one active default pipeline');

    expect(txMock.pipeline.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
        isDefault: true,
      },
    });
    expect(txMock.pipeline.updateMany).not.toHaveBeenCalled();
  });

  it('createStage persists active stages by default', async () => {
    prismaMock.stage.create.mockResolvedValueOnce({ id: 'stage-1' });

    await pipelinesRepository.createStage({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
    });

    expect(prismaMock.stage.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: 'Novo Lead',
        order: 1,
        isWon: false,
        isLost: false,
        isActive: true,
      },
      select: expect.objectContaining({
        id: true,
        tenantId: true,
        pipelineId: true,
        isActive: true,
        deletedAt: true,
      }),
    });
  });

  it('updateStage persists isActive when provided', async () => {
    prismaMock.stage.updateMany.mockResolvedValueOnce({ count: 1 });

    await pipelinesRepository.updateStage({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
      isActive: false,
    });

    expect(prismaMock.stage.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'stage-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        isActive: false,
      },
    });
  });

  it('countActiveStagesByPipeline counts active non-deleted stages for tenant pipeline', async () => {
    prismaMock.stage.count.mockResolvedValueOnce(2);

    const result = await pipelinesRepository.countActiveStagesByPipeline({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });

    expect(prismaMock.stage.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        deletedAt: null,
        isActive: true,
      },
    });
    expect(result).toBe(2);
  });

  it('softDeletePipeline uses deletedAt', async () => {
    prismaMock.pipeline.updateMany.mockResolvedValueOnce({ count: 1 });

    await pipelinesRepository.softDeletePipeline({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
    });

    expect(prismaMock.pipeline.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'pipeline-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('softDeleteStage uses deletedAt', async () => {
    prismaMock.stage.updateMany.mockResolvedValueOnce({ count: 1 });

    await pipelinesRepository.softDeleteStage({
      tenantId: 'tenant-a',
      stageId: 'stage-1',
    });

    expect(prismaMock.stage.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'stage-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('reorderStages uses tenantId and pipelineId on every update', async () => {
    txMock.stage.updateMany.mockResolvedValue({ count: 1 });

    await pipelinesRepository.reorderStages({
      tenantId: 'tenant-a',
      pipelineId: 'pipeline-1',
      stages: [
        { stageId: 'stage-1', order: 2 },
        { stageId: 'stage-2', order: 1 },
      ],
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.stage.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'stage-1',
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        deletedAt: null,
      },
      data: {
        order: 2,
      },
    });
    expect(txMock.stage.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: 'stage-2',
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        deletedAt: null,
      },
      data: {
        order: 1,
      },
    });
  });

  it('findActiveByTenant continues working', async () => {
    prismaMock.pipeline.findMany.mockResolvedValueOnce([]);

    await pipelinesRepository.findActiveByTenant('tenant-a');

    expect(prismaMock.pipeline.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        isActive: true,
      },
      include: expect.objectContaining({
        stages: expect.objectContaining({
          where: {
            deletedAt: null,
          },
        }),
      }),
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  });
});
