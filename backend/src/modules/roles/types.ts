// ============================================
// FINQZ PRO - Roles Module Types
// ============================================

export interface CreateRoleRequest {
  name: string;
  slug: string;
  description?: string;
  permissions?: string[]; // Permission IDs or slugs
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  permissions: {
    id: string;
    name: string;
    slug: string;
    resource: string;
    action: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
