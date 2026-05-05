/**
 * FINQZ PRO - Security Middleware
 * Centralized authorization and authentication middleware
 */

import type { Context, Next } from 'hono';
import type { Client } from '@sdk/server-types';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  perfil: string;
  tenantId?: string;
  parceiroId?: number;
  permissions: string[];
  scope: 'GLOBAL' | 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO' | 'OWN';
}

export interface PermissionCheck {
  resource: string;
  action: 'create' | 'read' | 'edit' | 'delete' | 'export' | 'move' | '*';
}

// RBAC: Mapeamento de permissões por role
// SECURITY: deny-by-default - nega por padrão
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Roles de sistema
  'ROLE_ADMIN_SISTEMA': ['*'],
  'ADMIN_SISTEMA': ['*'],
  'ROLE_CEO': ['*'],
  'CEO': ['*'],
  
  // Roles de franquia
  'ADMIN_FRANQUIA': ['clientes:*', 'oportunidades:*', 'parceiros:*', 'produtos:*', 'financeiro:read', 'usuarios:read'],
  'GERENTE_FRANQUIA': ['clientes:*', 'oportunidades:*', 'parceiros:*', 'produtos:*', 'financeiro:read', 'usuarios:read'],
  
  // Franqueado
  'FRANQUEADO': ['clientes:read', 'clientes:create', 'clientes:edit', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move', 'parceiros:read'],
  'ROLE_FRANQUEADO': ['clientes:read', 'clientes:create', 'clientes:edit', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move', 'parceiros:read'],
  
  // SDR (Sales Development Representative)
  'SDR': ['clientes:read', 'clientes:create', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move'],
  'ROLE_SDR': ['clientes:read', 'clientes:create', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move'],
  'VENDEDOR': ['clientes:read', 'clientes:create', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move'],
  'ROLE_VENDEDOR_FRANQUIA': ['clientes:read', 'clientes:create', 'oportunidades:read', 'oportunidades:create', 'oportunidades:edit', 'oportunidades:move'],
  
  // Financeiro
  'FINANCEIRO': ['financeiro:read', 'financeiro:export', 'clientes:read', 'oportunidades:read'],
  'ROLE_FINANCEIRO': ['financeiro:read', 'financeiro:export', 'clientes:read', 'oportunidades:read'],
  
  // Operacional
  'OPERACIONAL': ['clientes:read', 'oportunidades:read', 'oportunidades:edit'],
  'ROLE_OPERACIONAL': ['clientes:read', 'oportunidades:read', 'oportunidades:edit'],
  
  // Roles legadas
  'ROLE_DIRETOR_COMERCIAL': ['clientes:*', 'oportunidades:*', 'parceiros:*', 'produtos:*', 'financeiro:read', 'usuarios:read'],
  'ROLE_GERENTE_COMERCIAL': ['clientes:*', 'oportunidades:*', 'parceiros:read', 'produtos:read', 'financeiro:read'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current user from request context
 */
export function getCurrentUser(c: Context): AuthUser | null {
  const user = c.get('user') as AuthUser | undefined;
  return user || null;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AuthUser | null, resource: string, action: string): boolean {
  if (!user) return false;
  
  // Admin with wildcard has full access
  if (user.permissions.includes('*')) return true;
  
  // Get role-based permissions
  const role = user.role || user.perfil;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  // Check if user has wildcard for resource
  if (rolePermissions.includes('*')) return true;
  
  // Check specific permission
  const hasExactPermission = rolePermissions.some((p: string) => {
    const [r, a] = p.split(':');
    return (r === resource || r === '*') && (a === '*' || a === action);
  });
  
  if (hasExactPermission) return true;
  
  // Check user-level permissions
  return user.permissions.some((p: string) => {
    const [r, a] = p.split(':');
    return (r === resource || r === '*') && (a === '*' || a === action);
  });
}

/**
 * Can user perform action? (main RBAC helper)
 */
export function can(user: AuthUser | null, resource: string, action: string): boolean {
  return hasPermission(user, resource, action);
}

// ============================================
// MIDDLEWARE FACTORIES
// ============================================

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = getCurrentUser(c);
    
    if (!user) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Autenticação necessária' 
      }, 401);
    }
    
    await next();
  };
}

/**
 * Require specific permission
 * Returns 403 if user doesn't have permission
 */
export function requirePermission(resource: string, action: 'create' | 'read' | 'edit' | 'delete' | 'export' | 'move' | '*') {
  return async (c: Context, next: Next) => {
    const user = getCurrentUser(c);
    
    if (!user) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Autenticação necessária' 
      }, 401);
    }
    
    if (!hasPermission(user, resource, action)) {
      return c.json({ 
        error: 'Forbidden', 
        message: `Permissão negada: ${resource}:${action}`,
        required: `${resource}:${action}`
      }, 403);
    }
    
    await next();
  };
}

/**
 * Require tenant scope
 * Ensures user can only access their tenant's data
 */
export function requireTenantScope() {
  return async (c: Context, next: Next) => {
    const user = getCurrentUser(c);
    
    if (!user) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Autenticação necessária' 
      }, 401);
    }
    
    // Global users (admins) can access all tenants
    if (user.scope === 'GLOBAL' || user.permissions.includes('*')) {
      await next();
      return;
    }
    
    // Non-global users must have a tenantId
    if (!user.tenantId && !user.parceiroId) {
      return c.json({ 
        error: 'Forbidden', 
        message: 'Escopo de tenant não definido' 
      }, 403);
    }
    
    await next();
  };
}

/**
 * Combine multiple middleware
 */
export function combineMiddleware(...middlewares: ((c: Context, next: Next) => Promise<void>)[]) {
  return async (c: Context, next: Next) => {
    for (const middleware of middlewares) {
      await middleware(c, next);
    }
  };
}

// ============================================
// TENANT SCOPE HELPERS
// ============================================

/**
 * Apply tenant scope to database query
 * Returns conditions for filtering by tenant
 */
export function getTenantFilter(user: AuthUser | null) {
  if (!user) return null;
  
  // Global users see all data
  if (user.scope === 'GLOBAL' || user.permissions.includes('*')) {
    return null;
  }
  
  // Company-level users see their company data
  if (user.scope === 'COMPANY') {
    return { tenantId: user.tenantId };
  }
  
  // Franchise users see their franchise data
  if (user.scope === 'FRANQUIA') {
    return { parceiroId: user.parceiroId };
  }
  
  // Franchisee users see only their own data
  if (user.scope === 'FRANQUEADO' || user.scope === 'OWN') {
    return { parceiroId: user.parceiroId };
  }
  
  return null;
}

/**
 * Validate that user can access specific resource
 */
export function validateResourceAccess(user: AuthUser | null, resourceTenantId?: string, resourcePartnerId?: number): boolean {
  if (!user) return false;
  
  // Global users can access everything
  if (user.scope === 'GLOBAL' || user.permissions.includes('*')) {
    return true;
  }
  
  // Check tenant access
  if (resourceTenantId && user.tenantId) {
    if (resourceTenantId !== user.tenantId) {
      return false;
    }
  }
  
  // Check partner access
  if (resourcePartnerId && user.parceiroId) {
    if (resourcePartnerId !== user.parceiroId) {
      return false;
    }
  }
  
  return true;
}
