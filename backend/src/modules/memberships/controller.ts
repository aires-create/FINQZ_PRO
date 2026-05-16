// ============================================
// FINQZ PRO - Memberships Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { membershipsService } from './service.js';
import { ApiResponse, AuthenticationError, PaginatedResponse, ValidationError } from '../../types/index.js';
import { createModuleLogger } from '../../shared/logger.js';
import type {
  CreateMembershipRequest,
  MembershipListQuery,
  UpdateMembershipRequest,
} from './types.js';

const logger = createModuleLogger('MembershipsController');

const getTenantId = (req: Request): string => {
  if (!req.tenantId) {
    throw new AuthenticationError('Tenant context required');
  }
  return req.tenantId;
};

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AuthenticationError('Authentication required');
  }
  return req.user.userId;
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

export class MembershipsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const query: MembershipListQuery = {
        page: toPositiveInteger(req.query.page, 1),
        limit: toPositiveInteger(req.query.limit, 20),
      };
      if (typeof req.query.organizationId === 'string') query.organizationId = req.query.organizationId;
      if (typeof req.query.userId === 'string') query.userId = req.query.userId;
      if (typeof req.query.role === 'string') {
        query.role = req.query.role as NonNullable<MembershipListQuery['role']>;
      }
      if (typeof req.query.status === 'string') {
        query.status = req.query.status as NonNullable<MembershipListQuery['status']>;
      }

      logger.info(`List memberships request for tenant: ${tenantId}`);

      const { memberships, total } = await membershipsService.listMemberships(tenantId, query);

      const response: PaginatedResponse<typeof memberships[number]> = {
        success: true,
        data: memberships,
        message: 'Memberships retrieved successfully',
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

  async my(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const memberships = await membershipsService.listUserMemberships(tenantId, userId);

      const response: ApiResponse<typeof memberships> = {
        success: true,
        data: memberships,
        message: 'User memberships retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const membershipId = getParam(req, 'id');
      const membership = await membershipsService.getMembership(
        tenantId,
        membershipId,
        userId,
        req.membership?.role,
      );

      const response: ApiResponse<typeof membership> = {
        success: true,
        data: membership,
        message: 'Membership retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const data: CreateMembershipRequest = req.body;
      const membership = await membershipsService.createMembership(tenantId, userId, data);

      logger.info('Membership created', {
        membershipId: membership.id,
        organizationId: membership.organizationId,
        tenantId,
        userId: membership.userId,
        invitedBy: userId,
      });

      const response: ApiResponse<typeof membership> = {
        success: true,
        data: membership,
        message: 'Membership created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const membershipId = getParam(req, 'id');
      const data: UpdateMembershipRequest = req.body;
      const membership = await membershipsService.updateMembership(
        tenantId,
        membershipId,
        userId,
        req.membership?.role,
        data,
      );

      logger.info('Membership updated', {
        membershipId,
        organizationId: membership.organizationId,
        tenantId,
        updatedBy: userId,
      });

      const response: ApiResponse<typeof membership> = {
        success: true,
        data: membership,
        message: 'Membership updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const membershipId = getParam(req, 'id');

      await membershipsService.deleteMembership(tenantId, membershipId, userId, req.membership?.role);

      logger.info('Membership deleted', {
        membershipId,
        tenantId,
        deletedBy: userId,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Membership removed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const membershipId = getParam(req, 'id');
      const membership = await membershipsService.acceptMembership(tenantId, membershipId, userId);

      const response: ApiResponse<typeof membership> = {
        success: true,
        data: membership,
        message: 'Membership invitation accepted',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const membershipsController = new MembershipsController();
