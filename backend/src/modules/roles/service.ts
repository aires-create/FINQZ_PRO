// ============================================
// FINQZ PRO - Roles Service
// ============================================

import { prisma } from '../../database/prisma';
import { AppError, ValidationError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { CreateRoleRequest, UpdateRoleRequest, RoleResponse } from './types';

const logger = createModuleLogger('RolesService');

export class RolesService {
  /**
   * Create a new role
   */
  async createRole(tenantId: string, data: CreateRoleRequest): Promise<RoleResponse> {
    try {
      logger.info(`Creating role: ${data.slug} for tenant: ${tenantId}`);

      // Check if role already exists
      const existingRole = await prisma.role.findFirst({
        where: {
          tenantId,
          slug: data.slug,
        },
      });

      if (existingRole) {
        throw new ValidationError('Role already exists', ['Role slug must be unique within tenant']);
      }

      // Create role
      const role = await prisma.role.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          tenantId,
          isSystem: false,
        },
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              slug: true,
              resource: true,
              action: true,
            },
          },
        },
      });

      // Add permissions if provided
      if (data.permissions && data.permissions.length > 0) {
        await this.updateRolePermissions(role.id, data.permissions);
      }

      logger.info(`Role created: ${role.id}`);
      return role as unknown as RoleResponse;
    } catch (error) {
      logger.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(tenantId: string, roleId: string): Promise<RoleResponse> {
    try {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          tenantId,
        },
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              slug: true,
              resource: true,
              action: true,
            },
          },
        },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      return role as RoleResponse;
    } catch (error) {
      logger.error('Failed to get role:', error);
      throw error;
    }
  }

  /**
   * Get all roles for tenant
   */
  async getRoles(tenantId: string, skip = 0, take = 10): Promise<{ roles: RoleResponse[]; total: number }> {
    try {
      const [roles, total] = await Promise.all([
        prisma.role.findMany({
          where: { tenantId, deletedAt: null },
          include: {
            permissions: {
              select: {
                id: true,
                name: true,
                slug: true,
                resource: true,
                action: true,
              },
            },
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.role.count({
          where: { tenantId, deletedAt: null },
        }),
      ]);

      return { roles: roles as RoleResponse[], total };
    } catch (error) {
      logger.error('Failed to get roles:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(tenantId: string, roleId: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    try {
      logger.info(`Updating role: ${roleId}`);

      // Check if role is system role
      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new ValidationError('Cannot update system role', ['System roles cannot be modified']);
      }

      // Update role
      const updateData: { name?: string; description?: string | null; updatedAt: Date } = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description ?? null;
      }

      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: updateData,
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              slug: true,
              resource: true,
              action: true,
            },
          },
        },
      });

      // Update permissions if provided
      if (data.permissions) {
        await this.updateRolePermissions(roleId, data.permissions);
      }

      logger.info(`Role updated: ${roleId}`);
      return updatedRole as unknown as RoleResponse;
    } catch (error) {
      logger.error('Failed to update role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    try {
      logger.info(`Deleting role: ${roleId}`);

      // Check if role exists and is not system role
      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new ValidationError('Cannot delete system role', ['System roles cannot be deleted']);
      }

      // Check if role is assigned to users
      const userCount = await prisma.user.count({
        where: { roleId },
      });

      if (userCount > 0) {
        throw new ValidationError('Cannot delete role with assigned users', [
          `This role is assigned to ${userCount} user(s)`,
        ]);
      }

      // Soft delete role
      await prisma.role.update({
        where: { id: roleId },
        data: { deletedAt: new Date() },
      });

      logger.info(`Role deleted: ${roleId}`);
    } catch (error) {
      logger.error('Failed to delete role:', error);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId: string, permissionSlugs: string[]): Promise<void> {
    try {
      logger.info(`Updating permissions for role: ${roleId}`);

      // Get permissions by slug
      const permissions = await prisma.permission.findMany({
        where: {
          slug: { in: permissionSlugs },
        },
        select: { id: true },
      });

      if (permissions.length !== permissionSlugs.length) {
        throw new ValidationError('Some permissions not found', ['One or more permission slugs are invalid']);
      }

      // Update role permissions
      await prisma.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            set: permissions.map((p) => ({ id: p.id })),
          },
        },
      });

      logger.info(`Permissions updated for role: ${roleId}`);
    } catch (error) {
      logger.error('Failed to update role permissions:', error);
      throw error;
    }
  }
}

export const rolesService = new RolesService();
