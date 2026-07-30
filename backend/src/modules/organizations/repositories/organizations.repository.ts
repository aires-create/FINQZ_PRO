import type { Prisma } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const organizationInclude = {
  parent: {
    select: { id: true, name: true, code: true, type: true },
  },
  children: {
    where: { deletedAt: null },
    select: { id: true, name: true, code: true, type: true, level: true },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  },
  _count: {
    select: {
      users: true,
      memberships: { where: { isActive: true, deletedAt: null } },
    },
  },
} satisfies Prisma.OrganizationInclude;

const organizationTreeInclude = {
  _count: {
    select: {
      users: true,
      memberships: { where: { isActive: true, deletedAt: null } },
    },
  },
} satisfies Prisma.OrganizationInclude;

export class OrganizationsRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async listByTenant(
    tenantId: string,
    query: {
      parentId?: string;
      type?: Prisma.OrganizationWhereInput['type'];
      level?: number;
      search?: string;
      page: number;
      limit: number;
    },
    client?: Prisma.TransactionClient,
  ) {
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

    const skip = (query.page - 1) * query.limit;
    const db = this.getClient(client);

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        include: organizationInclude,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip,
        take: query.limit,
      }),
      db.organization.count({ where }),
    ]);

    return { organizations, total };
  }

  async listTree(tenantId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).organization.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: organizationTreeInclude,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(tenantId: string, organizationId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      include: {
        ...organizationInclude,
        memberships: {
          where: { isActive: true, deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                isActive: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
  }

  async findByTenantAndCode(tenantId: string, code: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).organization.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
    });
  }

  async findParent(tenantId: string, parentId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).organization.findFirst({
      where: {
        id: parentId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async create(
    data: Prisma.OrganizationUncheckedCreateInput,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.create({
      data,
      include: organizationInclude,
    });
  }

  async findExistingForUpdate(
    tenantId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async update(
    organizationId: string,
    data: Prisma.OrganizationUncheckedUpdateInput,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.update({
      where: { id: organizationId },
      data,
      include: organizationInclude,
    });
  }

  async findActiveOrganization(
    tenantId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
  }

  async countActiveMemberships(
    tenantId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.count({
      where: {
        organizationId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async countActiveChildren(
    tenantId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.count({
      where: {
        parentId: organizationId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async softDelete(organizationId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).organization.update({
      where: { id: organizationId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

export const organizationsRepository = new OrganizationsRepository();
