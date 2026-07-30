import type { Prisma } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const userWithTenantAndRolesInclude = {
  tenant: true,
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

const sessionUserInclude = {
  tenant: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  userRoles: {
    orderBy: {
      assignedAt: 'desc',
    },
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
} satisfies Prisma.UserInclude;

const userForPasswordChangeSelect = {
  id: true,
  password: true,
  tenantId: true,
  isActive: true,
  deletedAt: true,
  email: true,
} satisfies Prisma.UserSelect;

export class AuthRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async findUserByEmail(email: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).user.findFirst({
      where: {
        emailNormalized: email.toLowerCase().trim(),
      },
      include: userWithTenantAndRolesInclude,
    });
  }

  async findActiveUserByEmail(email: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).user.findFirst({
      where: {
        emailNormalized: email.toLowerCase().trim(),
        isActive: true,
        deletedAt: null,
      },
      include: userWithTenantAndRolesInclude,
    });
  }

  async findActiveTenant(client?: Prisma.TransactionClient) {
    return this.getClient(client).tenant.findFirst({
      where: { isActive: true },
    });
  }

  async createTenant(
    data: {
      name: string;
      domain?: string | null;
      isActive?: boolean;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).tenant.create({
      data: {
        name: data.name,
        domain: data.domain ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findRoleByTenantAndSlug(
    tenantId: string,
    slug: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.findFirst({
      where: {
        tenantId,
        slug,
      },
    });
  }

  async createRole(
    data: {
      tenantId: string;
      name: string;
      slug: string;
      description?: string | null;
      isSystem?: boolean;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async createUserWithRole(
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
        tenant: { connect: { id: data.tenantId } },
        userRoles: {
          create: {
            tenant: { connect: { id: data.tenantId } },
            role: { connect: { id: data.roleId } },
          },
        },
        isActive: data.isActive ?? true,
      },
      include: userWithTenantAndRolesInclude,
    });
  }

  async findUserRoleByUserId(
    userId: string,
    tenantId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).userRole.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async touchUserLastLogin(userId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async findRefreshToken(token: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).refreshToken.findUnique({
      where: { token },
    });
  }

  async createRefreshToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).refreshToken.create({
      data,
    });
  }

  async revokeRefreshToken(
    token: string,
    revokedReason: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
        revokedReason,
      },
    });
  }

  async revokeRefreshTokensForUser(
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

  async findUserById(
    userId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findUnique({
      where: { id: userId },
      select: userForPasswordChangeSelect,
    });
  }

  async updateUserPassword(
    userId: string,
    password: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.update({
      where: { id: userId },
      data: {
        password,
        updatedAt: new Date(),
      },
    });
  }

  async findUserForSession(
    userId: string,
    tenantId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        organizationId: true,
        partnerId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        userRoles: {
          orderBy: {
            assignedAt: 'desc',
          },
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
      },
    });
  }

  async findUserForTenantContext(
    userId: string,
    tenantId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        tenantId: true,
        organizationId: true,
        partnerId: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
          },
        },
      },
    });
  }
}

export const authRepository = new AuthRepository();
