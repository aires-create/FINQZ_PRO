import type { Prisma } from '@prisma/client';

import { prisma } from '../../core/prisma/client.js';

type PipelinesPrismaClient = typeof prisma | Prisma.TransactionClient;

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
};
