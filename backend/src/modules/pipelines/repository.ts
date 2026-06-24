import { Prisma } from '@prisma/client';

import { prisma } from '../../core/prisma/client.js';
import { ConflictError } from '../../shared/errors/AppError.js';
import type {
  CreatePipelineInput,
} from './domain/pipeline.contract.js';
import type { PipelineRepositoryContract } from './domain/pipeline-repository.contract.js';

type PipelinesPrismaClient = typeof prisma | Prisma.TransactionClient;

type FindByIdInput = { tenantId: string; pipelineId: string };
type FindStageByIdInput = { tenantId: string; stageId: string };
type UpdatePipelineRepositoryInput = {
  tenantId: string;
  pipelineId: string;
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
};
type CreateStageRepositoryInput = {
  tenantId: string;
  pipelineId: string;
  name: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
};
type UpdateStageRepositoryInput = {
  tenantId: string;
  stageId: string;
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
};
type SoftDeletePipelineRepositoryInput = { tenantId: string; pipelineId: string; actorUserId?: string };
type SoftDeleteStageRepositoryInput = { tenantId: string; stageId: string; actorUserId?: string };
type ReorderStagesRepositoryInput = {
  tenantId: string;
  pipelineId: string;
  stages: Array<{ stageId: string; order: number }>;
};

const pipelineReadInclude = {
  stages: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      pipelineId: true,
      name: true,
      order: true,
      isWon: true,
      isLost: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
    orderBy: {
      order: 'asc',
    },
  },
} satisfies Prisma.PipelineInclude;

const stageReadSelect = {
  id: true,
  tenantId: true,
  pipelineId: true,
  name: true,
  order: true,
  isWon: true,
  isLost: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.StageSelect;

const runInTransaction = async <T>(
  client: PipelinesPrismaClient,
  action: (transaction: Prisma.TransactionClient) => Promise<T>,
) => {
  if (client === prisma) {
    return prisma.$transaction((transaction) => action(transaction));
  }

  return action(client);
};

const runInSerializableTransaction = async <T>(
  client: PipelinesPrismaClient,
  action: (transaction: Prisma.TransactionClient) => Promise<T>,
) => {
  if (client === prisma) {
    return prisma.$transaction(
      (transaction) => action(transaction),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  return action(client);
};

const clearOtherActiveDefaultPipelines = (
  transaction: Prisma.TransactionClient,
  tenantId: string,
  pipelineId: string,
) => {
  return transaction.pipeline.updateMany({
    where: {
      tenantId,
      deletedAt: null,
      isActive: true,
      isDefault: true,
      id: {
        not: pipelineId,
      },
    },
    data: {
      isDefault: false,
    },
  });
};

const listActiveByTenant = (
  tenantId: string,
  client: PipelinesPrismaClient = prisma,
) => {
  return client.pipeline.findMany({
    where: {
      tenantId,
      deletedAt: null,
      isActive: true,
    },
    include: pipelineReadInclude,
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' },
    ],
  });
};

export const pipelinesRepository = {
  listActiveByTenant,
  findActiveByTenant: listActiveByTenant,

  findById(
    input: FindByIdInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.pipeline.findFirst({
      where: {
        id: input.pipelineId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      include: pipelineReadInclude,
    });
  },

  findStageById(
    input: FindStageByIdInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.stage.findFirst({
      where: {
        id: input.stageId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      select: stageReadSelect,
    });
  },

  createPipeline(
    input: CreatePipelineInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    if (input.isDefault !== true) {
      return client.pipeline.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          description: input.description ?? null,
          isDefault: input.isDefault ?? false,
          isActive: input.isActive ?? true,
        },
        include: pipelineReadInclude,
      });
    }

    return runInSerializableTransaction(client, async (transaction) => {
      const pipeline = await transaction.pipeline.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          description: input.description ?? null,
          isDefault: true,
          isActive: input.isActive ?? true,
        },
        include: pipelineReadInclude,
      });

      await clearOtherActiveDefaultPipelines(
        transaction,
        input.tenantId,
        pipeline.id,
      );

      return pipeline;
    });
  },

  async updatePipeline(
    input: UpdatePipelineRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    if (input.isDefault === undefined) {
      await client.pipeline.updateMany({
        where: {
          id: input.pipelineId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
      return;
    }

    await runInSerializableTransaction(client, async (transaction) => {
      const existingPipeline = await transaction.pipeline.findFirst({
        where: {
          id: input.pipelineId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (
        input.isDefault === false &&
        existingPipeline?.isDefault === true
      ) {
        const activeDefaultCount = await transaction.pipeline.count({
          where: {
            tenantId: input.tenantId,
            deletedAt: null,
            isActive: true,
            isDefault: true,
          },
        });

        if (activeDefaultCount <= 1) {
          throw new ConflictError(
            'Tenant must keep one active default pipeline',
          );
        }
      }

      await transaction.pipeline.updateMany({
        where: {
          id: input.pipelineId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (input.isDefault === true && existingPipeline) {
        await clearOtherActiveDefaultPipelines(
          transaction,
          input.tenantId,
          input.pipelineId,
        );
      }
    });
  },

  async softDeletePipeline(
    input: SoftDeletePipelineRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    await client.pipeline.updateMany({
      where: {
        id: input.pipelineId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  createStage(
    input: CreateStageRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.stage.create({
      data: {
        tenantId: input.tenantId,
        pipelineId: input.pipelineId,
        name: input.name,
        order: input.order ?? 1,
        isWon: input.isWon ?? false,
        isLost: input.isLost ?? false,
      },
      select: stageReadSelect,
    });
  },

  async updateStage(
    input: UpdateStageRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    await client.stage.updateMany({
      where: {
        id: input.stageId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isWon !== undefined ? { isWon: input.isWon } : {}),
        ...(input.isLost !== undefined ? { isLost: input.isLost } : {}),
      },
    });
  },

  async softDeleteStage(
    input: SoftDeleteStageRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    await client.stage.updateMany({
      where: {
        id: input.stageId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async reorderStages(
    input: ReorderStagesRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    await runInTransaction(client, async (transaction) => {
      const updates = input.stages.map((stage) =>
        transaction.stage.updateMany({
          where: {
            id: stage.stageId,
            tenantId: input.tenantId,
            pipelineId: input.pipelineId,
            deletedAt: null,
          },
          data: {
            order: stage.order,
          },
        }),
      );

      return Promise.all(updates);
    });
  },
} satisfies PipelineRepositoryContract;
