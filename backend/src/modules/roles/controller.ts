// ============================================
// FINQZ PRO - Roles Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { rolesService } from './service';
import { ApiResponse, PaginatedResponse } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { CreateRoleRequest, UpdateRoleRequest, RoleResponse } from './types';

const logger = createModuleLogger('RolesController');

export class RolesController {
  /**
   * Create role
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const data: CreateRoleRequest = req.body;

      logger.info(`Create role request for tenant: ${tenantId}`);

      const role = await rolesService.createRole(tenantId, data);

      const response: ApiResponse<RoleResponse> = {
        success: true,
        data: role,
        message: 'Role created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = req.params.roleId;
      const tenantId = req.tenantId!;
      if (!roleId || Array.isArray(roleId)) {
        throw new Error('Invalid role ID');
      }

      logger.info(`Get role request: ${roleId}`);

      const role = await rolesService.getRole(tenantId, roleId);

      const response: ApiResponse<RoleResponse> = {
        success: true,
        data: role,
        message: 'Role retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all roles
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      logger.info(`List roles request for tenant: ${tenantId}`);

      const { roles, total } = await rolesService.getRoles(tenantId, skip, limit);

      const response: PaginatedResponse<RoleResponse> = {
        success: true,
        data: roles,
        message: 'Roles retrieved successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = req.params.roleId;
      const tenantId = req.tenantId!;
      if (!roleId || Array.isArray(roleId)) {
        throw new Error('Invalid role ID');
      }
      const data: UpdateRoleRequest = req.body;

      logger.info(`Update role request: ${roleId}`);

      const role = await rolesService.updateRole(tenantId, roleId, data);

      const response: ApiResponse<RoleResponse> = {
        success: true,
        data: role,
        message: 'Role updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = req.params.roleId;
      const tenantId = req.tenantId!;
      if (!roleId || Array.isArray(roleId)) {
        throw new Error('Invalid role ID');
      }

      logger.info(`Delete role request: ${roleId}`);

      await rolesService.deleteRole(tenantId, roleId);

      const response: ApiResponse = {
        success: true,
        message: 'Role deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const rolesController = new RolesController();
