import type { Prisma, Role } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

const roleWithPermissionsInclude = {
  rolePermissions: {
    select: {
      permission: {
        select: {
          id: true,
          name: true,
          slug: true,
          resource: true,
          action: true,
        },
      },
    },
  },
} satisfies Prisma.RoleInclude;

const roleListInclude = {
  ...roleWithPermissionsInclude,
} satisfies Prisma.RoleInclude;

export type RolesRepositoryRole = Prisma.RoleGetPayload<{
  include: typeof roleWithPermissionsInclude;
}>;

export class RolesRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async findByTenantAndSlug(
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

  async findByTenantAndSlugOrName(
    tenantId: string,
    value: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.findFirst({
      where: {
        tenantId,
        OR: [
          { slug: value },
          { name: value },
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

  async create(
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
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        tenantId: data.tenantId,
        isSystem: data.isSystem ?? false,
      },
      include: roleWithPermissionsInclude,
    });
  }

  async findById(
    tenantId: string,
    roleId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.findFirst({
      where: {
        id: roleId,
        tenantId,
      },
      include: roleWithPermissionsInclude,
    });
  }

  async listByTenant(
    tenantId: string,
    skip: number,
    take: number,
    client?: Prisma.TransactionClient,
  ) {
    const [roles, total] = await Promise.all([
      this.getClient(client).role.findMany({
        where: { tenantId, deletedAt: null },
        include: roleListInclude,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.getClient(client).role.count({
        where: { tenantId, deletedAt: null },
      }),
    ]);

    return { roles, total };
  }

  async update(
    tenantId: string,
    roleId: string,
    data: {
      name?: string;
      description?: string | null;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.update({
      where: { id: roleId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: roleWithPermissionsInclude,
    });
  }

  async softDelete(
    tenantId: string,
    roleId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.update({
      where: { id: roleId },
      data: { deletedAt: new Date() },
    });
  }

  async countUserAssignments(
    roleId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).userRole.count({
      where: { roleId },
    });
  }

  async findPermissionsBySlugs(
    permissionSlugs: string[],
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).permission.findMany({
      where: {
        slug: { in: permissionSlugs },
      },
      select: {
        id: true,
        slug: true,
      },
    });
  }

  async replacePermissions(
    roleId: string,
    tenantId: string,
    permissionIds: string[],
  ) {
    return prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          tenantId,
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  async findByIdWithTenant(
    roleId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        tenantId: true,
      },
    });
  }
}

export const rolesRepository = new RolesRepository();
