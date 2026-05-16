// ============================================
// FINQZ PRO - Organizations Service
// ============================================

import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { AppError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type {
  CreateOrganizationRequest,
  OrganizationListQuery,
  UpdateOrganizationRequest,
} from './types.js';

const logger = createModuleLogger('OrganizationsService');

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

export class OrganizationsService {
  async listOrganizations(tenantId: string, query: OrganizationListQuery) {
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

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: organizationInclude,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip,
        take: query.limit,
      }),
      prisma.organization.count({ where }),
    ]);

    return { organizations, total };
  }

  async getOrganizationTree(tenantId: string) {
    const organizations = await prisma.organization.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
            memberships: { where: { isActive: true, deletedAt: null } },
          },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    const buildTree = (parentId: string | null = null): any[] =>
      organizations
        .filter((organization) => organization.parentId === parentId)
        .map((organization) => ({
          ...organization,
          children: buildTree(organization.id),
        }));

    return buildTree();
  }

  async getOrganization(tenantId: string, organizationId: string) {
    const organization = await prisma.organization.findFirst({
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

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  }

  async createOrganization(tenantId: string, data: CreateOrganizationRequest) {
    logger.info(`Creating organization ${data.code} for tenant ${tenantId}`);

    const existingOrganization = await prisma.organization.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: data.code,
        },
      },
    });

    if (existingOrganization) {
      throw new ValidationError('Organization code already exists', [
        'Organization code must be unique within the tenant',
      ]);
    }

    let level = 1;
    if (data.parentId) {
      const parent = await prisma.organization.findFirst({
        where: {
          id: data.parentId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new ValidationError('Parent organization not found');
      }

      level = parent.level + 1;
    }

    const createData: Prisma.OrganizationUncheckedCreateInput = {
      name: data.name,
      code: data.code,
      type: data.type,
      level,
      tenantId,
    };

    if (data.description !== undefined) createData.description = data.description;
    if (data.parentId) createData.parentId = data.parentId;
    if (data.settings !== undefined) createData.settings = data.settings;

    return prisma.organization.create({
      data: createData,
      include: organizationInclude,
    });
  }

  async updateOrganization(tenantId: string, organizationId: string, data: UpdateOrganizationRequest) {
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const updateData: Prisma.OrganizationUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.settings !== undefined) updateData.settings = data.settings;

    return prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: organizationInclude,
    });
  }

  async deleteOrganization(tenantId: string, organizationId: string): Promise<void> {
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const [activeMemberships, activeChildren] = await Promise.all([
      prisma.membership.count({
        where: {
          organizationId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.organization.count({
        where: {
          parentId: organizationId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    if (activeMemberships > 0) {
      throw new ValidationError('Cannot delete organization with active memberships');
    }

    if (activeChildren > 0) {
      throw new ValidationError('Cannot delete organization with active child organizations');
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

export const organizationsService = new OrganizationsService();
