// @ts-nocheck
// ============================================
// FINQZ PRO - Enterprise Multi-Tenant Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { AuthenticationError, AuthorizationError } from '../types';
import { createModuleLogger } from '../shared/logger';

const logger = createModuleLogger('EnterpriseMiddleware');

const membershipRoles = ['member', 'manager', 'admin', 'owner'] as const;
type MembershipRole = (typeof membershipRoles)[number];

type TenantScopedResource =
  | 'lead'
  | 'customer'
  | 'opportunity'
  | 'bankProposal'
  | 'commission'
  | 'partner';

const tenantScopedDelegates: Record<TenantScopedResource, { findFirst(args: any): Promise<unknown> }> = {
  lead: prisma.lead,
  customer: prisma.customer,
  opportunity: prisma.opportunity,
  bankProposal: prisma.bankProposal,
  commission: prisma.commission,
  partner: prisma.partner,
};

const roleWeight: Record<MembershipRole, number> = {
  member: 10,
  manager: 20,
  admin: 30,
  owner: 40,
};

const getUserId = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AuthenticationError('Authentication required');
  }
  return userId;
};

const getTenantId = (req: Request): string => {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    throw new AuthorizationError('Tenant context required');
  }
  return tenantId;
};

const getSingleValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (Array.isArray(value)) {
    return getSingleValue(value[0]);
  }
  return undefined;
};

const getOrganizationIdFromRequest = (req: Request): string | undefined =>
  getSingleValue(req.params.organizationId) ??
  getSingleValue(req.params.id) ??
  getSingleValue(req.body?.organizationId) ??
  getSingleValue(req.query.organizationId);

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const hasAllowedMembershipRole = (actualRole: string, allowedRoles: string[]): boolean => {
  if (allowedRoles.length === 0) {
    return true;
  }

  if (!membershipRoles.includes(actualRole as MembershipRole)) {
    return allowedRoles.includes(actualRole);
  }

  const requiredWeight = Math.min(
    ...allowedRoles
      .filter((role): role is MembershipRole => membershipRoles.includes(role as MembershipRole))
      .map((role) => roleWeight[role]),
  );

  if (!Number.isFinite(requiredWeight)) {
    return allowedRoles.includes(actualRole);
  }

  return roleWeight[actualRole as MembershipRole] >= requiredWeight;
};

/**
 * Resolves and verifies the tenant, user, primary organization and membership
 * represented by the authenticated JWT.
 */
export const enterpriseTenantGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const tenantId = req.user!.tenantId;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
        organization: true,
      },
    });

    if (!user) {
      return next(new AuthenticationError('Authenticated user not found'));
    }

    if (!user.tenant.isActive || user.tenant.deletedAt) {
      return next(new AuthorizationError('Tenant not found or inactive'));
    }

    req.tenantId = user.tenantId;
    req.companyId = user.tenantId;
    req.tenant = user.tenant;

    if (user.organization && user.organization.isActive && !user.organization.deletedAt) {
      req.organization = user.organization;
      req.organizationId = user.organization.id;
      req.user!.organizationId = user.organization.id;

      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: user.organization.id,
          },
        },
      });

      if (membership?.isActive && !membership.deletedAt) {
        req.membership = membership;
        req.membershipId = membership.id;
      }
    }

    logger.debug('Tenant context established', {
      tenantId: req.tenantId,
      organizationId: req.organizationId,
      membershipId: req.membershipId,
      userId,
    });

    next();
  } catch (error) {
    logger.error('Enterprise tenant guard failed:', error);
    next(error);
  }
};

/**
 * Ensures the current user can access a target organization in the current tenant.
 */
export const organizationAccessGuard = (
  allowedRoles: string[] = [],
  requireMembership = true,
) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const organizationId = getOrganizationIdFromRequest(req);

    if (!organizationId) {
      return next(new AuthorizationError('Organization ID required', 400));
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!organization) {
      return next(new AuthorizationError('Organization not found or access denied'));
    }

    if (requireMembership) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      if (!membership?.isActive || membership.deletedAt) {
        return next(new AuthorizationError('Organization membership required'));
      }

      if (!hasAllowedMembershipRole(membership.role, allowedRoles)) {
        return next(new AuthorizationError('Insufficient organization permissions'));
      }

      req.membership = membership;
      req.membershipId = membership.id;
    }

    req.organization = organization;
    req.organizationId = organization.id;

    logger.debug('Organization access granted', {
      organizationId: organization.id,
      userId,
      membershipRole: req.membership?.role,
    });

    next();
  } catch (error) {
    logger.error('Organization access guard failed:', error);
    next(error);
  }
};

/**
 * Checks permissions across the user's primary role, secondary roles and role ancestry.
 */
export const roleHierarchyGuard = (requiredPermissions: string[] = []) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);

      if (requiredPermissions.length === 0) {
        return next();
      }

      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
        select: {
          userRoles: {
            select: { roleId: true },
          },
        },
      });

      if (!user) {
        return next(new AuthenticationError('Authenticated user not found'));
      }

      const roles = await prisma.role.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      const roleById = new Map(roles.map((role) => [role.id, role]));
      const assignedRoleIds = new Set<string>(user.userRoles.map((userRole) => userRole.roleId));

      const permissions = new Set<string>();
      const visitedRoles = new Set<string>();

      const collectRolePermissions = (roleId: string): void => {
        if (visitedRoles.has(roleId)) {
          return;
        }
        visitedRoles.add(roleId);

        const role = roleById.get(roleId);
        if (!role) {
          return;
        }

        role.rolePermissions.forEach((rolePermission) => {
          permissions.add(rolePermission.permission.slug);
        });

        if (role.parentId) {
          collectRolePermissions(role.parentId);
        }
      };

      assignedRoleIds.forEach(collectRolePermissions);

      const hasAllPermissions = requiredPermissions.every((permission) => permissions.has(permission));
      if (!hasAllPermissions) {
        logger.warn('Permission denied', {
          userId,
          requiredPermissions,
          userPermissions: Array.from(permissions),
        });
        return next(new AuthorizationError('Insufficient permissions'));
      }

      req.userPermissions = Array.from(permissions);
      const firstRoleId = user.userRoles[0]?.roleId;
      if (firstRoleId) {
        const primaryRole = roleById.get(firstRoleId);
        if (primaryRole) {
          req.userRole = primaryRole;
        }
      }

      logger.debug('Role hierarchy access granted', {
        userId,
        requiredPermissions,
      });

      next();
    } catch (error) {
      logger.error('Role hierarchy guard failed:', error);
      next(error);
    }
  };

/**
 * Verifies tenant-scoped ownership for resources that expose an owner/creator field.
 */
export const dataOwnershipGuard = (
  resource: TenantScopedResource = 'lead',
  ownershipField = 'createdById',
) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const resourceId = getSingleValue(req.params.id) ?? getSingleValue(req.body?.id) ?? getSingleValue(req.query.id);

    if (!resourceId) {
      return next();
    }

    const delegate = tenantScopedDelegates[resource];
    const record = await delegate.findFirst({
      where: {
        id: resourceId,
        tenantId,
        deletedAt: null,
        [ownershipField]: userId,
      },
      select: { id: true },
    });

    if (!record) {
      return next(new AuthorizationError('Access denied: data ownership required'));
    }

    next();
  } catch (error) {
    logger.error('Data ownership guard failed:', error);
    next(error);
  }
};

/**
 * Non-blocking audit logging for tenant-scoped API operations.
 */
export const auditLogger = (action: string, entity: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const tenantId = req.tenantId ?? req.user?.tenantId;
      if (!tenantId) {
        return;
      }

      const rawEntityId = getSingleValue(req.params.id) ?? getSingleValue(req.body?.id);
      const entityId = rawEntityId && isUuid(rawEntityId) ? rawEntityId : undefined;
      const duration = Date.now() - startedAt;
      const statusCode = res.statusCode;
      const riskLevel = action.includes('DELETE') || statusCode >= 400
        ? 'medium'
        : action.includes('ADMIN') || entity.includes('USER')
          ? 'high'
          : 'low';

      const data: Prisma.AuditLogUncheckedCreateInput = {
        action,
        entity,
        description: `${action} ${entity} by ${req.user?.email ?? 'system'}`,
        tenantId,
        metadata: {
          method: req.method,
          path: req.originalUrl,
          statusCode,
          duration,
          query: req.query,
        },
        riskLevel,
      };

      if (entityId) data.entityId = entityId;
      if (req.ip) data.ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      if (userAgent) data.userAgent = userAgent;
      if (req.sessionId) data.sessionId = req.sessionId;
      if (req.requestId) data.requestId = req.requestId;
      if (req.organizationId) data.organizationId = req.organizationId;
      if (req.user?.userId) data.userId = req.user.userId;
      if (req.membershipId) data.membershipId = req.membershipId;

      void prisma.auditLog.create({ data }).catch((error) => {
        logger.error('Audit logging failed:', error);
      });
    });

    next();
  };

/**
 * In-memory tenant-aware limiter for routes that need stricter tenant isolation.
 */
export const tenantRateLimit = (windowMs = 900000, maxRequests = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const tenantId = req.tenantId ?? req.user?.tenantId ?? 'anonymous';
    const now = Date.now();
    const windowKey = `${tenantId}:${Math.floor(now / windowMs)}`;
    const current = requests.get(windowKey) ?? { count: 0, resetTime: now + windowMs };

    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    current.count += 1;
    requests.set(windowKey, current);

    if (Math.random() < 0.01) {
      for (const [key, value] of requests.entries()) {
        if (now > value.resetTime) {
          requests.delete(key);
        }
      }
    }

    if (current.count > maxRequests) {
      logger.warn('Tenant rate limit exceeded', { tenantId, count: current.count });
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      });
      return;
    }

    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - current.count).toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
    });

    next();
  };
};

/**
 * Checks tenant plan and explicit tenant feature flags.
 */
export const featureFlagGuard = (featureName: string) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, settings: true },
      });

      if (!tenant) {
        return next(new AuthorizationError('Tenant not found'));
      }

      const planFeatures: Record<string, string[]> = {
        basic: ['leads', 'customers'],
        standard: ['leads', 'customers', 'opportunities', 'reports'],
        premium: ['leads', 'customers', 'opportunities', 'reports', 'analytics', 'automation'],
        enterprise: [
          'leads',
          'customers',
          'opportunities',
          'reports',
          'analytics',
          'automation',
          'api',
          'white-label',
          'organizations',
          'audit',
        ],
      };

      const allowedFeatures = planFeatures[tenant.plan] ?? [];
      const customFeatures = tenant.settings as { features?: Record<string, boolean> } | null;

      if (!allowedFeatures.includes(featureName) && customFeatures?.features?.[featureName] !== true) {
        return next(new AuthorizationError(`Feature '${featureName}' not available for your plan`));
      }

      next();
    } catch (error) {
      logger.error('Feature flag guard failed:', error);
      next(error);
    }
  };
