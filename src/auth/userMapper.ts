// FINQZ PRO - Backend auth user mapper
// Normalizes the enterprise backend auth contract into the current frontend user shape.

import {
  ROLE_PERMISSIONS,
  ROLE_SCOPES,
  type AccessScope,
  type AuthUser,
  type Role,
  type Scope,
} from "../types";

export interface BackendAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

export interface BackendAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface BackendLoginResponse {
  success: boolean;
  data?: {
    user: BackendAuthUser;
    tokens: BackendAuthTokens;
  };
  message?: string;
}

export type MappedFinqzUser = AuthUser & {
  perfil: string;
  roleId: string;
  tenantName: string;
};

const DEFAULT_ROLE: Role = "ROLE_ASSISTENTE_BACKOFFICE";
const knownRoles = Object.keys(ROLE_PERMISSIONS) as Role[];

const roleAliases: Record<string, Role> = {
  admin: "ROLE_ADMIN_SISTEMA",
  administrator: "ROLE_ADMIN_SISTEMA",
  admin_sistema: "ROLE_ADMIN_SISTEMA",
  system_admin: "ROLE_ADMIN_SISTEMA",
  user: DEFAULT_ROLE,
  backoffice: DEFAULT_ROLE,
  assistant_backoffice: DEFAULT_ROLE,
  assistente_backoffice: DEFAULT_ROLE,
  ceo: "ROLE_CEO",
};

const isKnownRole = (role: string): role is Role => {
  return knownRoles.includes(role as Role);
};

const normalizeRoleKey = (role: string): string => {
  return role.trim().replace(/[\s-]+/g, "_");
};

const mapBackendRole = (backendRole: string): Role => {
  const role = normalizeRoleKey(backendRole);
  if (isKnownRole(role)) {
    return role;
  }

  const upperRole = role.toUpperCase();
  if (isKnownRole(upperRole)) {
    return upperRole;
  }

  const prefixedRole = `ROLE_${upperRole}`;
  if (isKnownRole(prefixedRole)) {
    return prefixedRole;
  }

  return roleAliases[role.toLowerCase()] ?? DEFAULT_ROLE;
};

const toAccessScope = (scope: Scope): AccessScope => {
  return scope === "OWN" ? "FRANQUEADO" : scope;
};

const buildDisplayName = (user: BackendAuthUser): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
};

export const mapBackendAuthUser = (user: BackendAuthUser): MappedFinqzUser => {
  const role = mapBackendRole(user.role);
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const now = Date.now();

  return {
    id: user.id,
    access_code: "",
    email: user.email,
    nome: buildDisplayName(user),
    role,
    roleId: user.roleId,
    scope: toAccessScope(ROLE_SCOPES[role]),
    tenant_id: user.tenantId,
    tenantName: user.tenantName,
    status: "ativo",
    must_change_password: false,
    failed_login_attempts: 0,
    last_login_at: now,
    mfa_enabled: false,
    permissions,
    created_at: now,
    updated_at: now,
    perfil: role,
  };
};

