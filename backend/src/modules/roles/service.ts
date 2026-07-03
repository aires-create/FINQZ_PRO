// ============================================
// FINQZ PRO - Roles Service
// ============================================

import { AppError, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type { CreateRoleRequest, UpdateRoleRequest, RoleResponse } from './types.js';
import { rolesRepository } from './repositories/roles.repository.js';

const logger = createModuleLogger('RolesService');

export class RolesService {
  /**
   * Create a new role
   */
  async createRole(tenantId: string, data: CreateRoleRequest): Promise<RoleResponse> {
    try {
      logger.info(`Creating role: ${data.slug} for tenant: ${tenantId}`);

      // Check if role already exists
      const existingRole = await rolesRepository.findByTenantAndSlug(tenantId, data.slug);

      if (existingRole) {
        throw new ValidationError('Role already exists', ['Role slug must be unique within tenant']);
      }

      // Create role
      const role = await rolesRepository.create({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        tenantId,
        isSystem: false,
      });

      // Add permissions if provided
      if (data.permissions && data.permissions.length > 0) {
        await this.updateRolePermissions(role.id, data.permissions);
      }

      logger.info(`Role created: ${role.id}`);
      return {
        ...role,
        permissions: role.rolePermissions.map((rp) => rp.permission),
      } as unknown as RoleResponse;
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
      const role = await rolesRepository.findById(tenantId, roleId);

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      return {
        ...role,
        permissions: role.rolePermissions.map((rp) => rp.permission),
      } as unknown as RoleResponse;
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
      const { roles, total } = await rolesRepository.listByTenant(tenantId, skip, take);

      return {
        roles: roles.map((role) => ({
          ...role,
          permissions: role.rolePermissions.map((rp) => rp.permission),
        })) as RoleResponse[],
        total,
      };
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
      const role = await rolesRepository.findById(tenantId, roleId);

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

      const roleUpdateData: {
        name?: string;
        description?: string | null;
      } = {};

      if (data.name !== undefined) {
        roleUpdateData.name = data.name;
      }
      if (data.description !== undefined) {
        roleUpdateData.description = data.description ?? null;
      }

      const updatedRole = await rolesRepository.update(tenantId, roleId, roleUpdateData);

            // Update permissions if provided
      if (data.permissions) {
        await this.updateRolePermissions(roleId, data.permissions);
      }

      const refreshedRole = await this.getRole(tenantId, roleId);

      logger.info(`Role updated: ${roleId}`);
      return refreshedRole;
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
      const role = await rolesRepository.findById(tenantId, roleId);

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new ValidationError('Cannot delete system role', ['System roles cannot be deleted']);
      }

      // Check if role is assigned to users via role assignments
      const userRoleCount = await rolesRepository.countUserAssignments(roleId);

      if (userRoleCount > 0) {
        throw new ValidationError('Cannot delete role with assigned users', [
          `This role is assigned to ${userRoleCount} user(s)`,
        ]);
      }      // Soft delete role
      await rolesRepository.softDelete(tenantId, roleId);

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

      const role = await rolesRepository.findByIdWithTenant(roleId);

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      const permissions = await rolesRepository.findPermissionsBySlugs(permissionSlugs);

      if (permissions.length !== permissionSlugs.length) {
        throw new ValidationError('Some permissions not found', [
          'One or more permission slugs are invalid',
        ]);
      }

      await rolesRepository.replacePermissions(
        roleId,
        role.tenantId,
        permissions.map((permission) => permission.id),
      );

      logger.info(`Permissions updated for role: ${roleId}`);
    } catch (error) {
      logger.error('Failed to update role permissions:', error);
      throw error;
    }
  }
}
export const rolesService = new RolesService();
