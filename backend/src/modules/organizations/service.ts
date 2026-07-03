// ============================================
// FINQZ PRO - Organizations Service
// ============================================

import type { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type {
  CreateOrganizationRequest,
  OrganizationListQuery,
  UpdateOrganizationRequest,
} from './types.js';
import { organizationsRepository } from './repositories/organizations.repository.js';

const logger = createModuleLogger('OrganizationsService');

export class OrganizationsService {
  async listOrganizations(tenantId: string, query: OrganizationListQuery) {
    return organizationsRepository.listByTenant(tenantId, query);
  }

  async getOrganizationTree(tenantId: string) {
    const organizations = await organizationsRepository.listTree(tenantId);

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
    const organization = await organizationsRepository.findById(tenantId, organizationId);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  }

  async createOrganization(tenantId: string, data: CreateOrganizationRequest) {
    logger.info(`Creating organization ${data.code} for tenant ${tenantId}`);

    const existingOrganization = await organizationsRepository.findByTenantAndCode(tenantId, data.code);

    if (existingOrganization) {
      throw new ValidationError('Organization code already exists', [
        'Organization code must be unique within the tenant',
      ]);
    }

    let level = 1;
    if (data.parentId) {
      const parent = await organizationsRepository.findParent(tenantId, data.parentId);

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

    return organizationsRepository.create(createData);
  }

  async updateOrganization(tenantId: string, organizationId: string, data: UpdateOrganizationRequest) {
    const organization = await organizationsRepository.findExistingForUpdate(tenantId, organizationId);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const updateData: Prisma.OrganizationUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.settings !== undefined) updateData.settings = data.settings;

    return organizationsRepository.update(organizationId, updateData);
  }

  async deleteOrganization(tenantId: string, organizationId: string): Promise<void> {
    const organization = await organizationsRepository.findActiveOrganization(tenantId, organizationId);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const [activeMemberships, activeChildren] = await Promise.all([
      organizationsRepository.countActiveMemberships(tenantId, organizationId),
      organizationsRepository.countActiveChildren(tenantId, organizationId),
    ]);

    if (activeMemberships > 0) {
      throw new ValidationError('Cannot delete organization with active memberships');
    }

    if (activeChildren > 0) {
      throw new ValidationError('Cannot delete organization with active child organizations');
    }

    await organizationsRepository.softDelete(organizationId);
  }
}

export const organizationsService = new OrganizationsService();
