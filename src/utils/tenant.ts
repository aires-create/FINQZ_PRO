// FINQZ PRO - Multi-Tenant Scope Helpers
// Helpers para escopo de dados multi-tenant
// Prepared for backend validation

import { AuthUser, UserScope } from '../auth/permissions';

// ============================================
// TENANT AWARE INTERFACE
// ============================================

/**
 * Interface para dados que suportam isolamento de tenant
 * Usada para filtragem de dados no frontend
 */
export interface TenantAware {
  tenant_id?: string;
  owner_id?: string;
  franquia_id?: number;
  franqueado_id?: number;
}

// ============================================
// TYPES
// ============================================

// Tipos de tenant
export type TenantType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

// Contexto de tenant
export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  companyId?: number;
  franquiaId?: number;
  franqueadoId?: number;
  ownerId?: string;
}

// Escopo de visibilidade de dados
export type DataScope = 'GLOBAL' | 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO' | 'OWN';

// Filtro de dados para consultas
export interface DataFilter {
  // Escopo requerido
  requiredScope: DataScope;
  
  // IDs específicos (opcional, para filtragem granular)
  companyId?: number;
  franquiaId?: number;
  franqueadoId?: number;
  ownerId?: string;
  
  // Se true, inclui dados de subordinados
  includeSubordinates?: boolean;
}

// ============================================
// SCOPE HIERARCHY
// ============================================

// Hierarquia de escopos (maior número = mais acesso)
export const SCOPE_HIERARCHY: Record<DataScope, number> = {
  GLOBAL: 5,
  COMPANY: 4,
  FRANQUIA: 3,
  FRANQUEADO: 2,
  OWN: 1,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtém o escopo do usuário baseado em sua role
 */
export const getUserScope = (user: AuthUser | null): DataScope => {
  if (!user) return 'OWN';
  
  // Mapeia UserScope do auth para DataScope
  const scopeMap: Record<UserScope, DataScope> = {
    GLOBAL: 'GLOBAL',
    COMPANY: 'COMPANY',
    FRANQUIA: 'FRANQUIA',
    FRANQUEADO: 'FRANQUEADO',
    OWN: 'OWN',
  };
  
  return scopeMap[user.scope || 'OWN'];
};

/**
 * Verifica se o usuário pode acessar dados de um escopo específico
 */
export const canAccessScope = (
  user: AuthUser | null,
  targetScope: DataScope
): boolean => {
  if (!user) return false;
  
  // Admin do sistema tem acesso global
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  const userScope = getUserScope(user);
  const userLevel = SCOPE_HIERARCHY[userScope] || 0;
  const targetLevel = SCOPE_HIERARCHY[targetScope] || 0;
  
  return userLevel >= targetLevel;
};

/**
 * Cria filtro de dados baseado no contexto do usuário
 */
export const createDataFilter = (user: AuthUser | null): DataFilter => {
  if (!user) {
    // Usuário não autenticado - só pode ver dados próprios
    return {
      requiredScope: 'OWN',
      ownerId: undefined, // Sem owner, nega tudo
    };
  }
  
  // Admin do sistema vê tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA') {
    return {
      requiredScope: 'GLOBAL',
    };
  }
  
  const scope = getUserScope(user);
  
  const filter: DataFilter = {
    requiredScope: scope,
    includeSubordinates: true,
  };
  
  // Adiciona contexto específico
  if (user.parceiroId) {
    filter.franqueadoId = user.parceiroId;
  }
  
  if (user.codigo) {
    filter.companyId = user.codigo;
  }
  
  return filter;
};

/**
 * Verifica se um registro pertence ao tenant do usuário
 */
export const belongsToTenant = (
  record: {
    tenantId?: string;
    companyId?: number;
    franquiaId?: number;
    franqueadoId?: number;
    ownerId?: string;
  },
  user: AuthUser | null
): boolean => {
  if (!user) return false;
  
  // Admin do sistema tem acesso a tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  const userScope = getUserScope(user);
  
  switch (userScope) {
    case 'GLOBAL':
      return true;
      
    case 'COMPANY':
      return record.companyId === user.codigo;
      
    case 'FRANQUIA':
      return record.franquiaId === user.parceiroId;
      
    case 'FRANQUEADO':
      return record.franqueadoId === user.parceiroId;
      
    case 'OWN':
      return record.ownerId === user.id;
      
    default:
      return false;
  }
};

/**
 * Aplica filtro de tenant a uma query (preparado para backend)
 */
export const applyTenantFilter = (
  user: AuthUser | null,
  baseQuery: Record<string, unknown>
): Record<string, unknown> => {
  const filter = createDataFilter(user);
  
  // Retorna query com filtros de tenant
  // O backend deve validar e aplicar esses filtros
  const tenantQuery = { ...baseQuery };
  
  // Adiciona condições baseadas no escopo
  switch (filter.requiredScope) {
    case 'GLOBAL':
      // Sem filtro adicional
      break;
      
    case 'COMPANY':
      if (filter.companyId) {
        tenantQuery.companyId = filter.companyId;
      }
      break;
      
    case 'FRANQUIA':
      if (filter.franquiaId) {
        tenantQuery.franquiaId = filter.franquiaId;
      }
      break;
      
    case 'FRANQUEADO':
      if (filter.franqueadoId) {
        tenantQuery.franqueadoId = filter.franqueadoId;
      }
      break;
      
    case 'OWN':
      if (user) {
        tenantQuery.ownerId = user.id;
      }
      break;
  }
  
  return tenantQuery;
};

/**
 * Valida se usuário pode modificar um registro
 * Considera escopo e ownership
 */
export const canModifyRecord = (
  user: AuthUser | null,
  record: {
    ownerId?: string;
    createdById?: string;
    companyId?: number;
    franquiaId?: number;
    franqueadoId?: number;
  }
): boolean => {
  if (!user) return false;
  
  // Admin do sistema pode modificar tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA') return true;
  
  const userScope = getUserScope(user);
  
  // Verifica ownership para escopo OWN
  if (userScope === 'OWN') {
    return record.ownerId === user.id || record.createdById === user.id;
  }
  
  // Verifica se pertence ao escopo do usuário
  return belongsToTenant(record, user);
};

/**
 * Obtém contexto de tenant do usuário
 */
export const getTenantContext = (user: AuthUser | null): TenantContext | null => {
  if (!user) return null;
  
  const scope = getUserScope(user);
  
  const context: TenantContext = {
    tenantId: user.parceiroId ? `parceiro_${user.parceiroId}` : `user_${user.id}`,
    tenantType: scope === 'GLOBAL' ? 'COMPANY' : 
                scope === 'COMPANY' ? 'COMPANY' :
                scope === 'FRANQUIA' ? 'FRANQUIA' : 'FRANQUEADO',
    ownerId: user.id,
  };
  
  if (user.parceiroId) {
    context.franqueadoId = user.parceiroId;
  }
  
  if (user.codigo) {
    context.companyId = user.codigo;
  }
  
  return context;
};

/**
 * Prepara dados para criação com contexto de tenant
 */
export const prepareForCreate = (
  user: AuthUser | null,
  data: Record<string, unknown>
): Record<string, unknown> => {
  const context = getTenantContext(user);
  
  if (!context) {
    throw new Error('Usuário não autenticado');
  }
  
  // Adiciona metadados de tenant
  return {
    ...data,
    // Metadados de criação
    createdAt: new Date().toISOString(),
    createdBy: user?.id,
    createdByEmail: user?.email,
    
    // Metadados de tenant
    tenantId: context.tenantId,
    ownerId: context.ownerId,
    companyId: context.companyId,
    franquiaId: context.franquiaId,
    franqueadoId: context.franqueadoId,
  };
};

/**
 * Prepara dados para atualização com validação de ownership
 */
export const prepareForUpdate = (
  user: AuthUser | null,
  currentRecord: Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, unknown> => {
  // Valida ownership
  if (!canModifyRecord(user, currentRecord)) {
    throw new Error('Você não tem permissão para modificar este registro');
  }
  
  // Adiciona metadados de atualização
  return {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: user?.id,
    updatedByEmail: user?.email,
  };
};

// ============================================
// SCOPED DATA FILTER
// ============================================

/**
 * Filtra dados baseado no escopo do usuário
 * Esta função é CRÍTICA para segurança multi-tenant
 * 
 * @param user - Usuário autenticado
 * @param data - Array de dados para filtrar
 * @returns Dados filtrados conforme o escopo do usuário
 * 
 * Lógica de filtragem:
 * - GLOBAL/ADMIN: retorna todos os dados
 * - COMPANY: retorna dados do tenant (tenant_id ou companyId)
 * - FRANQUIA: retorna dados da franquia (franquia_id)
 * - FRANQUEADO: retorna dados do franqueado (franqueado_id ou parceiro_id)
 * - OWN: retorna apenas dados próprios (owner_id)
 */
export const getScopedData = <T extends TenantAware>(
  user: AuthUser | null,
  data: T[]
): T[] => {
  // Se não há usuário, retorna array vazio
  if (!user) {
    return [];
  }

  // Admin do sistema tem acesso a tudo
  if (user.role === 'ROLE_ADMIN_SISTEMA' || user.scope === 'GLOBAL') {
    return data;
  }

  const userScope = user.scope || 'OWN';
  const userTenantId = user.tenant_id;
  const userCompanyId = user.codigo;
  const userFranquiaId = user.parceiroId;
  const userFranqueadoId = user.parceiroId;
  const userOwnerId = user.id;

  return data.filter((item) => {
    switch (userScope) {
      case 'GLOBAL':
        // Acesso global - retorna tudo
        return true;

      case 'COMPANY':
        // Acesso a dados da empresa
        // Verifica se o item pertence ao mesmo tenant ou company
        if (userTenantId && item.tenant_id === userTenantId) {
          return true;
        }
        if (userCompanyId && item.franquia_id === userCompanyId) {
          return true;
        }
        // Dados sem tenant são visíveis apenas para COMPANY/GLOBAL
        if (!item.tenant_id && !item.franquia_id && !item.franqueado_id) {
          return true;
        }
        return false;

      case 'FRANQUIA':
        // Acesso a dados da franquia
        if (userFranquiaId && item.franquia_id === userFranquiaId) {
          return true;
        }
        // Dados da própria franquia também são visíveis
        if (userFranquiaId && item.franqueado_id === userFranquiaId) {
          return true;
        }
        return false;

      case 'FRANQUEADO':
        // Acesso a dados do franqueado
        if (userFranqueadoId && item.franqueado_id === userFranqueadoId) {
          return true;
        }
        // Também verifica parceiro_id para oportunidades
        if (userFranqueadoId && (item as unknown as { parceiro_id?: number }).parceiro_id === userFranqueadoId) {
          return true;
        }
        return false;

      case 'OWN':
        // Acesso apenas a dados próprios
        if (userOwnerId && item.owner_id === userOwnerId) {
          return true;
        }
        return false;

      default:
        // Por padrão, nega acesso
        return false;
    }
  });
};

/**
 * Versão síncrona de getScopedData para uso em contextos não-async
 */
export const getScopedDataSync = <T extends TenantAware>(
  user: AuthUser | null,
  data: T[]
): T[] => {
  return getScopedData(user, data);
};

// ============================================
// EXPORTS
// ============================================

export default {
  getUserScope,
  canAccessScope,
  createDataFilter,
  belongsToTenant,
  applyTenantFilter,
  canModifyRecord,
  getTenantContext,
  prepareForCreate,
  prepareForUpdate,
  getScopedData,
  getScopedDataSync,
  SCOPE_HIERARCHY,
};
