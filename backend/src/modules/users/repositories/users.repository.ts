import type { Prisma, User } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const userWithRolesSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UsersRepositoryUser = Prisma.UserGetPayload<{
  select: typeof userWithRolesSelect;
}>;

export class UsersRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async listByTenant(tenantId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).user.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: userWithRolesSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(
    tenantId: string,
    id: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        emailNormalized: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  async findByEmailNormalized(
    tenantId: string,
    emailNormalized: string,
    excludeId?: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        tenantId,
        emailNormalized,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    });
  }

  async findTargetForReset(
    tenantId: string,
    id: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async create(
    data: {
      tenantId: string;
      email: string;
      emailNormalized: string;
      password: string;
      firstName: string;
      lastName: string;
      roleId: string;
      isActive?: boolean;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.create({
      data: {
        email: data.email,
        emailNormalized: data.emailNormalized,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tenant: {
          connect: {
            id: data.tenantId,
          },
        },
        userRoles: {
          create: {
            tenant: {
              connect: {
                id: data.tenantId,
              },
            },
            role: {
              connect: {
                id: data.roleId,
              },
            },
          },
        },
        isActive: data.isActive ?? true,
      },
      select: userWithRolesSelect,
    });
  }

  async update(
    id: string,
    data: {
      email?: string;
      emailNormalized?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.update({
      where: { id },
      data,
      select: userWithRolesSelect,
    });
  }

  async updatePassword(
    id: string,
    password: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.update({
      where: { id },
      data: {
        password,
        updatedAt: new Date(),
      },
    });
  }

  async findRoleByTenantAndSlugOrName(
    tenantId: string,
    slug: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.findFirst({
      where: {
        tenantId,
        OR: [
          { slug },
          { name: slug },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });
  }

  async revokeRefreshTokens(
    userId: string,
    revokedReason: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason,
      },
    });
  }
}

export const usersRepository = new UsersRepository();
