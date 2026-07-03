// ============================================
// FINQZ PRO - RBAC Middleware
// ============================================

// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../types/index.js';
import { createModuleLogger } from '../shared/logger.js';
import { authenticate } from './auth.js';

const logger = createModuleLogger('RBACMiddleware');

const getTenantId = (req: Request): string => {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    throw new AuthorizationError('Tenant context required');
  }
  return tenantId;
};
const normalizePermissions = (permissions: string[] | undefined): Set<string> => {
  const normalized = new Set<string>();

  (permissions ?? []).forEach((permission) => {
    const value = String(permission ?? '').trim().toLowerCase();
    if (value) {
      normalized.add(value);
    }
  });

  return normalized;
};

async function getUserPermissions(req: Request): Promise<Set<string>> {
  return normalizePermissions(req.user?.permissions);
}

async function getUserRoleSlugs(req: Request): Promise<string[]> {
  const role = req.user?.role;
  if (!role) {
    return [];
  }

  return [String(role).trim().toLowerCase()];
}

export const requireAuth = authenticate;
export const requirePermission = (...requiredPermissions: string[]) => requireAnyPermission(...requiredPermissions);

export const requireAllPermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const tenantId = getTenantId(req);
      const userPermissions = await getUserPermissions(req);
      const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.has(perm));

      if (!hasAllPermissions) {
        logger.warn(`Permission denied: User ${req.user.userId} missing required permissions`);
        throw new AuthorizationError('Insufficient permissions');
      }

      logger.debug(`User ${req.user.userId} has all required permissions: ${requiredPermissions.join(', ')}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return next(error);
      }
      logger.error('Permission check failed:', error);
      next(new AuthorizationError('Permission check failed'));
    }
  };
};

export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const tenantId = getTenantId(req);
      const userPermissions = await getUserPermissions(req);
      const hasAnyPermission = requiredPermissions.some((perm) => userPermissions.has(perm));

      if (!hasAnyPermission) {
        logger.warn(`Permission denied: User ${req.user.userId} missing all requested permissions`);
        throw new AuthorizationError('Insufficient permissions');
      }

      logger.debug(`User ${req.user.userId} has one of required permissions: ${requiredPermissions.join(', ')}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return next(error);
      }
      logger.error('Permission check failed:', error);
      next(new AuthorizationError('Permission check failed'));
    }
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const tenantId = getTenantId(req);
      const userRoleSlugs = await getUserRoleSlugs(req);
      const matchedRole = userRoleSlugs.find((slug) => allowedRoles.includes(slug));

      if (!matchedRole) {
        logger.warn(`Role denied: User ${req.user.userId} has roles [${userRoleSlugs.join(', ')}]`);
        throw new AuthorizationError('Insufficient permissions');
      }

      logger.debug(`User ${req.user.userId} authorized with role: ${matchedRole}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return next(error);
      }
      logger.error('Role check failed:', error);
      next(new AuthorizationError('Role check failed'));
    }
  };
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const tenantId = getTenantId(req);
    const roleSlugs = await getUserRoleSlugs(req);
    if (!roleSlugs.includes('admin')) {
      logger.warn(`Admin access denied: User ${req.user.userId}`);
      throw new AuthorizationError('Admin access required');
    }

    logger.debug(`Admin access granted: ${req.user.userId}`);
    next();
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return next(error);
    }
    logger.error('Admin check failed:', error);
    next(new AuthorizationError('Admin check failed'));
  }
};

export const requireResourceOwnership = (resourceField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const resourceOwnerId = req.params[resourceField] || req.body[resourceField];
      if (!resourceOwnerId) {
        logger.warn('Resource field not found in request');
        throw new AuthorizationError('Invalid resource request', 400);
      }

      if (resourceOwnerId !== req.user.userId) {
        logger.warn(`Ownership denied: User ${req.user.userId} tried to access resource owned by ${resourceOwnerId}`);
        throw new AuthorizationError('You do not own this resource', 403);
      }

      logger.debug(`Ownership verified for user: ${req.user.userId}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return next(error);
      }
      logger.error('Ownership check failed:', error);
      next(new AuthorizationError('Ownership check failed'));
    }
  };
};

export const attachUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const role = req.user.role
      ? {
          id: req.user.role,
          name: req.user.role,
          slug: req.user.role,
          type: 'STANDARD',
          rolePermissions: [],
        }
      : null;

    (req as any).userContext = {
      roles: role ? [role] : [],
      permissions: normalizePermissions(req.user.permissions),
    };

    next();
  } catch (error) {
    logger.error('Failed to attach user context:', error);
    next(error);
  }
};

