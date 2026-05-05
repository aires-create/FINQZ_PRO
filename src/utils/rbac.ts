// FINQZ PRO - RBAC & Multi-tenant Helpers
// Funções auxiliares para controle de acesso e multi-tenancy

import { AuthUser, Role, Permission, isAdminRole, getScopeByRole } from './permissions';

// ============================================
// TYPES
// ============================================

export type TenantType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  scope: 'OWN' | 'FRANQUEADO' | 'FRANQUIA' | 'COMPANY' | 'GLOBAL';
}

// ============================================
// PERMISSION HELPERS
// ============================================

/**
 * Verifica se o usuário tem permissão para uma ação
 * SECURITY: deny-by-default - nega por padrão
 */
export const canAccess = (
  user: AuthUser | null,
  module: string,
  action: string
): boolean => {
  // Usuário não autenticado = acesso negado
  if (!user) return false;
  
  // Admin tem acesso total
  if (isAdminRole(user.role)) return true;
  
  // Verificar se usuário tem permissões explícitas
  if (user.permissions) {
    // Wildcard = acesso total
    if (user.permissions.includes('*' as Permission)) return true;
    
    // Verificar permissão específica
    const requiredPermission = `${module.toUpperCase()}_${action.toUpperCase()}` as Permission;
    return user.permissions.includes(requiredPermission);
  }
  
  // SECURITY: Em produção, negar acesso se não houver permissões explícitas
  if (!import.meta.env.DEV) return false;
  
  // Em DEV, permitir acesso temporário para desenvolvimento
  return true;
};

/**
 * Verifica se o usuário tem papel específico
 */
export const requireRole = (
  user: AuthUser | null,
  requiredRoles: Role | Role[]
): boolean => {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // Admin tem acesso a tudo
  if (isAdminRole(user.role)) return true;
  
  return roles.includes(user.role as Role);
};

/**
 * Verifica se o usuário tem permissão específica
 */
export const requirePermission = (
  user: AuthUser | null,
  requiredPermissions: Permission | Permission[]
): boolean => {
  if (!user) return false;
  
  // Admin tem acesso total
  if (isAdminRole(user.role)) return true;
  
  const perms = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  // Verificar se o usuário tem todas as permissões necessárias
  const userPermissions = user.permissions || [];
  
  return perms.every(perm => {
    // Wildcard
    if (userPermissions.includes('*' as Permission)) return true;
    return userPermissions.includes(perm);
  });
};

// ============================================
// TENANT HELPERS
// ============================================

/**
 * Obtém o contexto de tenant do usuário
 */
export const getTenantContext = (user: AuthUser | null): TenantContext | null => {
  if (!user) return null;
  
  return {
    tenantId: user.parceiroId ? String(user.parceiroId) : user.id,
    tenantType: user.scope === 'GLOBAL' ? 'COMPANY' : 
                 user.scope === 'FRANQUIA' ? 'FRANQUIA' : 'FRANQUEADO',
    scope: user.scope || 'OWN',
  };
};

/**
 * Verifica se o usuário pode acessar dados de outro tenant
 */
export const canAccessTenantData = (
  user: AuthUser | null,
  targetTenantId: string
): boolean => {
  if (!user) return false;
  
  // Admin acessa tudo
  if (isAdminRole(user.role)) return true;
  
  const userTenant = getTenantContext(user);
  if (!userTenant) return false;
  
  // OWN - apenas dados próprios
  if (userTenant.scope === 'OWN') {
    return userTenant.tenantId === targetTenantId;
  }
  
  // FRANQUEADO - próprios + dados da franquia
  if (userTenant.scope === 'FRANQUEADO') {
    return userTenant.tenantId === targetTenantId;
  }
  
  // FRANQUIA - dados da franquia
  if (userTenant.scope === 'FRANQUIA') {
    return userTenant.tenantId === targetTenantId;
  }
  
  // COMPANY e GLOBAL - acesso a tudo
  return true;
};

// ============================================
// CRITICAL POINTS PROTECTION
// ============================================

/**
 * Protege acesso a rotas críticas
 * Retorna true se o acesso for permitido
 */
export const protectCriticalRoute = (
  user: AuthUser | null,
  routeModule: string
): boolean => {
  // Módulos críticos que precisam de proteção adicional
  const criticalModules = ['usuarios', 'parceiros', 'configuracoes', 'automacoes'];
  
  if (!criticalModules.includes(routeModule)) {
    return true; // Módulo não crítico, permitir
  }
  
  // Usuário precisa estar autenticado
  if (!user) return false;
  
  // Admin acessa tudo
  if (isAdminRole(user.role)) return true;
  
  // Em DEV, permitir acesso temporário
  if (import.meta.env.DEV) return true;
  
  // Em produção, verificar permissão específica
  return canAccess(user, routeModule, 'view');
};

/**
 * Valida dados antes de envio à API
 * SECURITY: Nunca enviar senha em responses
 */
export const sanitizeUserData = <T extends Record<string, unknown>>(
  data: T
): Omit<T, 'senha' | 'password' | 'hash'> => {
  const sanitized = { ...data };
  
  // Remover campos sensíveis
  delete sanitized.senha;
  delete sanitized.password;
  delete sanitized.hash;
  delete sanitized.token;
  
  return sanitized;
};
