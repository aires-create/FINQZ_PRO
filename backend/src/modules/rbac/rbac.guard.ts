import type { FastifyReply, FastifyRequest } from 'fastify';

import { AuthorizationError, AuthenticationError } from '../../types/index.js';
import { recordRequestSecurityEvent } from '../security-events/index.js';

const normalize = (value: string | string[]) =>
  Array.isArray(value) ? value : [value];

export const requireRoles = (acceptedRoles: string | string[]) => {
  const roles = normalize(acceptedRoles);

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.currentUser;

    if (!user) {
      recordRequestSecurityEvent(request, {
        eventType: 'AUTH_REQUIRED',
        severity: 'LOW',
        outcome: 'BLOCKED',
        metadata: {
          reason: 'missing_authenticated_user',
          source: 'rbac_roles',
        },
      });
      throw new AuthenticationError('Authentication required');
    }

    const roleName = user.role;
    if (!roleName || !roles.includes(roleName)) {
      recordRequestSecurityEvent(request, {
        eventType: 'RBAC_PERMISSION_DENIED',
        severity: 'MEDIUM',
        outcome: 'BLOCKED',
        tenantId: user.tenantId,
        userId: user.userId,
        metadata: {
          guard: 'requireRoles',
          requiredRoles: roles,
          ...(roleName ? { actualRole: roleName } : {}),
        },
      });
      throw new AuthorizationError('Insufficient role privileges');
    }
  };
};

export const requirePermissions = (requiredPermissions: string | string[]) => {
  const permissions = normalize(requiredPermissions);

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.currentUser;

    if (!user) {
      recordRequestSecurityEvent(request, {
        eventType: 'AUTH_REQUIRED',
        severity: 'LOW',
        outcome: 'BLOCKED',
        metadata: {
          reason: 'missing_authenticated_user',
          source: 'rbac_permissions',
        },
      });
      throw new AuthenticationError('Authentication required');
    }

    const hasPermission = permissions.every((permission) =>
      user.permissions?.includes(permission),
    );

    if (!hasPermission) {
      recordRequestSecurityEvent(request, {
        eventType: 'RBAC_PERMISSION_DENIED',
        severity: 'MEDIUM',
        outcome: 'BLOCKED',
        tenantId: user.tenantId,
        userId: user.userId,
        metadata: {
          guard: 'requirePermissions',
          requiredPermissions: permissions,
        },
      });
      throw new AuthorizationError('Insufficient permissions');
    }
  };
};
