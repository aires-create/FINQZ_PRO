// FINQZ PRO - Permissions & Roles System
// Sistema de permissões baseado em RBAC/ABAC
// SECURITY: deny-by-default - todas as verificações negam por padrão
// Nota: Validação final deve ocorrer no backend

import { ROLE_PERMISSIONS, ROLE_SCOPES, Role, Permission, Scope } from '../types';

// ============================================
// TYPES
// ============================================

// Escopos de visibilidade de dados
export type UserScope = 'GLOBAL' | 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO' | 'OWN';

// Módulos do sistema
export type Module = 
  | 'dashboard'
  | 'clientes'
  | 'oportunidades'
  | 'parceiros'
  | 'usuarios'
  | 'produtos'
  | 'estrutura_comercial'
  | 'roteiros_operacionais'
  | 'financeiro'
  | 'conta_corrente'
  | 'relatorios'
  | 'automacoes'
  | 'configuracoes'
  | 'campanhas'
  | 'conversas'
  | 'audiencias'
  | 'simulador'
  | 'auditoria'
  | 'admin'
  | 'hub';

// Ações disponíveis
export type Action = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'import'
  | 'view_financial'
  | 'view_reports'
  | 'change_settings'
  | 'reset_password'
  | 'move_opportunity';

// ============================================
// MODULE PERMISSIONS MAP
// ============================================

// Mapeamento de módulos para permissões necessárias
export const MODULE_PERMISSIONS: Record<Module, Action[]> = {
  dashboard: ['view'],
  clientes: ['view', 'create', 'edit', 'delete', 'export'],
  oportunidades: ['view', 'create', 'edit', 'delete', 'move_opportunity', 'export'],
  parceiros: ['view', 'create', 'edit', 'delete', 'reset_password', 'export'],
  usuarios: ['view', 'create', 'edit', 'delete', 'reset_password'],
  produtos: ['view', 'create', 'edit', 'delete', 'export'],
  estrutura_comercial: ['view', 'create', 'edit', 'delete', 'export'],
  roteiros_operacionais: ['view', 'create', 'edit', 'delete', 'export'],
  financeiro: ['view', 'view_financial', 'create', 'edit', 'export'],
  conta_corrente: ['view', 'view_financial', 'edit'],
  relatorios: ['view', 'view_reports', 'export'],
  automacoes: ['view', 'create', 'edit', 'delete'],
  configuracoes: ['view', 'change_settings'],
  campanhas: ['view', 'create', 'edit', 'delete'],
  conversas: ['view', 'create', 'edit'],
  audiencias: ['view', 'create', 'edit', 'delete', 'import'],
  simulador: ['view'],
  auditoria: ['view', 'export'],
  admin: ['view', 'change_settings'],
  hub: ['view'],
};

// ============================================
// USER TYPE
// ============================================

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'parceiro';
  role?: Role;
  scope?: UserScope;
  /** ID do tenant do usuário */
  tenant_id?: string;
  parceiroId?: number;
  codigo?: number;
  permissions?: Permission[];
}

// ============================================
// ACCESS DECISION DEBUG
// ============================================

// Resultado de decisão de acesso para debug
export interface AccessDecision {
  granted: boolean;
  reason: string;
  checks: {
    hasUser: boolean;
    hasRole: boolean;
    hasPermissions: boolean;
    permissionsNotEmpty: boolean;
    isAdmin: boolean;
    hasWildcard: boolean;
    hasRequiredPermission: boolean;
  };
}

/**
 * Helper para debug de decisões de acesso
 * Retorna informação detalhada sobre por que acesso foi concedido ou negado
 * Apenas para uso em desenvolvimento
 */
export const explainAccessDecision = (
  user: AuthUser | null,
  module: Module,
  action: Action
): AccessDecision => {
  // Check 1: Usuário existe
  const hasUser = !!user;
  
  // Check 2: Role existe
  const hasRole = !!user?.role;
  
  // Check 3: Permissions existe
  const hasPermissions = !!user?.permissions;
  
  // Check 4: Permissions não está vazia
  const permissionsNotEmpty = !!(user?.permissions && user.permissions.length > 0);
  
  // Check 5: É admin do sistema
  const isAdmin = user?.role === 'ROLE_ADMIN_SISTEMA';
  
  // Check 6: Tem permissão wildcard
  const hasWildcard = !!(user?.permissions?.includes('*' as Permission));
  
  // Check 7: Tem permissão específica para módulo/ação
  const requiredPermission = `${module}_${action}` as Permission;
  const userPermissions = user?.role ? ROLE_PERMISSIONS[user.role] : [];
  const hasRequiredPermission = userPermissions.includes(requiredPermission as Permission);
  
  // Decisão final
  let granted = false;
  let reason = '';
  
  if (!hasUser) {
    reason = 'Usuário não autenticado';
  } else if (isAdmin) {
    granted = true;
    reason = 'Admin do sistema tem acesso total';
  } else if (hasWildcard) {
    // wildcard é permitido apenas se explicitamente atribuído
    granted = true;
    reason = 'Permissão wildcard (*) explicitamente atribuída - RISCO ADMINISTRATIVO';
    // Log de alerta em desenvolvimento
    if (typeof console !== 'undefined') {
      console.warn(`[RBAC] Acesso via wildcard para ${module}/${action} por ${user.email}`);
    }
  } else if (!hasRole) {
    reason = 'Usuário sem role definida';
  } else if (!hasPermissions) {
    reason = 'Usuário sem permissões definidas';
  } else if (!permissionsNotEmpty) {
    reason = 'Lista de permissões vazia';
  } else if (hasRequiredPermission) {
    granted = true;
    reason = `Permissão ${requiredPermission} encontrada para role ${user.role}`;
  } else {
    reason = `Permissão ${requiredPermission} não encontrada para role ${user.role}`;
  }
  
  return {
    granted,
    reason,
    checks: {
      hasUser,
      hasRole,
      hasPermissions,
      permissionsNotEmpty,
      isAdmin,
      hasWildcard,
      hasRequiredPermission,
    },
  };
};

// ============================================
// PERMISSION CHECK FUNCTIONS - DENY-BY-DEFAULT
// ============================================

/**
 * Verifica se o usuário tem permissão para uma ação específica
 * SECURITY: deny-by-default - nega acesso por padrão
 * 
 * @param user - Usuário logado
 * @param module - Módulo desejado
 * @param action - Ação desejada
 * @returns true se tem permissão explícita
 * 
 * NOTA: Esta verificação é client-side. O backend deve validar novamente.
 */
export const canAccess = (
  user: AuthUser | null,
  module: Module,
  action: Action
): boolean => {
  // ============================================
  // SECURITY CHECKS - DENY-BY-DEFAULT
  // ============================================
  
  // 1. Sem usuário = false
  if (!user) {
    return false;
  }
  
  // 2. Admin do sistema tem acesso total
  if (user.role === 'ROLE_ADMIN_SISTEMA') {
    return true;
  }
  
  // 3. Sem role = false
  if (!user.role) {
    return false;
  }
  
  // 4. Sem permissions = false
  if (!user.permissions) {
    return false;
  }
  
  // 5. Lista vazia = false
  if (user.permissions.length === 0) {
    return false;
  }
  
  // 6. Wildcard "*" apenas se explicitamente atribuído
  // Log de risco administrativo quando usado
  if (user.permissions.includes('*' as Permission)) {
    console.warn(
      `[RBAC] Acesso via wildcard para ${module}/${action} por ${user.email}. ` +
      `Considere usar permissões explícitas.`
    );
    return true;
  }
  
  // 7. Verifica permissão específica para módulo/ação
  const requiredPermission = `${module}_${action}` as Permission;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  
  return userPermissions.includes(requiredPermission as Permission);
};

/**
 * Verifica se o usuário pode visualizar dados de um escopo específico
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @param targetScope - Escopo dos dados que deseja acessar
 * @returns true se pode acessar
 */
export const canViewScope = (
  user: AuthUser | null,
  targetScope: UserScope
): boolean => {
  // Sem usuário = false
  if (!user) return false;
  
  // Admin do sistema vê tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Sem role = false
  if (!user.role) return false;
  
  // Sem scope = false
  if (!user.scope) return false;
  
  // Hierarquia de escopos: GLOBAL > COMPANY > FRANQUIA > FRANQUEADO > OWN
  const scopeHierarchy: Record<UserScope, number> = {
    GLOBAL: 5,
    COMPANY: 4,
    FRANQUIA: 3,
    FRANQUEADO: 2,
    OWN: 1,
  };
  
  const userLevel = scopeHierarchy[user.scope] || 0;
  const targetLevel = scopeHierarchy[targetScope] || 0;
  
  // Usuário pode acessar dados do seu nível ou inferior
  return userLevel >= targetLevel;
};

/**
 * Verifica se o usuário pode editar um recurso específico
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @param module - Módulo do recurso
 * @param resourceOwnerId - ID do dono do recurso (para verificar OWN)
 * @returns true se pode editar
 */
export const canEdit = (
  user: AuthUser | null,
  module: Module,
  resourceOwnerId?: number
): boolean => {
  return canAccess(user, module, 'edit');
};

/**
 * Verifica se o usuário pode excluir um recurso
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @param module - Módulo do recurso
 * @returns true se pode excluir
 */
export const canDelete = (
  user: AuthUser | null,
  module: Module
): boolean => {
  return canAccess(user, module, 'delete');
};

/**
 * Verifica se o usuário pode exportar dados
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @param module - Módulo desejado
 * @returns true se pode exportar
 */
export const canExport = (
  user: AuthUser | null,
  module: Module
): boolean => {
  return canAccess(user, module, 'export');
};

/**
 * Verifica se o usuário pode visualizar dados financeiros
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @returns true se pode visualizar
 */
export const canViewFinancial = (user: AuthUser | null): boolean => {
  // Sem usuário = false
  if (!user) return false;
  
  // Admin do sistema tem acesso
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Sem role = false
  if (!user.role) return false;
  
  // Sem permissions ou vazia = false
  if (!user.permissions || user.permissions.length === 0) return false;
  
  // Verifica permissão específica
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes('FINANCE_VIEW' as Permission);
};

/**
 * Verifica se o usuário pode visualizar relatórios
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @returns true se pode visualizar
 */
export const canViewReports = (user: AuthUser | null): boolean => {
  // Sem usuário = false
  if (!user) return false;
  
  // Admin do sistema tem acesso
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Sem role = false
  if (!user.role) return false;
  
  // Sem permissions ou vazia = false
  if (!user.permissions || user.permissions.length === 0) return false;
  
  // Verifica permissão específica
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes('REPORT_VIEW' as Permission);
};

/**
 * Verifica se o usuário pode alterar configurações
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @returns true se pode alterar
 */
export const canChangeSettings = (user: AuthUser | null): boolean => {
  // Sem usuário = false
  if (!user) return false;
  
  // Admin do sistema tem acesso
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Sem role = false
  if (!user.role) return false;
  
  // Sem permissions ou vazia = false
  if (!user.permissions || user.permissions.length === 0) return false;
  
  // Verifica permissão específica
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes('SYSTEM_SETTINGS' as Permission);
};

/**
 * Verifica se o usuário pode resetar senha de outros usuários
 * SECURITY: deny-by-default
 * 
 * @param user - Usuário logado
 * @returns true se pode resetar
 */
export const canResetPassword = (user: AuthUser | null): boolean => {
  // Sem usuário = false
  if (!user) return false;
  
  // Admin do sistema tem acesso
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  // Sem role = false
  if (!user.role) return false;
  
  // Sem permissions ou vazia = false
  if (!user.permissions || user.permissions.length === 0) return false;
  
  // Verifica permissão específica
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes('USER_RESET_PASSWORD' as Permission);
};

// ============================================
// DATA MASKING HELPERS
// ============================================

/**
 * Mascara dados sensíveis baseado nas permissões do usuário
 * @param value - Valor original
 * @param user - Usuário logado
 * @param dataType - Tipo de dado sensível
 * @returns Valor mascarado ou original
 */
export const maskSensitiveData = (
  value: string | null | undefined,
  user: AuthUser | null,
  dataType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'bank' | 'financial'
): string => {
  if (!value) return '';
  
  // Se tem permissão, retorna valor original
  if (canViewFinancial(user) && (dataType === 'financial' || dataType === 'bank')) {
    return value;
  }
  
  // Se tem permissão para ver dados, retorna original
  if (user && user.role === 'ROLE_ADMIN_SISTEMA') {
    return value;
  }

  // Mascara baseado no tipo
  switch (dataType) {
    case 'cpf':
      // Mascara: 123.456.789-** -> ***.***.***-**
      if (value.length === 11) {
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.***-$4');
      }
      return '***.***.***-**';

    case 'cnpj':
      // Mascara: 12.345.678/0001-** -> **.***.***/****-**
      if (value.length === 14) {
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '**.$2.$3/****-$5');
      }
      return '**.***.***/****-**';

    case 'phone':
      // Mascara: (11) 99999-9999 -> (11) *****-****
      if (value.length >= 10) {
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 10) {
          return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) *****-$4');
        }
      }
      return '(**) *****-****';

    case 'email':
      // Mascara: usuario@dominio.com -> u****@d****.com
      const parts = value.split('@');
      if (parts.length === 2) {
        const local = parts[0];
        const domain = parts[1];
        const maskedLocal = local.length > 1 
          ? local[0] + '*'.repeat(local.length - 1) 
          : '*';
        const domainParts = domain.split('.');
        const maskedDomain = domainParts.length > 1
          ? domainParts[0][0] + '*'.repeat(domainParts[0].length - 1)
          : domain;
        return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
      }
      return '****@****.***';

    case 'bank':
      // Mascara dados bancários
      if (value.length > 4) {
        return '****' + value.slice(-4);
      }
      return '****';

    case 'financial':
      // Mascara valores financeiros
      return 'R$ ***.***.***,**';

    default:
      return '***';
  }
};

/**
 * Verifica se usuário pode ver dados sensíveis
 * @param user - Usuário logado
 * @returns true se pode ver
 */
export const canViewSensitiveData = (user: AuthUser | null): boolean => {
  return canViewFinancial(user);
};

// ============================================
// ROLE HELPERS
// ============================================

/**
 * Obtém o escopo padrão de uma role
 * @param role - Role do usuário
 * @returns Escopo padrão
 */
export const getDefaultScope = (role: Role | undefined): UserScope => {
  if (!role) return 'OWN';
  return ROLE_SCOPES[role] || 'OWN';
};

/**
 * Verifica se a role tem acesso administrativo
 * @param role - Role do usuário
 * @returns true se é admin
 */
export const isAdminRole = (role: Role | undefined): boolean => {
  return role === 'ROLE_ADMIN_SISTEMA';
};

/**
 * Obtém o escopo padrão para um role
 * @returns Escopo do usuário
 */
export const getScopeByRole = (role: Role | undefined): UserScope => {
  if (!role) return 'OWN';
  
  // Importar ROLE_SCOPES dinamicamente para evitar dependência circular
  const roleScopes: Record<string, Scope> = {
    ROLE_ADMIN_SISTEMA: 'GLOBAL',
    ROLE_CEO: 'COMPANY',
    ROLE_DIRETOR_AUDITORIA: 'COMPANY',
    ROLE_GERENTE_AUDITORIA: 'COMPANY',
    ROLE_AUDITOR: 'GLOBAL',
    ROLE_DIRETOR_FINANCEIRO: 'COMPANY',
    ROLE_GERENTE_FINANCEIRO: 'COMPANY',
    ROLE_ANALISTA_FINANCEIRO: 'FRANQUIA',
    ROLE_ASSISTENTE_FINANCEIRO: 'FRANQUEADO',
    ROLE_DIRETOR_COMERCIAL: 'COMPANY',
    ROLE_GERENTE_COMERCIAL: 'COMPANY',
    ROLE_GERENTE_REGIONAL: 'FRANQUIA',
    ROLE_COORDENADOR: 'FRANQUIA',
    ROLE_LIDER_EQUIPE: 'FRANQUEADO',
    ROLE_PARCEIRO: 'OWN',
    ROLE_PARCEIRO_PLATINA: 'OWN',
    ROLE_PARCEIRO_OURO: 'OWN',
    ROLE_PARCEIRO_PRATA: 'OWN',
    ROLE_PARCEIRO_BRONZE: 'OWN',
    ROLE_ESTAGIARIO: 'OWN',
    ROLE_JUNIOR: 'OWN',
    ROLE_PLENO: 'OWN',
    ROLE_SENIOR: 'OWN',
    ROLE_TRAINEE: 'OWN',
  };
  
  return (roleScopes[role] || 'OWN') as UserScope;
};

/**
 * Verifica se a role tem acesso financeiro
 * @param role - Role do usuário
 * @returns true se tem acesso
 */
export const hasFinancialAccess = (role: Role | undefined): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(p => 
    p.includes('FINANCE') || 
    p.includes('REPORT') ||
    p === 'SYSTEM_SETTINGS'
  );
};

/**
 * Labels para roles (para exibição)
 */
export const ROLE_LABELS: Record<Role, string> = {
  ROLE_ADMIN_SISTEMA: 'Administrador do Sistema',
  ROLE_CEO: 'CEO',
  ROLE_DIRETOR_AUDITORIA: 'Diretor de Auditoria',
  ROLE_GERENTE_AUDITORIA: 'Gerente de Auditoria',
  ROLE_AUDITOR: 'Auditor',
  ROLE_DIRETOR_FINANCEIRO: 'Diretor Financeiro',
  ROLE_GERENTE_FINANCEIRO: 'Gerente Financeiro',
  ROLE_ANALISTA_FINANCEIRO: 'Analista Financeiro',
  ROLE_ASSISTENTE_FINANCEIRO: 'Assistente Financeiro',
  ROLE_GERENTE_CONTESTACAO: 'Gerente de Contestação',
  ROLE_ANALISTA_CONTESTACAO: 'Analista de Contestação',
  ROLE_ASSISTENTE_CONTESTACAO: 'Assistente de Contestação',
  ROLE_SUPERINTENDENTE: 'Superintendente',
  ROLE_DIRETOR_COMERCIAL_B2B: 'Diretor Comercial B2B',
  ROLE_GERENTE_COMERCIAL_B2B: 'Gerente Comercial B2B',
  ROLE_CONSULTOR_COMERCIAL_B2B: 'Consultor Comercial B2B',
  ROLE_DIRETOR_COMERCIAL_B2C: 'Diretor Comercial B2C',
  ROLE_GERENTE_COMERCIAL_B2C: 'Gerente Comercial B2C',
  ROLE_CONSULTOR_COMERCIAL_B2C: 'Consultor Comercial B2C',
  ROLE_GERENTE_REGIONAL_B2B: 'Gerente Regional B2B',
  ROLE_GERENTE_REGIONAL_B2C: 'Gerente Regional B2C',
  ROLE_SUPERVISOR_BACKOFFICE: 'Supervisor Backoffice',
  ROLE_ASSISTENTE_BACKOFFICE: 'Assistente Backoffice',
};

/**
 * Labels para escopos (para exibição)
 */
export const SCOPE_LABELS: Record<UserScope, string> = {
  GLOBAL: 'Global',
  COMPANY: 'Empresa',
  FRANQUIA: 'Franquia',
  FRANQUEADO: 'Franqueado',
  OWN: 'Próprio',
};

// ============================================
// EXPORTS
// ============================================

export * from '../types';
