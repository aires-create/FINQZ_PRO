// ============================================
// FINQZ PRO - Permissions Service
// ============================================

import { prisma } from '../../database/prisma.js';
import type { Prisma } from '@prisma/client';
import { PermissionAction } from '@prisma/client';
import { AppError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type { CreatePermissionRequest, UpdatePermissionRequest, PermissionResponse } from './types.js';
import { PARTNER_ACQUISITION_RBAC_PERMISSIONS } from './partner-acquisition-rbac.catalog.js';

const logger = createModuleLogger('PermissionsService');

class PermissionsRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async findBySlug(slug: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).permission.findUnique({
      where: { slug },
    });
  }

  async findById(permissionId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).permission.findUnique({
      where: { id: permissionId },
    });
  }

  async list(skip = 0, take = 100, client?: Prisma.TransactionClient) {
    const [permissions, total] = await Promise.all([
      this.getClient(client).permission.findMany({
        skip,
        take,
        orderBy: { resource: 'asc' },
      }),
      this.getClient(client).permission.count(),
    ]);

    return { permissions, total };
  }

  async findByResource(resource: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });
  }

  async create(
    data: {
      name: string;
      slug: string;
      description?: string | null;
      resource: string;
      action: PermissionAction;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).permission.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        resource: data.resource,
        action: data.action,
      },
    });
  }

  async update(
    permissionId: string,
    data: {
      name?: string;
      description?: string | null;
    },
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).permission.update({
      where: { id: permissionId },
      data,
    });
  }

  async countRoleAssignments(permissionId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).role.count({
      where: {
        rolePermissions: {
          some: { permissionId },
        },
      },
    });
  }

  async delete(permissionId: string, client?: Prisma.TransactionClient) {
    return this.getClient(client).permission.delete({
      where: { id: permissionId },
    });
  }
}

const permissionsRepository = new PermissionsRepository();

export class PermissionsService {
  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionRequest): Promise<PermissionResponse> {
    try {
      logger.info(`Creating permission: ${data.slug}`);

      // Check if permission already exists
      const existingPermission = await permissionsRepository.findBySlug(data.slug);

      if (existingPermission) {
        throw new ValidationError('Permission already exists', ['Permission slug must be unique']);
      }

      // Create permission
      const permission = await permissionsRepository.create({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        resource: data.resource,
        action: data.action.toUpperCase() as PermissionAction,
      });

      logger.info(`Permission created: ${permission.id}`);
      return permission as PermissionResponse;
    } catch (error) {
      logger.error('Failed to create permission:', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   */
  async getPermission(permissionId: string): Promise<PermissionResponse> {
    try {
      const permission = await permissionsRepository.findById(permissionId);

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      return permission as PermissionResponse;
    } catch (error) {
      logger.error('Failed to get permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(skip = 0, take = 100): Promise<{ permissions: PermissionResponse[]; total: number }> {
    try {
      const { permissions, total } = await permissionsRepository.list(skip, take);

      return { permissions: permissions as PermissionResponse[], total };
    } catch (error) {
      logger.error('Failed to get permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<PermissionResponse[]> {
    try {
      const permissions = await permissionsRepository.findByResource(resource);

      return permissions as PermissionResponse[];
    } catch (error) {
      logger.error('Failed to get permissions by resource:', error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(permissionId: string, data: UpdatePermissionRequest): Promise<PermissionResponse> {
    try {
      logger.info(`Updating permission: ${permissionId}`);

      const updateData: { name?: string; description?: string | null } = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description ?? null;
      }

      const permission = await permissionsRepository.update(permissionId, updateData);

      logger.info(`Permission updated: ${permissionId}`);
      return permission as PermissionResponse;
    } catch (error) {
      logger.error('Failed to update permission:', error);
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId: string): Promise<void> {
    try {
      logger.info(`Deleting permission: ${permissionId}`);

      // Check if permission is assigned to roles
      const roleCount = await permissionsRepository.countRoleAssignments(permissionId);

      if (roleCount > 0) {
        throw new ValidationError('Cannot delete permission with assigned roles', [
          `This permission is assigned to ${roleCount} role(s)`,
        ]);
      }

      await permissionsRepository.delete(permissionId);

      logger.info(`Permission deleted: ${permissionId}`);
    } catch (error) {
      logger.error('Failed to delete permission:', error);
      throw error;
    }
  }

  /**
   * Seed default permissions
   */
  async seedDefaultPermissions(): Promise<void> {
    try {
      logger.info('Seeding default permissions');

      const defaultPermissions = [
        // User permissions
        { name: 'Create User', slug: 'user:create', resource: 'users', action: 'CREATE' as PermissionAction },
        { name: 'Read User', slug: 'user:read', resource: 'users', action: 'READ' as PermissionAction },
        { name: 'Update User', slug: 'user:update', resource: 'users', action: 'UPDATE' as PermissionAction },
        { name: 'Delete User', slug: 'user:delete', resource: 'users', action: 'DELETE' as PermissionAction },

        // Role permissions
        { name: 'Create Role', slug: 'role:create', resource: 'roles', action: 'CREATE' as PermissionAction },
        { name: 'Read Role', slug: 'role:read', resource: 'roles', action: 'READ' as PermissionAction },
        { name: 'Update Role', slug: 'role:update', resource: 'roles', action: 'UPDATE' as PermissionAction },
        { name: 'Delete Role', slug: 'role:delete', resource: 'roles', action: 'DELETE' as PermissionAction },

        // Tenant permissions
        { name: 'Create Tenant', slug: 'tenant:create', resource: 'tenants', action: 'CREATE' as PermissionAction },
        { name: 'Read Tenant', slug: 'tenant:read', resource: 'tenants', action: 'READ' as PermissionAction },
        { name: 'Update Tenant', slug: 'tenant:update', resource: 'tenants', action: 'UPDATE' as PermissionAction },
        { name: 'Delete Tenant', slug: 'tenant:delete', resource: 'tenants', action: 'DELETE' as PermissionAction },

        // Organization permissions
        { name: 'Create Organization', slug: 'organization:create', resource: 'organizations', action: 'CREATE' as PermissionAction },
        { name: 'Read Organization', slug: 'organization:read', resource: 'organizations', action: 'READ' as PermissionAction },
        { name: 'Update Organization', slug: 'organization:update', resource: 'organizations', action: 'UPDATE' as PermissionAction },
        { name: 'Delete Organization', slug: 'organization:delete', resource: 'organizations', action: 'DELETE' as PermissionAction },

        // Membership permissions
        { name: 'Create Membership', slug: 'membership:create', resource: 'memberships', action: 'CREATE' as PermissionAction },
        { name: 'Read Membership', slug: 'membership:read', resource: 'memberships', action: 'READ' as PermissionAction },
        { name: 'Update Membership', slug: 'membership:update', resource: 'memberships', action: 'UPDATE' as PermissionAction },
        { name: 'Delete Membership', slug: 'membership:delete', resource: 'memberships', action: 'DELETE' as PermissionAction },

        // Lead permissions
        { name: 'Create Lead', slug: 'lead:create', resource: 'leads', action: 'CREATE' as PermissionAction },
        { name: 'Read Lead', slug: 'lead:read', resource: 'leads', action: 'READ' as PermissionAction },
        { name: 'Update Lead', slug: 'lead:update', resource: 'leads', action: 'UPDATE' as PermissionAction },
        { name: 'Delete Lead', slug: 'lead:delete', resource: 'leads', action: 'DELETE' as PermissionAction },

        // Simulation permissions
        { name: 'Execute Simulation', slug: 'simulation:execute', resource: 'simulations', action: 'CREATE' as PermissionAction },

        ...PARTNER_ACQUISITION_RBAC_PERMISSIONS,

        // Report permissions
        { name: 'Read Report', slug: 'report:read', resource: 'reports', action: 'READ' as PermissionAction },
        { name: 'Export Report', slug: 'report:export', resource: 'reports', action: 'EXPORT' as PermissionAction },
      ];

      for (const permission of defaultPermissions) {
        const exists = await permissionsRepository.findBySlug(permission.slug);

        if (!exists) {
          await permissionsRepository.create(permission);
        }
      }

      logger.info('Default permissions seeded');
    } catch (error) {
      logger.error('Failed to seed permissions:', error);
      throw error;
    }
  }
}

export const permissionsService = new PermissionsService();
