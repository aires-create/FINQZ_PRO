// ============================================
// FINQZ PRO - Permissions Service
// ============================================

import { prisma } from '../../database/prisma';
import { AppError, ValidationError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { CreatePermissionRequest, UpdatePermissionRequest, PermissionResponse } from './types';

const logger = createModuleLogger('PermissionsService');

export class PermissionsService {
  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionRequest): Promise<PermissionResponse> {
    try {
      logger.info(`Creating permission: ${data.slug}`);

      // Check if permission already exists
      const existingPermission = await prisma.permission.findUnique({
        where: { slug: data.slug },
      });

      if (existingPermission) {
        throw new ValidationError('Permission already exists', ['Permission slug must be unique']);
      }

      // Create permission
      const permission = await prisma.permission.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          resource: data.resource,
          action: data.action,
        },
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
      const permission = await prisma.permission.findUnique({
        where: { id: permissionId },
      });

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
      const [permissions, total] = await Promise.all([
        prisma.permission.findMany({
          skip,
          take,
          orderBy: { resource: 'asc' },
        }),
        prisma.permission.count(),
      ]);

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
      const permissions = await prisma.permission.findMany({
        where: { resource },
        orderBy: { action: 'asc' },
      });

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

      const permission = await prisma.permission.update({
        where: { id: permissionId },
        data: updateData,
      });

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
      const roleCount = await prisma.role.count({
        where: {
          permissions: {
            some: { id: permissionId },
          },
        },
      });

      if (roleCount > 0) {
        throw new ValidationError('Cannot delete permission with assigned roles', [
          `This permission is assigned to ${roleCount} role(s)`,
        ]);
      }

      await prisma.permission.delete({
        where: { id: permissionId },
      });

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
        { name: 'Create User', slug: 'user:create', resource: 'users', action: 'create' },
        { name: 'Read User', slug: 'user:read', resource: 'users', action: 'read' },
        { name: 'Update User', slug: 'user:update', resource: 'users', action: 'update' },
        { name: 'Delete User', slug: 'user:delete', resource: 'users', action: 'delete' },

        // Role permissions
        { name: 'Create Role', slug: 'role:create', resource: 'roles', action: 'create' },
        { name: 'Read Role', slug: 'role:read', resource: 'roles', action: 'read' },
        { name: 'Update Role', slug: 'role:update', resource: 'roles', action: 'update' },
        { name: 'Delete Role', slug: 'role:delete', resource: 'roles', action: 'delete' },

        // Tenant permissions
        { name: 'Create Tenant', slug: 'tenant:create', resource: 'tenants', action: 'create' },
        { name: 'Read Tenant', slug: 'tenant:read', resource: 'tenants', action: 'read' },
        { name: 'Update Tenant', slug: 'tenant:update', resource: 'tenants', action: 'update' },
        { name: 'Delete Tenant', slug: 'tenant:delete', resource: 'tenants', action: 'delete' },

        // Lead permissions
        { name: 'Create Lead', slug: 'lead:create', resource: 'leads', action: 'create' },
        { name: 'Read Lead', slug: 'lead:read', resource: 'leads', action: 'read' },
        { name: 'Update Lead', slug: 'lead:update', resource: 'leads', action: 'update' },
        { name: 'Delete Lead', slug: 'lead:delete', resource: 'leads', action: 'delete' },

        // Report permissions
        { name: 'Read Report', slug: 'report:read', resource: 'reports', action: 'read' },
        { name: 'Export Report', slug: 'report:export', resource: 'reports', action: 'export' },
      ];

      for (const permission of defaultPermissions) {
        const exists = await prisma.permission.findUnique({
          where: { slug: permission.slug },
        });

        if (!exists) {
          await prisma.permission.create({
            data: permission,
          });
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
