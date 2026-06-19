import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PipelineRepositoryContract } from '../../../modules/pipelines/domain/pipeline-repository.contract.js';
import { PipelinesService } from '../../../modules/pipelines/service.js';

type PipelineRepositoryMock = PipelineRepositoryContract & {
  listActiveByTenant: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findStageById: ReturnType<typeof vi.fn>;
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
    listActiveByTenant: vi.fn(),
    findById: vi.fn(),
    findStageById: vi.fn(),
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
  });

  it('listActiveByTenant delegates to listActivePipelines', async () => {
    repository.listActiveByTenant.mockResolvedValueOnce([basePipeline]);
    const spy = vi.spyOn(service, 'listActivePipelines');

    const result = await service.listActiveByTenant('tenant-a');

    expect(spy).toHaveBeenCalledWith({ tenantId: 'tenant-a' });
    expect(repository.listActiveByTenant).toHaveBeenCalledWith('tenant-a');
    expect(result).toEqual([basePipeline]);
  });

  it('listActivePipelines uses repository.listActiveByTenant', async () => {
    repository.listActiveByTenant.mockResolvedValueOnce([basePipeline]);

    const result = await service.listActivePipelines({ tenantId: 'tenant-a' });

    expect(repository.listActiveByTenant).toHaveBeenCalledWith('tenant-a');
    expect(result).toEqual([basePipeline]);
  });

  it('constructor injection works', async () => {
    repository.listActiveByTenant.mockResolvedValueOnce([]);

    const injected = new PipelinesService(repository);
    const result = await injected.listActiveByTenant('tenant-a');

    expect(result).toEqual([]);
    expect(repository.listActiveByTenant).toHaveBeenCalledWith('tenant-a');
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

  it('updateStage validates flags', async () => {
    await expect(
      service.updateStage({
        id: 'stage-1',
        tenantId: 'tenant-a',
        pipelineId: 'pipeline-1',
        name: 'Novo Lead',
        isWon: true,
        isLost: true,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Stage cannot be won and lost at the same time');

    expect(repository.updateStage).not.toHaveBeenCalled();
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

  it('deactivatePipeline delegates tenantId/pipelineId/actorUserId', async () => {
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

  it('deactivateStage delegates tenantId/stageId/actorUserId', async () => {
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
    });
  });
});
