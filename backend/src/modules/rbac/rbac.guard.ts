import type { FastifyReply, FastifyRequest } from 'fastify';

import { AuthorizationError, AuthenticationError } from '../../types/index.js';
import { recordRequestSecurityEvent } from '../security-events/index.js';

const normalize = (value: string | string[]) =>
  Array.isArray(value) ? value : [value];

const canonicalizePermission = (permission: string): string => {
  const normalized = String(permission ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'move':
    case 'move_card':
    case 'move_opportunity':
      return 'move_stage';
    case 'edit_pipeline':
      return 'pipelines:manage';
    case 'opportunity:move':
    case 'opportunity:move_opportunity':
      return 'opportunity:move_stage';
    case 'oportunidades:move':
    case 'oportunidades:move_card':
      return 'oportunidades:move_stage';
    case 'oportunidades:edit_pipeline':
      return 'pipelines:manage';
    default:
      return normalized;
  }
};

const permissionVariants = (permission: string): string[] => {
  const canonical = canonicalizePermission(permission);
  const variants = new Set<string>([canonical]);

  switch (canonical) {
    case 'move_stage':
      variants.add('move');
      variants.add('move_card');
      variants.add('move_opportunity');
      break;
    case 'opportunity:move_stage':
      variants.add('opportunity:move');
      variants.add('opportunity:move_opportunity');
      break;
    case 'oportunidades:move_stage':
      variants.add('oportunidades:move');
      variants.add('oportunidades:move_card');
      break;
    case 'pipelines:manage':
      variants.add('edit_pipeline');
      variants.add('oportunidades:edit_pipeline');
      break;
    default:
      break;
  }

  return Array.from(variants);
};

const permissionMatches = (grantedPermission: string, requiredPermission: string): boolean => {
  const required = canonicalizePermission(requiredPermission);
  const requiredVariants = new Set(permissionVariants(required));
  const grantedVariants = permissionVariants(grantedPermission);

  for (const granted of grantedVariants) {
    if (granted === '*') {
      return true;
    }

    if (requiredVariants.has(granted)) {
      return true;
    }

    const [grantedResource, grantedAction] = granted.split(':');
    const [requiredResource, requiredAction] = required.split(':');

    if (!grantedAction || !requiredAction) {
      continue;
    }

    if (grantedAction === '*' && grantedResource === requiredResource) {
      return true;
    }

    const isOpportunityResourcePair =
      (grantedResource === 'opportunity' || grantedResource === 'oportunidades') &&
      (requiredResource === 'opportunity' || requiredResource === 'oportunidades');

    if (grantedAction === '*' && isOpportunityResourcePair) {
      return true;
    }

    if (
      required === 'pipelines:manage' &&
      grantedAction === '*' &&
      (grantedResource === 'opportunity' || grantedResource === 'oportunidades')
    ) {
      return true;
    }
  }

  return false;
};

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
  const permissions = normalize(requiredPermissions).map(canonicalizePermission);

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
      (user.permissions ?? []).some((grantedPermission) =>
        permissionMatches(grantedPermission, permission),
      ),
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
