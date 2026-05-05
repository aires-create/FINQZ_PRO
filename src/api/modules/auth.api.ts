// FINQZ PRO - Auth API Module
// Endpoints para autenticação padronizada com access_code

import { apiCall, buildQueryString, ApiResult } from './base';
import type { LoginCredentials, LoginResult, AuthUser, CreateUserData, UserStatus, AccessScope } from '../../types';
import { isAccessCodeInput, normalizeLoginInput } from '../../utils/auth';

// ============================================
// TYPES
// ============================================

export interface AuthFilters {
  search?: string;
  role?: string;
  status?: UserStatus;
  scope?: AccessScope;
}

export interface UpdateUserPayload {
  nome?: string;
  email?: string;
  role?: string;
  status?: UserStatus;
  partner_id?: number;
  scope?: AccessScope;
  mfa_enabled?: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordPayload {
  user_id: string;
  send_email?: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

export const authApi = {
  /**
   * Login com access_code ou e-mail
   * Aceita ambos durante período de migração
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const normalizedInput = normalizeLoginInput(credentials.access_code_or_email);
    
    // Determina se é access_code ou email
    const isCode = isAccessCodeInput(credentials.access_code_or_email);
    
    const payload = isCode
      ? { access_code: normalizedInput.toUpperCase(), senha: credentials.senha }
      : { email: normalizedInput, senha: credentials.senha };

    try {
      const result = await apiCall<LoginResult>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
      };
    }
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    return apiCall<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthUser> {
    return apiCall<AuthUser>('/api/auth/refresh', {
      method: 'POST',
    });
  },

  /**
   * Verifica se usuário está autenticado
   */
  async verifyAuth(): Promise<AuthUser | null> {
    try {
      return await apiCall<AuthUser>('/api/auth/verify');
    } catch {
      return null;
    }
  },

  /**
   * Alterar senha
   */
  async changePassword(data: ChangePasswordPayload): Promise<ApiResult<void>> {
    try {
      await apiCall<void>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Solicitar recuperação de senha
   */
  async requestPasswordReset(email: string): Promise<ApiResult<void>> {
    try {
      await apiCall<void>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Confirmar recuperação de senha
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<ApiResult<void>> {
    try {
      await apiCall<void>('/api/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Validar token de recuperação
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      await apiCall<{ valid: boolean }>('/api/auth/reset-password/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================
// ADMIN API FUNCTIONS
// ============================================

export const adminAuthApi = {
  /**
   * Listar todos os usuários (admin)
   */
  async getUsers(filters?: AuthFilters): Promise<AuthUser[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : '';
    return apiCall<AuthUser[]>(`/api/admin/users${query}`);
  },

  /**
   * Get user by ID (admin)
   */
  async getUserById(id: string): Promise<AuthUser> {
    return apiCall<AuthUser>(`/api/admin/users/${id}`);
  },

  /**
   * Create new user (admin)
   * Retorna senha temporária se for novo usuário
   */
  async createUser(data: CreateUserData): Promise<{ user: AuthUser; temporary_password?: string }> {
    return apiCall<{ user: AuthUser; temporary_password?: string }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user (admin)
   */
  async updateUser(id: string, data: UpdateUserPayload): Promise<AuthUser> {
    return apiCall<AuthUser>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete user (admin)
   */
  async deleteUser(id: string): Promise<void> {
    return apiCall<void>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reset user password (admin)
   * Gera nova senha temporária
   */
  async resetUserPassword(id: string, sendEmail: boolean = true): Promise<{ temporary_password: string }> {
    return apiCall<{ temporary_password: string }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ send_email: sendEmail }),
    });
  },

  /**
   * Toggle user status (admin)
   */
  async toggleUserStatus(id: string): Promise<AuthUser> {
    return apiCall<AuthUser>(`/api/admin/users/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  /**
   * Unlock user (admin)
   */
  async unlockUser(id: string): Promise<AuthUser> {
    return apiCall<AuthUser>(`/api/admin/users/${id}/unlock`, {
      method: 'POST',
    });
  },

  /**
   * Migrar usuários existentes para access_code
   */
  async migrateUsers(): Promise<{ migrated: number; errors: string[] }> {
    return apiCall<{ migrated: number; errors: string[] }>('/api/admin/users/migrate', {
      method: 'POST',
    });
  },

  /**
   * Get próximo código disponível
   */
  async getNextAccessCode(type: 'INTERNAL' | 'PARTNER'): Promise<string> {
    return apiCall<string>(`/api/admin/users/next-access-code?type=${type}`);
  },
};
