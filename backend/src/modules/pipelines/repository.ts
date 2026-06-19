import type { Prisma } from '@prisma/client';

import { prisma } from '../../core/prisma/client.js';
import type {
  CreatePipelineInput,
} from './domain/pipeline.contract.js';

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
type SoftDeletePipelineRepositoryInput = { tenantId: string; pipelineId: string };
type SoftDeleteStageRepositoryInput = { tenantId: string; stageId: string };
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
      name: true,
      order: true,
      isWon: true,
      isLost: true,
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

export const pipelinesRepository = {
  findActiveByTenant(tenantId: string, client: PipelinesPrismaClient = prisma) {
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
  },

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
  },

  updatePipeline(
    input: UpdatePipelineRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.pipeline.updateMany({
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
  },

  softDeletePipeline(
    input: SoftDeletePipelineRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.pipeline.updateMany({
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

  updateStage(
    input: UpdateStageRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.stage.updateMany({
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

  softDeleteStage(
    input: SoftDeleteStageRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return client.stage.updateMany({
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

  reorderStages(
    input: ReorderStagesRepositoryInput,
    client: PipelinesPrismaClient = prisma,
  ) {
    return runInTransaction(client, async (transaction) => {
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
};
