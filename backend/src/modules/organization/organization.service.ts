import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationAppError,
} from '../../shared/errors/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import { organizationRepository } from './organization.repository.js';
import type {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from './organization.schema.js';

const logger = createModuleLogger('OrganizationService');

const ensureTenantId = (tenantId: string) => {
  if (!tenantId) {
    throw new BadRequestError('Missing tenant context');
  }
};

export class OrganizationService {
  async listOrganizations(
    tenantId: string,
    query: ListOrganizationsQueryDto,
  ) {
    ensureTenantId(tenantId);

    const { data, total } = await organizationRepository.findManyByTenant(
      tenantId,
      query,
    );

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getOrganizationById(tenantId: string, organizationId: string) {
    ensureTenantId(tenantId);

    const organization = await organizationRepository.findById(
      tenantId,
      organizationId,
    );

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return organization;
  }

  async createOrganization(tenantId: string, data: CreateOrganizationDto) {
    ensureTenantId(tenantId);

    const existingOrganization = await organizationRepository.findByCode(
      tenantId,
      data.code,
    );

    if (existingOrganization) {
      throw new ConflictError(
        'Organization code must be unique within the tenant',
      );
    }

    let level = 1;

    if (data.parentId) {
      const parent = await organizationRepository.findById(
        tenantId,
        data.parentId,
      );

      if (!parent || !parent.isActive) {
        throw new ValidationAppError('Parent organization not found');
      }

      level = parent.level + 1;
    }

    const organization = await organizationRepository.create(
      tenantId,
      data,
      level,
    );

    logger.info('Organization created', {
      tenantId,
      organizationId: organization.id,
      code: organization.code,
    });

    return organization;
  }

  async updateOrganization(
    tenantId: string,
    organizationId: string,
    data: UpdateOrganizationDto,
  ) {
    ensureTenantId(tenantId);

    await this.getOrganizationById(tenantId, organizationId);

    const result = await organizationRepository.update(
      tenantId,
      organizationId,
      data,
    );

    if (result.count === 0) {
      throw new NotFoundError('Organization not found');
    }

    const organization = await this.getOrganizationById(
      tenantId,
      organizationId,
    );

    logger.info('Organization updated', {
      tenantId,
      organizationId,
    });

    return organization;
  }

  async softDeleteOrganization(
    tenantId: string,
    organizationId: string,
  ): Promise<void> {
    ensureTenantId(tenantId);

    await this.getOrganizationById(tenantId, organizationId);

    const [activeMemberships, activeChildren] = await Promise.all([
      organizationRepository.countActiveMemberships(tenantId, organizationId),
      organizationRepository.countActiveChildren(tenantId, organizationId),
    ]);

    if (activeMemberships > 0) {
      throw new ValidationAppError(
        'Cannot delete organization with active memberships',
      );
    }

    if (activeChildren > 0) {
      throw new ValidationAppError(
        'Cannot delete organization with active child organizations',
      );
    }

    const result = await organizationRepository.softDelete(
      tenantId,
      organizationId,
    );

    if (result.count === 0) {
      throw new NotFoundError('Organization not found');
    }

    logger.info('Organization soft deleted', {
      tenantId,
      organizationId,
    });
  }
}

export const organizationService = new OrganizationService();
