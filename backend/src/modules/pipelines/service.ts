import { pipelinesRepository } from './repository.js';
import { ConflictError } from '../../shared/errors/AppError.js';
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
    return this.repository.listByTenant({
      tenantId: input.tenantId,
      ...(input.includeInactive !== undefined ? { includeInactive: input.includeInactive } : {}),
    });
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

    const currentPipeline = await this.repository.findById({
      tenantId: input.tenantId,
      pipelineId: input.id,
    });

    if (!currentPipeline) {
      throw new PipelineNotFoundError(input.id);
    }

    if (input.isActive === false) {
      if (currentPipeline.isDefault) {
        throw new PipelineDefaultLifecycleError('Default pipeline cannot be inactivated');
      }

      if (currentPipeline.isActive) {
        const activeCount = await this.repository.countActiveByTenant({
          tenantId: input.tenantId,
        });

        if (activeCount <= 1) {
          throw new LastActivePipelineError('Tenant must keep one active pipeline');
        }
      }
    }

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
    const currentPipeline = await this.repository.findById({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
    });

    if (!currentPipeline) {
      throw new PipelineNotFoundError(input.pipelineId);
    }

    if (currentPipeline.isDefault) {
      throw new PipelineDefaultLifecycleError('Default pipeline cannot be archived');
    }

    if (currentPipeline.isActive) {
      const activeCount = await this.repository.countActiveByTenant({
        tenantId: input.tenantId,
      });

      if (activeCount <= 1) {
        throw new LastActivePipelineError('Tenant must keep one active pipeline');
      }
    }

    const hasLinkedOpportunities = await this.repository.hasLinkedOpportunitiesForPipeline({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
    });

    if (hasLinkedOpportunities) {
      throw new PipelineInUseError(input.pipelineId);
    }

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

    const pipeline = await this.repository.findById({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
    });

    if (!pipeline) {
      throw new PipelineNotFoundError(input.pipelineId);
    }

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

    const currentStage = await this.repository.findStageById({
      tenantId: input.tenantId,
      stageId: input.id,
    });

    if (!currentStage) {
      throw new StageNotFoundError(input.id);
    }

    if (input.isActive === false && currentStage.isActive !== false) {
      const activeStagesCount = await this.repository.countActiveStagesByPipeline({
        tenantId: input.tenantId,
        pipelineId: currentStage.pipelineId,
      });

      if (activeStagesCount <= 1) {
        throw new PipelineMustKeepOneActiveStageError(
          'Pipeline must keep one active stage',
        );
      }
    }

    const payload = {
      tenantId: input.tenantId,
      stageId: input.id,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.isWon !== undefined ? { isWon: input.isWon } : {}),
      ...(input.isLost !== undefined ? { isLost: input.isLost } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
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
    const currentStage = await this.repository.findStageById({
      tenantId: input.tenantId,
      stageId: input.stageId,
    });

    if (!currentStage) {
      throw new StageNotFoundError(input.stageId);
    }

    if (currentStage.isActive) {
      const activeStagesCount = await this.repository.countActiveStagesByPipeline({
        tenantId: input.tenantId,
        pipelineId: currentStage.pipelineId,
      });

      if (activeStagesCount <= 1) {
        throw new PipelineMustKeepOneActiveStageError(
          'Pipeline must keep one active stage',
        );
      }
    }

    const hasLinkedOpportunities = await this.repository.hasLinkedOpportunitiesForStage({
      tenantId: input.tenantId,
      stageId: input.stageId,
    });

    if (hasLinkedOpportunities) {
      throw new StageInUseError(input.stageId);
    }

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

export class PipelineInUseError extends ConflictError {
  constructor(pipelineId: string) {
    super(`Pipeline ${pipelineId} has linked opportunities`);
    this.name = 'PipelineInUseError';
  }
}

export class PipelineDefaultLifecycleError extends ConflictError {
  constructor(message: string) {
    super(message);
    this.name = 'PipelineDefaultLifecycleError';
  }
}

export class LastActivePipelineError extends ConflictError {
  constructor(message: string) {
    super(message);
    this.name = 'LastActivePipelineError';
  }
}

export class StageInUseError extends ConflictError {
  constructor(stageId: string) {
    super(`Stage ${stageId} has linked opportunities`);
    this.name = 'StageInUseError';
  }
}

export class PipelineMustKeepOneActiveStageError extends ConflictError {
  constructor(message: string) {
    super(message);
    this.name = 'PipelineMustKeepOneActiveStageError';
  }
}

export const pipelinesService = new PipelinesService();
