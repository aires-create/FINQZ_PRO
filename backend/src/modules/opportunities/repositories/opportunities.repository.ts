import type { Opportunity, Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';

type OpportunitiesPrismaClient = typeof prisma | Prisma.TransactionClient;

export type FindManyOpportunitiesParams = {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  pipelineId?: string;
  stageId?: string;
  customerId?: string;
  leadId?: string;
  ownerId?: string;
  partnerId?: string;
};

const normalizeTextFilter = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const buildOpportunityWhere = (
  params: FindManyOpportunitiesParams,
): Prisma.OpportunityWhereInput => {
  const search = normalizeTextFilter(params.search);

  const where: Prisma.OpportunityWhereInput = {
    tenantId: params.tenantId,
    deletedAt: null,
  };

  if (params.status) where.status = params.status;
  if (params.pipelineId) where.pipelineId = params.pipelineId;
  if (params.stageId) where.stageId = params.stageId;
  if (params.customerId) where.customerId = params.customerId;
  if (params.leadId) where.leadId = params.leadId;
  if (params.ownerId) where.ownerId = params.ownerId;
  if (params.partnerId) where.partnerId = params.partnerId;

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Enforce tenant-safe relational consistency for read operations.
  where.pipeline = {
    is: {
      tenantId: params.tenantId,
      deletedAt: null,
    },
  };

  where.stage = {
    is: {
      tenantId: params.tenantId,
      deletedAt: null,
    },
  };

  return where;
};

const opportunitiesReadInclude = {
  product: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  subproduct: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  modality: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  pipeline: {
    select: {
      id: true,
      name: true,
    },
  },
  stage: {
    select: {
      id: true,
      name: true,
      order: true,
      isWon: true,
      isLost: true,
    },
  },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.OpportunityInclude;

export const opportunitiesRepository = {
  async findMany(
    params: FindManyOpportunitiesParams,
    client: OpportunitiesPrismaClient = prisma,
  ) {
    const skip = (params.page - 1) * params.limit;
    const where = buildOpportunityWhere(params);
    const data = await client.opportunity.findMany({
      where,
      skip,
      take: params.limit,
      include: opportunitiesReadInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
    const total = await client.opportunity.count({
      where,
    });

    return {
      data,
      total,
    };
  },

  findById(
    id: string,
    tenantId: string,
    client: OpportunitiesPrismaClient = prisma,
  ) {
    return client.opportunity.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        pipeline: {
          is: {
            tenantId,
            deletedAt: null,
          },
        },
        stage: {
          is: {
            tenantId,
            deletedAt: null,
          },
        },
      },
      include: opportunitiesReadInclude,
    });
  },

  create(
    data: Prisma.OpportunityUncheckedCreateInput,
    client: OpportunitiesPrismaClient = prisma,
  ): Promise<Opportunity> {
    return client.opportunity.create({
      data,
    });
  },

  update(
    id: string,
    tenantId: string,
    data: Prisma.OpportunityUncheckedUpdateInput,
    client: OpportunitiesPrismaClient = prisma,
  ) {
    return client.opportunity.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data,
    });
  },

  moveStage(
    id: string,
    tenantId: string,
    data: Pick<Prisma.OpportunityUncheckedUpdateInput, 'stageId' | 'pipelineId'>,
    client: OpportunitiesPrismaClient = prisma,
  ) {
    return client.opportunity.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data,
    });
  },

  softDelete(
    id: string,
    tenantId: string,
    client: OpportunitiesPrismaClient = prisma,
  ) {
    return client.opportunity.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },
};
