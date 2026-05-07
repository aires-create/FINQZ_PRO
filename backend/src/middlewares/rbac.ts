// ============================================
// FINQZ PRO - RBAC Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../types';
import { prisma } from '../database/prisma';
import { createModuleLogger } from '../shared/logger';

const logger = createModuleLogger('RBACMiddleware');

/**
 * Get user's permissions
 */
async function getUserPermissions(userId: string): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) {
    return new Set();
  }

  return new Set(user.role.permissions.map((p) => p.slug));
}

/**
 * Check if user has all required permissions
 */
export const requireAllPermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      const userPermissions = await getUserPermissions(req.user.userId);

      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions.has(perm)
      );

      if (!hasAllPermissions) {
        logger.warn(
          `Permission denied: User ${req.user.userId} missing required permissions`
        );
        throw new AuthorizationError('Insufficient permissions', 403);
      }

      logger.debug(
        `User ${req.user.userId} has all required permissions: ${requiredPermissions.join(', ')}`
      );
      next();
    } catch (error) {
      if (error instanceof (AuthenticationError || AuthorizationError)) {
        return next(error);
      }
      logger.error('Permission check failed:', error);
      next(new AuthorizationError('Permission check failed', 403));
    }
  };
};

/**
 * Check if user has any of the required permissions
 */
export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      const userPermissions = await getUserPermissions(req.user.userId);

      const hasAnyPermission = requiredPermissions.some((perm) =>
        userPermissions.has(perm)
      );

      if (!hasAnyPermission) {
        logger.warn(
          `Permission denied: User ${req.user.userId} missing all requested permissions`
        );
        throw new AuthorizationError('Insufficient permissions', 403);
      }

      logger.debug(
        `User ${req.user.userId} has one of required permissions: ${requiredPermissions.join(', ')}`
      );
      next();
    } catch (error) {
      if (error instanceof (AuthenticationError || AuthorizationError)) {
        return next(error);
      }
      logger.error('Permission check failed:', error);
      next(new AuthorizationError('Permission check failed', 403));
    }
  };
};

/**
 * Check if user has specific role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          role: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (!user?.role) {
        throw new AuthenticationError('User role not found', 401);
      }

      if (!allowedRoles.includes(user.role.slug)) {
        logger.warn(
          `Role denied: User ${req.user.userId} has role ${user.role.slug}`
        );
        throw new AuthorizationError('Insufficient permissions', 403);
      }

      logger.debug(
        `User ${req.user.userId} authorized with role: ${user.role.slug}`
      );
      next();
    } catch (error) {
      if (error instanceof (AuthenticationError || AuthorizationError)) {
        return next(error);
      }
      logger.error('Role check failed:', error);
      next(new AuthorizationError('Role check failed', 403));
    }
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        role: {
          select: {
            slug: true,
            isSystem: true,
          },
        },
      },
    });

    if (!user?.role || user.role.slug !== 'admin') {
      logger.warn(`Admin access denied: User ${req.user.userId}`);
      throw new AuthorizationError('Admin access required', 403);
    }

    logger.debug(`Admin access granted: ${req.user.userId}`);
    next();
  } catch (error) {
    if (error instanceof (AuthenticationError || AuthorizationError)) {
      return next(error);
    }
    logger.error('Admin check failed:', error);
    next(new AuthorizationError('Admin check failed', 403));
  }
};

/**
 * Resource ownership check
 * Verifies that the authenticated user owns the resource
 */
export const requireResourceOwnership = (resourceField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      const resourceOwnerId = req.params[resourceField] || req.body[resourceField];

      if (!resourceOwnerId) {
        logger.warn('Resource field not found in request');
        throw new AuthorizationError('Invalid resource request', 400);
      }

      if (resourceOwnerId !== req.user.userId) {
        logger.warn(
          `Ownership denied: User ${req.user.userId} tried to access resource owned by ${resourceOwnerId}`
        );
        throw new AuthorizationError('You do not own this resource', 403);
      }

      logger.debug(`Ownership verified for user: ${req.user.userId}`);
      next();
    } catch (error) {
      if (error instanceof (AuthenticationError || AuthorizationError)) {
        return next(error);
      }
      logger.error('Ownership check failed:', error);
      next(new AuthorizationError('Ownership check failed', 403));
    }
  };
};

/**
 * Attach user's roles and permissions to request
 */
export const attachUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        },
      },
    });

    if (user?.role) {
      (req as any).userContext = {
        role: user.role,
        permissions: new Set(user.role.permissions.map((p) => p.slug)),
      };
    }

    next();
  } catch (error) {
    logger.error('Failed to attach user context:', error);
    next(error);
  }
};
