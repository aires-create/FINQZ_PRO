import { pipelinesRepository } from './repository.js';
import type {
  PipelineContract,
  CreatePipelineInput,
  CreateStageInput,
  UpdatePipelineInput,
  UpdateStageInput,
  ReorderStagesInput,
} from './domain/pipeline.contract.js';
import type { PipelineRepositoryContract } from './domain/pipeline-repository.contract.js';
import {
  validatePipelineName,
  validateStageName,
  validateStageOrder,
  validateWonLostFlags,
} from './validators/pipeline.validator.js';
import type {
  CreatePipelineServiceInput,
  CreateStageServiceInput,
  DeactivatePipelineServiceInput,
  DeactivateStageServiceInput,
  ListActivePipelinesServiceInput,
  PipelineServiceContract,
  ReorderStagesServiceInput,
  UpdatePipelineServiceInput,
  UpdateStageServiceInput,
} from './services/pipeline-service.contract.js';

const validateStageWrite = (
  input: Pick<CreateStageInput, 'name' | 'order' | 'isWon' | 'isLost'> | Pick<UpdateStageInput, 'name' | 'order' | 'isWon' | 'isLost'>,
) => {
  if ('name' in input && input.name !== undefined) {
    validateStageName(input.name);
  }

  if ('order' in input && input.order !== undefined) {
    validateStageOrder(input.order);
  }

  validateWonLostFlags({
    isWon: input.isWon ?? false,
    isLost: input.isLost ?? false,
  });
};

const validatePipelineWrite = (
  input: Pick<CreatePipelineInput, 'name' | 'stages'> | Pick<UpdatePipelineInput, 'name' | 'stages'>,
) => {
  if (input.name !== undefined) {
    validatePipelineName(input.name);
  }

  const stages = input.stages ?? [];
  for (const stage of stages) {
    validateStageWrite(stage);
  }
};

export class PipelinesService implements PipelineServiceContract {
  constructor(
    private readonly repository: PipelineRepositoryContract =
      pipelinesRepository,
  ) {}

  async listActiveByTenant(tenantId: string) {
    return this.listActivePipelines({ tenantId });
  }

  async listActivePipelines(
    input: ListActivePipelinesServiceInput,
  ): Promise<PipelineContract[]> {
    return this.repository.listActiveByTenant(input.tenantId);
  }

  async createPipeline(
    input: CreatePipelineServiceInput,
  ): Promise<PipelineContract> {
    validatePipelineWrite(input);

    const payload = {
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? null,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
      ...(input.stages !== undefined ? { stages: input.stages } : {}),
    };

    return this.repository.createPipeline(payload);
  }

  async updatePipeline(
    input: UpdatePipelineServiceInput,
  ): Promise<PipelineContract> {
    validatePipelineWrite(input);

    const payload = {
      tenantId: input.tenantId,
      pipelineId: input.id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };

    await this.repository.updatePipeline(payload);

    const pipeline = await this.repository.findById({
      tenantId: input.tenantId,
      pipelineId: input.id,
    });

    if (!pipeline) {
      throw new PipelineNotFoundError(input.id);
    }

    return pipeline;
  }

  async deactivatePipeline(
    input: DeactivatePipelineServiceInput,
  ): Promise<void> {
    await this.repository.softDeletePipeline({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
      actorUserId: input.actorUserId,
    });
  }

  async createStage(
    input: CreateStageServiceInput,
  ): Promise<PipelineContract['stages'][number]> {
    validateStageWrite(input);

    return this.repository.createStage({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
      name: input.name,
      order: input.order,
      isWon: input.isWon,
      isLost: input.isLost,
    });
  }

  async updateStage(
    input: UpdateStageServiceInput,
  ): Promise<PipelineContract['stages'][number]> {
    validateStageWrite(input);

    const payload = {
      tenantId: input.tenantId,
      stageId: input.id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.isWon !== undefined ? { isWon: input.isWon } : {}),
      ...(input.isLost !== undefined ? { isLost: input.isLost } : {}),
    };

    await this.repository.updateStage(payload);

    const stage = await this.repository.findStageById({
      tenantId: input.tenantId,
      stageId: input.id,
    });

    if (!stage) {
      throw new StageNotFoundError(input.id);
    }

    return stage;
  }

  async deactivateStage(
    input: DeactivateStageServiceInput,
  ): Promise<void> {
    await this.repository.softDeleteStage({
      tenantId: input.tenantId,
      stageId: input.stageId,
      actorUserId: input.actorUserId,
    });
  }

  async reorderStages(
    input: ReorderStagesServiceInput,
  ): Promise<PipelineContract['stages']> {
    if (!input.stages.length) {
      throw new Error('At least one stage is required');
    }

    for (const stage of input.stages) {
      validateStageOrder(stage.order);
    }

    await this.repository.reorderStages({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
      stages: input.stages.map((stage) => ({
        stageId: stage.id,
        order: stage.order,
      })),
    });

    const pipeline = await this.repository.findById({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
    });

    if (!pipeline) {
      throw new PipelineNotFoundError(input.pipelineId);
    }

    return pipeline.stages;
  }
}

export class PipelineNotFoundError extends Error {
  constructor(pipelineId: string) {
    super(`Pipeline ${pipelineId} not found`);
    this.name = 'PipelineNotFoundError';
  }
}

export class StageNotFoundError extends Error {
  constructor(stageId: string) {
    super(`Stage ${stageId} not found`);
    this.name = 'StageNotFoundError';
  }
}

export const pipelinesService = new PipelinesService();
