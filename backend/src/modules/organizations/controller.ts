// ============================================
// FINQZ PRO - Organizations Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { organizationsService } from './service';
import { ApiResponse, PaginatedResponse } from '../../types';
import { AuthenticationError, ValidationError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type {
  CreateOrganizationRequest,
  OrganizationListQuery,
  UpdateOrganizationRequest,
} from './types';

const logger = createModuleLogger('OrganizationsController');

const getTenantId = (req: Request): string => {
  if (!req.tenantId) {
    throw new AuthenticationError('Tenant context required');
  }
  return req.tenantId;
};

const getParam = (req: Request, key: string): string => {
  const value = req.params[key];
  if (!value || Array.isArray(value)) {
    throw new ValidationError(`Invalid ${key} parameter`);
  }
  return value;
};

const toPositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
};

export class OrganizationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const query: OrganizationListQuery = {
        page: toPositiveInteger(req.query.page, 1),
        limit: toPositiveInteger(req.query.limit, 20),
      };
      if (typeof req.query.parentId === 'string') query.parentId = req.query.parentId;
      if (typeof req.query.type === 'string') {
        query.type = req.query.type as NonNullable<OrganizationListQuery['type']>;
      }
      if (toPositiveInteger(req.query.level, 0) > 0) query.level = toPositiveInteger(req.query.level, 0);
      if (typeof req.query.search === 'string') query.search = req.query.search;

      logger.info(`List organizations request for tenant: ${tenantId}`);

      const { organizations, total } = await organizationsService.listOrganizations(tenantId, query);

      const response: PaginatedResponse<typeof organizations[number]> = {
        success: true,
        data: organizations,
        message: 'Organizations retrieved successfully',
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async tree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const tree = await organizationsService.getOrganizationTree(tenantId);

      const response: ApiResponse<typeof tree> = {
        success: true,
        data: tree,
        message: 'Organization tree retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const organizationId = getParam(req, 'id');
      const organization = await organizationsService.getOrganization(tenantId, organizationId);

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
        message: 'Organization retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const data: CreateOrganizationRequest = req.body;
      const organization = await organizationsService.createOrganization(tenantId, data);

      logger.info('Organization created', {
        organizationId: organization.id,
        tenantId,
        userId: req.user?.userId,
      });

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
        message: 'Organization created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const organizationId = getParam(req, 'id');
      const data: UpdateOrganizationRequest = req.body;
      const organization = await organizationsService.updateOrganization(tenantId, organizationId, data);

      logger.info('Organization updated', {
        organizationId,
        tenantId,
        userId: req.user?.userId,
      });

      const response: ApiResponse<typeof organization> = {
        success: true,
        data: organization,
        message: 'Organization updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const organizationId = getParam(req, 'id');
      await organizationsService.deleteOrganization(tenantId, organizationId);

      logger.info('Organization deleted', {
        organizationId,
        tenantId,
        userId: req.user?.userId,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Organization deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const organizationsController = new OrganizationsController();
