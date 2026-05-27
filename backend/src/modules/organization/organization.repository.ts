import type { Prisma } from '@prisma/client';

import { prisma } from '../../core/prisma/client.js';
import type {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from './organization.schema.js';

type OrganizationPrismaClient = typeof prisma | Prisma.TransactionClient;

const organizationInclude = {
  parent: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
    },
  },
  children: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      level: true,
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  },
  _count: {
    select: {
      users: true,
      memberships: {
        where: {
          isActive: true,
          deletedAt: null,
        },
      },
    },
  },
} satisfies Prisma.OrganizationInclude;

const buildOrganizationWhere = (
  tenantId: string,
  query: ListOrganizationsQueryDto,
): Prisma.OrganizationWhereInput => {
  const where: Prisma.OrganizationWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (query.parentId) where.parentId = query.parentId;
  if (query.type) where.type = query.type;
  if (query.level) where.level = query.level;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
};

export const organizationRepository = {
  async findManyByTenant(
    tenantId: string,
    query: ListOrganizationsQueryDto,
    client: OrganizationPrismaClient = prisma,
  ) {
    const where = buildOrganizationWhere(tenantId, query);
    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      client.organization.findMany({
        where,
        include: organizationInclude,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip,
        take: query.limit,
      }),
      client.organization.count({ where }),
    ]);

    return { data, total };
  },

  findById(
    tenantId: string,
    organizationId: string,
    client: OrganizationPrismaClient = prisma,
  ) {
    return client.organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      include: organizationInclude,
    });
  },

  findByCode(
    tenantId: string,
    code: string,
    client: OrganizationPrismaClient = prisma,
  ) {
    return client.organization.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
      select: {
        id: true,
      },
    });
  },

  create(
    tenantId: string,
    data: CreateOrganizationDto,
    level: number,
    client: OrganizationPrismaClient = prisma,
  ) {
    const createData: Prisma.OrganizationUncheckedCreateInput = {
      tenantId,
      name: data.name,
      code: data.code,
      type: data.type,
      level,
    };

    if (data.description !== undefined) createData.description = data.description;
    if (data.parentId) createData.parentId = data.parentId;
    if (data.settings !== undefined) {
      createData.settings = data.settings as Prisma.InputJsonValue;
    }

    return client.organization.create({
      data: createData,
      include: organizationInclude,
    });
  },

  update(
    tenantId: string,
    organizationId: string,
    data: UpdateOrganizationDto,
    client: OrganizationPrismaClient = prisma,
  ) {
    const updateData: Prisma.OrganizationUncheckedUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.settings !== undefined) {
      updateData.settings = data.settings as Prisma.InputJsonValue;
    }

    return client.organization.updateMany({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      data: updateData,
    });
  },

  countActiveMemberships(
    tenantId: string,
    organizationId: string,
    client: OrganizationPrismaClient = prisma,
  ) {
    return client.membership.count({
      where: {
        tenantId,
        organizationId,
        isActive: true,
        deletedAt: null,
      },
    });
  },

  countActiveChildren(
    tenantId: string,
    organizationId: string,
    client: OrganizationPrismaClient = prisma,
  ) {
    return client.organization.count({
      where: {
        tenantId,
        parentId: organizationId,
        isActive: true,
        deletedAt: null,
      },
    });
  },

  softDelete(
    tenantId: string,
    organizationId: string,
    client: OrganizationPrismaClient = prisma,
  ) {
    return client.organization.updateMany({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  },
};
