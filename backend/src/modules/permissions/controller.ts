// ============================================
// FINQZ PRO - Permissions Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { permissionsService } from './service';
import { ApiResponse, PaginatedResponse } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type { CreatePermissionRequest, UpdatePermissionRequest, PermissionResponse } from './types';

const logger = createModuleLogger('PermissionsController');

export class PermissionsController {
  /**
   * Create permission
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreatePermissionRequest = req.body;

      logger.info(`Create permission request`);

      const permission = await permissionsService.createPermission(data);

      const response: ApiResponse<PermissionResponse> = {
        success: true,
        data: permission,
        message: 'Permission created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissionId = req.params.permissionId;
      if (!permissionId || Array.isArray(permissionId)) {
        throw new Error('Invalid permission ID');
      }

      logger.info(`Get permission request: ${permissionId}`);

      const permission = await permissionsService.getPermission(permissionId);

      const response: ApiResponse<PermissionResponse> = {
        success: true,
        data: permission,
        message: 'Permission retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all permissions
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = (page - 1) * limit;

      logger.info(`List permissions request`);

      const { permissions, total } = await permissionsService.getPermissions(skip, limit);

      const response: PaginatedResponse<PermissionResponse> = {
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
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
   * Get permissions by resource
   */
  async getByResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = req.params.resource;
      if (!resource || Array.isArray(resource)) {
        throw new Error('Invalid resource');
      }

      logger.info(`Get permissions by resource: ${resource}`);

      const permissions = await permissionsService.getPermissionsByResource(resource);

      const response: ApiResponse<PermissionResponse[]> = {
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update permission
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissionId = req.params.permissionId;
      if (!permissionId || Array.isArray(permissionId)) {
        throw new Error('Invalid permission ID');
      }
      const data: UpdatePermissionRequest = req.body;

      logger.info(`Update permission request: ${permissionId}`);

      const permission = await permissionsService.updatePermission(permissionId, data);

      const response: ApiResponse<PermissionResponse> = {
        success: true,
        data: permission,
        message: 'Permission updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete permission
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissionId = req.params.permissionId;
      if (!permissionId || Array.isArray(permissionId)) {
        throw new Error('Invalid permission ID');
      }

      logger.info(`Delete permission request: ${permissionId}`);

      await permissionsService.deletePermission(permissionId);

      const response: ApiResponse = {
        success: true,
        message: 'Permission deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const permissionsController = new PermissionsController();
