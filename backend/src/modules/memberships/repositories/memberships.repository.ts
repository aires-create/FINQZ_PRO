import type { Prisma } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const membershipInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      jobTitle: true,
      isActive: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      level: true,
      parent: {
        select: { id: true, name: true, code: true },
      },
    },
  },
  invitedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.MembershipInclude;

const organizationSummarySelect = {
  id: true,
  name: true,
  code: true,
  type: true,
  level: true,
  parent: {
    select: { id: true, name: true, code: true },
  },
} satisfies Prisma.OrganizationSelect;

export class MembershipsRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async listMemberships(
    tenantId: string,
    query: {
      organizationId?: string;
      userId?: string;
      role?: string;
      status?: 'active' | 'inactive';
      page: number;
      limit: number;
    },
    client?: Prisma.TransactionClient,
  ) {
    const where: Prisma.MembershipWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.userId) where.userId = query.userId;
    if (query.role) where.role = query.role;
    if (query.status) where.isActive = query.status === 'active';

    const skip = (query.page - 1) * query.limit;
    const db = this.getClient(client);

    const [memberships, total] = await Promise.all([
      db.membership.findMany({
        where,
        include: membershipInclude,
        orderBy: { joinedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      db.membership.count({ where }),
    ]);

    return { memberships, total };
  }

  async listUserMemberships(tenantId: string, userId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).membership.findMany({
      where: {
        tenantId,
        userId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        organization: {
          select: organizationSummarySelect,
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async findById(
    tenantId: string,
    membershipId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.findFirst({
      where: {
        id: membershipId,
        tenantId,
        deletedAt: null,
      },
      include: membershipInclude,
    });
  }

  async findUser(
    tenantId: string,
    userId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async findOrganization(
    tenantId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async findActorMembership(
    userId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  async findExistingMembership(
    userId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  async create(
    data: Prisma.MembershipUncheckedCreateInput,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.create({
      data,
      include: membershipInclude,
    });
  }

  async update(
    membershipId: string,
    data: Prisma.MembershipUncheckedUpdateInput,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.update({
      where: { id: membershipId },
      data,
      include: membershipInclude,
    });
  }

  async updateUserOrganization(
    userId: string,
    organizationId: string | null,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.update({
      where: { id: userId },
      data: { organizationId },
    });
  }

  async findUserById(userId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
  }

  async findReplacementMembership(
    tenantId: string,
    userId: string,
    organizationId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.findFirst({
      where: {
        userId,
        tenantId,
        isActive: true,
        deletedAt: null,
        organizationId: { not: organizationId },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async softDelete(membershipId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).membership.update({
      where: { id: membershipId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async activate(membershipId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).membership.update({
      where: { id: membershipId },
      data: {
        isActive: true,
        joinedAt: new Date(),
      },
      include: membershipInclude,
    });
  }

  async countOwners(
    tenantId: string,
    organizationId: string,
    excludedMembershipId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).membership.count({
      where: {
        tenantId,
        organizationId,
        id: { not: excludedMembershipId },
        role: 'owner',
        isActive: true,
        deletedAt: null,
      },
    });
  }
}

export const membershipsRepository = new MembershipsRepository();
