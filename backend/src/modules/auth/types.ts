// ============================================
// FINQZ PRO - Auth Module Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    role: string;
    tenantId: string;
    tenantName: string;
    permissions?: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface SessionRoleResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface SessionUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: string;
  perfil: string;
  tenantId: string;
  tenantName: string;
  roles: SessionRoleResponse[];
  permissions: string[];
}

export interface SessionResponse {
  user: SessionUserResponse;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
