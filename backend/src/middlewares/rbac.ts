// ============================================
// FINQZ PRO - RBAC Middleware
// ============================================

// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../types';
import { prisma } from '../database/prisma';
import { createModuleLogger } from '../shared/logger';
import { authenticate } from './auth';

const logger = createModuleLogger('RBACMiddleware');

async function getUserPermissions(userId: string): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: {
              permission: {
                select: { slug: true },
              },
            },
          },
        },
      },
      userRoles: {
        select: {
          role: {
            select: {
              rolePermissions: {
                select: {
                  permission: {
                    select: { slug: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const permissionSlugs = new Set<string>();

  if (user?.role?.rolePermissions) {
    user.role.rolePermissions.forEach((rp: any) => {
      permissionSlugs.add(rp.permission.slug);
    });
  }

  if (user?.userRoles) {
    user.userRoles.forEach((userRole: any) => {
      userRole.role.rolePermissions.forEach((rp: any) => {
        permissionSlugs.add(rp.permission.slug);
      });
    });
  }

  return permissionSlugs;
}

async function getUserRoleSlugs(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: { slug: true },
      },
      userRoles: {
        select: {
          role: {
            select: { slug: true },
          },
        },
      },
    },
  });

  const slugs = new Set<string>();
  if (user?.role?.slug) {
    slugs.add(user.role.slug);
  }

  if (user?.userRoles) {
    user.userRoles.forEach((userRole: any) => {
      if (userRole.role?.slug) {
        slugs.add(userRole.role.slug);
      }
    });
  }

  return Array.from(slugs);
}

export const requireAuth = authenticate;
export const requirePermission = (...requiredPermissions: string[]) => requireAnyPermission(...requiredPermissions);

export const requireAllPermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userPermissions = await getUserPermissions(req.user.userId);
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

      const userPermissions = await getUserPermissions(req.user.userId);
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

      const userRoleSlugs = await getUserRoleSlugs(req.user.userId);
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

    const roleSlugs = await getUserRoleSlugs(req.user.userId);
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            rolePermissions: {
              select: {
                permission: {
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
        },
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                rolePermissions: {
                  select: {
                    permission: {
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
            },
          },
        },
      },
    });

    const roles = new Map<string, any>();
    const permissionSet = new Set<string>();

    if (user?.role) {
      roles.set(user.role.slug, user.role);
      user.role.rolePermissions.forEach((rp: any) => permissionSet.add(rp.permission.slug));
    }

    if (user?.userRoles) {
      user.userRoles.forEach((userRole: any) => {
        const role = userRole.role;
        if (role && !roles.has(role.slug)) {
          roles.set(role.slug, role);
        }
        role.rolePermissions.forEach((rp: any) => permissionSet.add(rp.permission.slug));
      });
    }

    (req as any).userContext = {
      roles: Array.from(roles.values()),
      permissions: permissionSet,
    };

    next();
  } catch (error) {
    logger.error('Failed to attach user context:', error);
    next(error);
  }
};

