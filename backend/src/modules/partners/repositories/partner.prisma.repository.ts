import { Prisma, type Partner } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { tenantFilter } from '../../../core/prisma/filters.js';
import type {
  PartnerRepositoryContract,
  PartnerRepositoryCountActiveChildrenInput,
  PartnerRepositoryCreateInput,
  PartnerRepositoryFindByCodeInput,
  PartnerRepositoryFindByIdInput,
  PartnerRepositoryListInput,
  PartnerRepositoryListResult,
  PartnerRepositorySoftDeleteInput,
  PartnerRepositoryUpdateInput,
} from './partner.repository.contract.js';

type PartnerPrismaClient = typeof prisma | Prisma.TransactionClient;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const trimSearch = (value?: string): string | undefined => {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
};

const buildPartnerWhere = (input: {
  tenantId: string;
  status?: string;
  parentId?: string | null;
  search?: string;
}): Prisma.PartnerWhereInput => {
  const where: Prisma.PartnerWhereInput = {
    ...tenantFilter(input.tenantId),
    deletedAt: null,
  };

  if (input.status) {
    where.status = input.status;
  }

  if (input.parentId !== undefined) {
    where.parentId = input.parentId;
  }

  const search = trimSearch(input.search);

  if (search) {
    where.OR = [
      {
        code: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        document: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

const buildCreateData = (
  input: PartnerRepositoryCreateInput,
): Prisma.PartnerUncheckedCreateInput => {
  const data: Prisma.PartnerUncheckedCreateInput = {
    tenantId: input.tenantId,
    code: input.code,
    name: input.name,
    type: input.type,
  };

  if (input.document !== undefined) {
    data.document = input.document;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.phone !== undefined) {
    data.phone = input.phone;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.parentId !== undefined) {
    data.parentId = input.parentId;
  }

  return data;
};

const buildUpdateData = (
  input: PartnerRepositoryUpdateInput['data'],
): Prisma.PartnerUncheckedUpdateManyInput => {
  const data: Prisma.PartnerUncheckedUpdateManyInput = {};

  if (input.code !== undefined) {
    data.code = input.code;
  }

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.document !== undefined) {
    data.document = input.document;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.phone !== undefined) {
    data.phone = input.phone;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.parentId !== undefined) {
    data.parentId = input.parentId;
  }

  return data;
};

export class PartnerPrismaRepository implements PartnerRepositoryContract {
  constructor(private readonly client: PartnerPrismaClient = prisma) {}

  async findById(
    input: PartnerRepositoryFindByIdInput,
  ): Promise<Partner | null> {
    return this.client.partner.findFirst({
      where: {
        id: input.partnerId,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
    });
  }

  async findByCode(
    input: PartnerRepositoryFindByCodeInput,
  ): Promise<Partner | null> {
    return this.client.partner.findFirst({
      where: {
        code: input.code,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
    });
  }

  async listByTenant(
    input: PartnerRepositoryListInput,
  ): Promise<PartnerRepositoryListResult> {
    const page = input.page ?? DEFAULT_PAGE;
    const limit = input.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = buildPartnerWhere(input);

    const [data, total] = await Promise.all([
      this.client.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { name: 'asc' },
          { code: 'asc' },
        ],
      }),
      this.client.partner.count({
        where,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async create(
    input: PartnerRepositoryCreateInput,
  ): Promise<Partner> {
    return this.client.partner.create({
      data: buildCreateData(input),
    });
  }

  async update(
    input: PartnerRepositoryUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return this.client.partner.updateMany({
      where: {
        id: input.partnerId,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
      data: buildUpdateData(input.data),
    });
  }

  async softDelete(
    input: PartnerRepositorySoftDeleteInput,
  ): Promise<Prisma.BatchPayload> {
    return this.client.partner.updateMany({
      where: {
        id: input.partnerId,
        ...tenantFilter(input.tenantId),
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countActiveChildren(
    input: PartnerRepositoryCountActiveChildrenInput,
  ): Promise<number> {
    return this.client.partner.count({
      where: {
        ...tenantFilter(input.tenantId),
        parentId: input.parentId,
        deletedAt: null,
      },
    });
  }
}

export const partnerPrismaRepository = new PartnerPrismaRepository();
