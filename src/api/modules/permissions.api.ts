import { apiCall, buildQueryString, ApiResult } from './base';

export interface PermissionResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  resource: string;
  action: string;
  createdAt: string;
}

export interface PermissionsFilters {
  page?: number;
  limit?: number;
}

export interface CreatePermissionPayload {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  description?: string;
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

const PERMISSIONS_BASE_PATH = '/api/v1/permissions';

export const permissionsApi = {
  async getAll(filters?: PermissionsFilters): Promise<BackendPaginatedResponse<PermissionResponse>> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<BackendPaginatedResponse<PermissionResponse>>(`${PERMISSIONS_BASE_PATH}${query}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: PermissionResponse; message?: string }> {
    return apiCall<{ success: boolean; data: PermissionResponse; message?: string }>(`${PERMISSIONS_BASE_PATH}/${id}`);
  },

  async getByResource(resource: string): Promise<{ success: boolean; data: PermissionResponse[]; message?: string }> {
    return apiCall<{ success: boolean; data: PermissionResponse[]; message?: string }>(
      `${PERMISSIONS_BASE_PATH}/resource/${resource}`
    );
  },

  async create(data: CreatePermissionPayload): Promise<{ success: boolean; data: PermissionResponse; message?: string }> {
    return apiCall<{ success: boolean; data: PermissionResponse; message?: string }>(PERMISSIONS_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdatePermissionPayload): Promise<{ success: boolean; data: PermissionResponse; message?: string }> {
    return apiCall<{ success: boolean; data: PermissionResponse; message?: string }>(`${PERMISSIONS_BASE_PATH}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    return apiCall<{ success: boolean; message?: string }>(`${PERMISSIONS_BASE_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};

export const permissionsApiResult = {
  async getAll(filters?: PermissionsFilters): Promise<ApiResult<BackendPaginatedResponse<PermissionResponse>>> {
    try {
      const data = await permissionsApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
