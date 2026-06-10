import { apiCall, buildQueryString, ApiResult } from './base';
import type { PermissionResponse } from './permissions.api';

export interface RoleResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  permissions: PermissionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface RolesFilters {
  page?: number;
  limit?: number;
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface BackendPaginatedResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ROLES_BASE_PATH = '/api/v1/roles';

export const rolesApi = {
  async getAll(filters?: RolesFilters): Promise<BackendPaginatedResponse<RoleResponse>> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<BackendPaginatedResponse<RoleResponse>>(`${ROLES_BASE_PATH}${query}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: RoleResponse; message?: string }> {
    return apiCall<{ success: boolean; data: RoleResponse; message?: string }>(`${ROLES_BASE_PATH}/${id}`);
  },

  async create(data: CreateRolePayload): Promise<{ success: boolean; data: RoleResponse; message?: string }> {
    return apiCall<{ success: boolean; data: RoleResponse; message?: string }>(ROLES_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateRolePayload): Promise<{ success: boolean; data: RoleResponse; message?: string }> {
    return apiCall<{ success: boolean; data: RoleResponse; message?: string }>(`${ROLES_BASE_PATH}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    return apiCall<{ success: boolean; message?: string }>(`${ROLES_BASE_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};

export const rolesApiResult = {
  async getAll(filters?: RolesFilters): Promise<ApiResult<BackendPaginatedResponse<RoleResponse>>> {
    try {
      const data = await rolesApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
