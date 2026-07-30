import { Prisma } from '@prisma/client';
import type { CommercialTable } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import type { CommercialTableFiltersDto } from '../dto/commercial-table.dto.js';

type CommercialPrismaClient = typeof prisma | Prisma.TransactionClient;
export type CommercialTransactionClient = Prisma.TransactionClient;

const normalizeTextFilter = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const buildCommercialTableWhere = (
  tenantId: string,
  filters: CommercialTableFiltersDto = {},
): Prisma.CommercialTableWhereInput => {
  const search = normalizeTextFilter(filters.search);

  const where: Prisma.CommercialTableWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (filters.providerId) where.providerId = filters.providerId;
  if (filters.providerType) where.providerType = filters.providerType;
  if (filters.productId) where.productId = filters.productId;
  if (filters.subproductId) where.subproductId = filters.subproductId;
  if (filters.modality) where.modality = filters.modality;
  if (filters.active !== undefined) where.active = filters.active;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { providerName: { contains: search, mode: 'insensitive' } },
      { productName: { contains: search, mode: 'insensitive' } },
      { subproductName: { contains: search, mode: 'insensitive' } },
      { modalityLabel: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
};

const conditionOrderBy = [
  { term: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.CommercialConditionOrderByWithRelationInput[];

export const runCommercialSerializableTransaction = async <T>(
  action: (transaction: CommercialTransactionClient) => Promise<T>,
) => {
  return prisma.$transaction(action, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
};

export const commercialTableRepository = {
  findAll(
    tenantId: string,
    filters: CommercialTableFiltersDto = {},
    client: CommercialPrismaClient = prisma,
  ) {
    return client.commercialTable.findMany({
      where: buildCommercialTableWhere(tenantId, filters),
      include: {
        conditions: {
          where: {
            tenantId,
            deletedAt: null,
          },
          orderBy: conditionOrderBy,
        },
      },
      orderBy: [{ providerName: 'asc' }, { name: 'asc' }, { createdAt: 'desc' }],
    });
  },

  findById(
    tenantId: string,
    id: string,
    client: CommercialPrismaClient = prisma,
  ) {
    return client.commercialTable.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        conditions: {
          where: {
            tenantId,
            deletedAt: null,
          },
          orderBy: conditionOrderBy,
        },
      },
    });
  },

  create(
    client: CommercialPrismaClient,
    data: Prisma.CommercialTableUncheckedCreateInput,
  ): Promise<CommercialTable> {
    return client.commercialTable.create({
      data,
    });
  },

  update(
    client: CommercialPrismaClient,
    tenantId: string,
    id: string,
    data: Prisma.CommercialTableUncheckedUpdateInput,
  ) {
    return client.commercialTable.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data,
    });
  },

  softDelete(client: CommercialPrismaClient, tenantId: string, id: string) {
    return client.commercialTable.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  },
};
