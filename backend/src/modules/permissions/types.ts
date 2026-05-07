// ============================================
// FINQZ PRO - Permissions Module Types
// ============================================

export interface CreatePermissionRequest {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

export interface PermissionResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: Date;
}
