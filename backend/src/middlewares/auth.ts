// ============================================
// FINQZ PRO - Authentication Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../types';
import { prisma } from '../database/prisma';
import { createModuleLogger } from '../shared/logger';

const logger = createModuleLogger('AuthMiddleware');

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies access token and attaches user context to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token signature and expiration
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        isActive: true,
        tenantId: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Verify tenant is still active
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new AuthenticationError('Tenant not found or inactive');
    }

    // Attach user context to request
    req.user = {
      ...decoded,
      tenantId: user.tenantId,
    };
    req.tenantId = user.tenantId;

    logger.debug(`User authenticated: ${decoded.userId} (tenant: ${user.tenantId})`);
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }
    logger.error('Authentication failed:', error);
    next(new AuthenticationError('Invalid token'));
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has one of the required roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      // Fetch user's role with permissions
      const userRole = await prisma.role.findUnique({
        where: { id: req.user.roleId },
        select: {
          slug: true,
          name: true,
          permissions: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (!userRole) {
        throw new AuthenticationError('User role not found', 401);
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole.slug)) {
        logger.warn(
          `Authorization failed: User ${req.user.userId} tried to access resource with role ${userRole.slug}`
        );
        throw new AuthorizationError('Insufficient permissions', 403);
      }

      logger.debug(`User ${req.user.userId} authorized with role: ${userRole.slug}`);
      next();
    } catch (error) {
      if (error instanceof (AuthenticationError || AuthorizationError)) {
        return next(error);
      }
      logger.error('Authorization check failed:', error);
      next(new AuthorizationError('Authorization check failed', 403));
    }
  };
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has required permissions
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      // Fetch user's permissions through their role
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
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
        throw new AuthenticationError('User role not found', 401);
      }

      const userPermissions = user.role.permissions.map((p) => p.slug);
      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        logger.warn(
          `Permission denied: User ${req.user.userId} missing permissions: ${requiredPermissions.join(', ')}`
        );
        throw new AuthorizationError('Insufficient permissions', 403);
      }

      logger.debug(`User ${req.user.userId} has required permissions`);
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
 * Multi-tenant Guard Middleware
 * Ensures user can only access their tenant's data
 */
export const tenantGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.tenantId) {
      throw new AuthenticationError('Authentication required', 401);
    }

    // Verify tenant is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new AuthenticationError('Tenant not found or inactive', 401);
    }

    logger.debug(`Tenant guard verified for: ${req.tenantId}`);
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }
    logger.error('Tenant guard failed:', error);
    next(new AuthenticationError('Tenant verification failed', 401));
  }
};

/**
 * Optional Authentication Middleware
 * Doesn't fail if no token, but attaches user if valid token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { tenantId: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = { ...decoded, tenantId: user.tenantId };
        req.tenantId = user.tenantId;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    logger.debug('Optional auth: skipping authentication');
    next();
  }
};
