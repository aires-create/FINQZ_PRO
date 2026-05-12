import { AuthorizationError, AuthenticationError } from '../../types';

const normalize = (value: string | string[]) =>
  Array.isArray(value) ? value : [value];

export const requireRoles = (acceptedRoles: string | string[]) => {
  const roles = normalize(acceptedRoles);

  return async (request: any, reply: any) => {
    const user = request.currentUser;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    const roleName = user.role;
    if (!roleName || !roles.includes(roleName)) {
      throw new AuthorizationError('Insufficient role privileges');
    }
  };
};

export const requirePermissions = (requiredPermissions: string | string[]) => {
  const permissions = normalize(requiredPermissions);

  return async (request: any, reply: any) => {
    const user = request.currentUser;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    const hasPermission = permissions.every((permission) =>
      user.permissions?.includes(permission),
    );

    if (!hasPermission) {
      throw new AuthorizationError('Insufficient permissions');
    }
  };
};
