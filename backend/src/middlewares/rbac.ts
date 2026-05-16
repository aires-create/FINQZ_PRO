// ============================================
// FINQZ PRO - RBAC Middleware
// ============================================

// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../types/index.js';
import { prisma } from '../database/prisma.js';
import { createModuleLogger } from '../shared/logger.js';
import { authenticate } from './auth.js';

const logger = createModuleLogger('RBACMiddleware');

type RoleRecord = {
  id: string;
  slug: string;
  parentId: string | null;
  rolePermissions: Array<{ permission: { slug: string } }>;
};

const getTenantId = (req: Request): string => {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    throw new AuthorizationError('Tenant context required');
  }
  return tenantId;
};

const buildUserWhere = (userId: string, tenantId?: string) => ({
  id: userId,
  ...(tenantId ? { tenantId } : {}),
});

async function getUserRoleAssignments(userId: string, tenantId?: string) {
  return prisma.user.findUnique({
    where: buildUserWhere(userId, tenantId),
    select: {
      userRoles: {
        select: {
          roleId: true,
        },
      },
    },
  });
}

async function getTenantRoles(tenantId: string): Promise<RoleRecord[]> {
  return prisma.role.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      parentId: true,
      rolePermissions: {
        select: {
          permission: {
            select: { slug: true },
          },
        },
      },
    },
  });
}

function collectRolePermissions(roleId: string, roleById: Map<string, RoleRecord>, permissions: Set<string>, visited: Set<string>): void {
  if (visited.has(roleId)) {
    return;
  }
  visited.add(roleId);

  const role = roleById.get(roleId);
  if (!role) {
    return;
  }

  role.rolePermissions.forEach((rolePermission) => {
    permissions.add(rolePermission.permission.slug);
  });

  if (role.parentId) {
    collectRolePermissions(role.parentId, roleById, permissions, visited);
  }
}

function collectRoleSlugs(roleId: string, roleById: Map<string, RoleRecord>, slugs: Set<string>, visited: Set<string>): void {
  if (visited.has(roleId)) {
    return;
  }
  visited.add(roleId);

  const role = roleById.get(roleId);
  if (!role) {
    return;
  }

  slugs.add(role.slug);
  if (role.parentId) {
    collectRoleSlugs(role.parentId, roleById, slugs, visited);
  }
}

async function getUserPermissions(userId: string, tenantId?: string): Promise<Set<string>> {
  if (!tenantId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
    if (user?.userRoles) {
      user.userRoles.forEach((userRole: any) => {
        userRole.role?.rolePermissions?.forEach((rp: any) => {
          if (rp?.permission?.slug) {
            permissionSlugs.add(rp.permission.slug);
          }
        });
      });
    }

    return permissionSlugs;
  }

  const assignment = await getUserRoleAssignments(userId, tenantId);
  const permissions = new Set<string>();

  if (!assignment) {
    return permissions;
  }

  const roleIds = new Set<string>();
  assignment.userRoles.forEach(({ roleId }) => {
    if (roleId) {
      roleIds.add(roleId);
    }
  });

  if (roleIds.size === 0) {
    return permissions;
  }

  const tenantRoles = await getTenantRoles(tenantId);
  const roleById = new Map(tenantRoles.map((role) => [role.id, role]));
  const visited = new Set<string>();

  roleIds.forEach((roleId) => collectRolePermissions(roleId, roleById, permissions, visited));
  return permissions;
}

async function getUserRoleSlugs(userId: string, tenantId?: string): Promise<string[]> {
  if (!tenantId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
    if (user?.userRoles) {
      user.userRoles.forEach((userRole: any) => {
        if (userRole.role?.slug) {
          slugs.add(userRole.role.slug);
        }
      });
    }

    return Array.from(slugs);
  }

  const assignment = await getUserRoleAssignments(userId, tenantId);
  const roleSlugs = new Set<string>();

  if (!assignment) {
    return [];
  }

  const roleIds = new Set<string>();
  assignment.userRoles.forEach(({ roleId }) => {
    if (roleId) {
      roleIds.add(roleId);
    }
  });

  if (roleIds.size === 0) {
    return [];
  }

  const tenantRoles = await getTenantRoles(tenantId);
  const roleById = new Map(tenantRoles.map((role) => [role.id, role]));
  const visited = new Set<string>();

  roleIds.forEach((roleId) => collectRoleSlugs(roleId, roleById, roleSlugs, visited));
  return Array.from(roleSlugs);
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
      const userPermissions = await getUserPermissions(req.user.userId, tenantId);
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
      const userPermissions = await getUserPermissions(req.user.userId, tenantId);
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
      const userRoleSlugs = await getUserRoleSlugs(req.user.userId, tenantId);
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
    const roleSlugs = await getUserRoleSlugs(req.user.userId, tenantId);
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

