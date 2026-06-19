import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    stage: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const prismaMock = {
    $transaction: vi.fn(async (callback: (transaction: typeof txMock) => Promise<unknown>) =>
      callback(txMock),
    ),
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    stage: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
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
        deletedAt: true,
      }),
    });
  });

  it('createPipeline does not require code', async () => {
    prismaMock.pipeline.create.mockResolvedValueOnce({ id: 'pipeline-1' });

    await pipelinesRepository.createPipeline({
      tenantId: 'tenant-a',
      name: 'Main Pipeline',
      description: null,
      isDefault: true,
      isActive: true,
    });

    expect(prismaMock.pipeline.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        name: 'Main Pipeline',
        description: null,
        isDefault: true,
        isActive: true,
      },
      include: expect.any(Object),
    });
  });

  it('createStage does not use code or isActive', async () => {
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
      },
      select: expect.objectContaining({
        id: true,
        tenantId: true,
        pipelineId: true,
        deletedAt: true,
      }),
    });
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
