import { Prisma } from '@prisma/client';
import type { Opportunity } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import type { CreateCustomerRepositoryInput } from '../../crm/repositories/customers.repository.js';

type OpportunitiesPrismaClient = typeof prisma | Prisma.TransactionClient;
export type OpportunitiesTransactionClient = Prisma.TransactionClient;

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

const normalizeJsonInput = (
  value?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null,
) => {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value;
};

export const runOpportunitiesSerializableTransaction = async <T>(
  action: (transaction: OpportunitiesTransactionClient) => Promise<T>,
) => {
  return prisma.$transaction(action, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
};

export const findPipelineById = (
  tenantId: string,
  pipelineId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.pipeline.findFirst({
    where: {
      id: pipelineId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findPipelineTenantScope = (
  pipelineId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.pipeline.findFirst({
    where: {
      id: pipelineId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findStageById = (
  tenantId: string,
  stageId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.stage.findFirst({
    where: {
      id: stageId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      pipelineId: true,
      isActive: true,
    },
  });
};

export const findStageTenantScope = (
  stageId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.stage.findFirst({
    where: {
      id: stageId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findCustomerById = (
  tenantId: string,
  customerId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.customer.findFirst({
    where: {
      id: customerId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findCustomerTenantScope = (
  customerId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.customer.findFirst({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findLeadById = (
  tenantId: string,
  leadId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.lead.findFirst({
    where: {
      id: leadId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findLeadTenantScope = (
  leadId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.lead.findFirst({
    where: {
      id: leadId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findProductById = (
  tenantId: string,
  productId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogProduct.findFirst({
    where: {
      id: productId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findProductTenantScope = (
  productId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogProduct.findFirst({
    where: {
      id: productId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findSubproductById = (
  tenantId: string,
  subproductId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogSubproduct.findFirst({
    where: {
      id: subproductId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      productId: true,
    },
  });
};

export const findSubproductTenantScope = (
  subproductId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogSubproduct.findFirst({
    where: {
      id: subproductId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findModalityById = (
  tenantId: string,
  modalityId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogModality.findFirst({
    where: {
      id: modalityId,
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      subproductId: true,
    },
  });
};

export const findModalityTenantScope = (
  modalityId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.masterCatalogModality.findFirst({
    where: {
      id: modalityId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const findOpportunityTenantScope = (
  opportunityId: string,
  client: OpportunitiesPrismaClient = prisma,
) => {
  return client.opportunity.findFirst({
    where: { id: opportunityId },
    select: {
      id: true,
      tenantId: true,
    },
  });
};

export const createCustomerInTransaction = (
  data: CreateCustomerRepositoryInput,
  client: OpportunitiesPrismaClient,
) => {
  return client.customer.create({
    data: {
      ...data,
      address: normalizeJsonInput(data.address),
      bankData: normalizeJsonInput(data.bankData),
    },
  });
};

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
