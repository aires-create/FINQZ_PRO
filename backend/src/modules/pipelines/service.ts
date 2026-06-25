import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { prisma } from '../../core/prisma/client.js';
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

const createReorderValidationError = (message: string) => {
  return new ZodError([
    {
      code: 'custom',
      message,
      path: ['stages'],
    },
  ]);
};

const validateReorderStagesPayload = (
  stages: ReorderStagesInput['stages'],
  currentStages: PipelineContract['stages'],
) => {
  if (stages.length !== currentStages.length) {
    throw createReorderValidationError(
      'Reorder payload must include every non-archived stage exactly once',
    );
  }

  const currentStageIds = new Set(currentStages.map((stage) => stage.id));
  const seenStageIds = new Set<string>();
  const seenOrders = new Set<number>();

  for (const stage of stages) {
    if (!currentStageIds.has(stage.id)) {
      throw createReorderValidationError(
        'Reorder payload contains a stage that does not belong to the pipeline or is archived',
      );
    }

    if (seenStageIds.has(stage.id)) {
      throw createReorderValidationError('Stage ids must be unique');
    }

    if (seenOrders.has(stage.order)) {
      throw createReorderValidationError('Stage orders must be unique');
    }

    seenStageIds.add(stage.id);
    seenOrders.add(stage.order);
  }

  for (const stageId of currentStageIds) {
    if (!seenStageIds.has(stageId)) {
      throw createReorderValidationError(
        'Reorder payload must include every non-archived stage exactly once',
      );
    }
  }

  const expectedOrders = new Set(
    Array.from({ length: currentStages.length }, (_, index) => index + 1),
  );

  if (seenOrders.size !== expectedOrders.size) {
    throw createReorderValidationError('Stage orders must be contiguous integers starting at 1');
  }

  for (const order of seenOrders) {
    if (!expectedOrders.has(order)) {
      throw createReorderValidationError('Stage orders must be contiguous integers starting at 1');
    }
  }
};

type PipelinesRepositoryWithClient = PipelineRepositoryContract & {
  findById(
    input: Parameters<PipelineRepositoryContract['findById']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['findById']>;
  findStageById(
    input: Parameters<PipelineRepositoryContract['findStageById']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['findStageById']>;
  updateStage(
    input: Parameters<PipelineRepositoryContract['updateStage']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['updateStage']>;
  softDeleteStage(
    input: Parameters<PipelineRepositoryContract['softDeleteStage']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['softDeleteStage']>;
  hasLinkedOpportunitiesForStage(
    input: Parameters<PipelineRepositoryContract['hasLinkedOpportunitiesForStage']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['hasLinkedOpportunitiesForStage']>;
  countActiveStagesByPipeline(
    input: Parameters<PipelineRepositoryContract['countActiveStagesByPipeline']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['countActiveStagesByPipeline']>;
  reorderStages(
    input: Parameters<PipelineRepositoryContract['reorderStages']>[0],
    client?: Prisma.TransactionClient,
  ): ReturnType<PipelineRepositoryContract['reorderStages']>;
};

const runInSerializableTransaction = async <T>(
  action: (transaction: Prisma.TransactionClient) => Promise<T>,
) => {
  return prisma.$transaction(action, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
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

    return runInSerializableTransaction(async (transaction) => {
      const repository = this.repository as PipelinesRepositoryWithClient;

      const currentStage = await repository.findStageById(
        {
          tenantId: input.tenantId,
          stageId: input.id,
        },
        transaction,
      );

      if (!currentStage) {
        throw new StageNotFoundError(input.id);
      }

      if (input.isActive === false && currentStage.isActive !== false) {
        const activeStagesCount = await repository.countActiveStagesByPipeline(
          {
            tenantId: input.tenantId,
            pipelineId: currentStage.pipelineId,
          },
          transaction,
        );

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

      await repository.updateStage(payload, transaction);

      const stage = await repository.findStageById(
        {
          tenantId: input.tenantId,
          stageId: input.id,
        },
        transaction,
      );

      if (!stage) {
        throw new StageNotFoundError(input.id);
      }

      return stage;
    });
  }

  async deactivateStage(
    input: DeactivateStageServiceInput,
  ): Promise<void> {
    await runInSerializableTransaction(async (transaction) => {
      const repository = this.repository as PipelinesRepositoryWithClient;

      const currentStage = await repository.findStageById(
        {
          tenantId: input.tenantId,
          stageId: input.stageId,
        },
        transaction,
      );

      if (!currentStage) {
        throw new StageNotFoundError(input.stageId);
      }

      if (currentStage.isActive) {
        const activeStagesCount = await repository.countActiveStagesByPipeline(
          {
            tenantId: input.tenantId,
            pipelineId: currentStage.pipelineId,
          },
          transaction,
        );

        if (activeStagesCount <= 1) {
          throw new PipelineMustKeepOneActiveStageError(
            'Pipeline must keep one active stage',
          );
        }
      }

      const hasLinkedOpportunities = await repository.hasLinkedOpportunitiesForStage(
        {
          tenantId: input.tenantId,
          stageId: input.stageId,
        },
        transaction,
      );

      if (hasLinkedOpportunities) {
        throw new StageInUseError(input.stageId);
      }

      await repository.softDeleteStage(
        {
          tenantId: input.tenantId,
          stageId: input.stageId,
          actorUserId: input.actorUserId,
        },
        transaction,
      );
    });
  }

  async reorderStages(
    input: ReorderStagesServiceInput,
  ): Promise<PipelineContract['stages']> {
    return runInSerializableTransaction(async (transaction) => {
      const repository = this.repository as PipelinesRepositoryWithClient;

      const pipeline = await repository.findById(
        {
          tenantId: input.tenantId,
          pipelineId: input.pipelineId,
        },
        transaction,
      );

      if (!pipeline) {
        throw new PipelineNotFoundError(input.pipelineId);
      }

      validateReorderStagesPayload(input.stages, pipeline.stages);

      const normalizedStages = [...input.stages]
        .sort((left, right) => {
          if (left.order !== right.order) return left.order - right.order;
          return left.id.localeCompare(right.id);
        })
        .map((stage) => ({
          stageId: stage.id,
          order: stage.order,
        }));

      await repository.reorderStages(
        {
          tenantId: input.tenantId,
          pipelineId: input.pipelineId,
          stages: normalizedStages,
        },
        transaction,
      );

      const updatedPipeline = await repository.findById(
        {
          tenantId: input.tenantId,
          pipelineId: input.pipelineId,
        },
        transaction,
      );

      if (!updatedPipeline) {
        throw new PipelineNotFoundError(input.pipelineId);
      }

      return updatedPipeline.stages;
    });
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
