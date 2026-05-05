// FINQZ PRO - Usuários API Module
// Endpoints para gerenciamento de usuários

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface UsuarioFilters {
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUsuarioPayload {
  nome: string;
  email: string;
  login?: string;
  senha?: string;
  role: string;
  /** ID do parceiro vinculado (obrigatório para usuários não-admin) */
  partner_id?: number;
}

export interface UpdateUsuarioPayload extends Partial<CreateUsuarioPayload> {
  status?: 'ativo' | 'inativo';
}

// ============================================
// SCOPE HELPER FUNCTIONS
// ============================================

/**
 * Determina o escopo do usuário baseado no seu partner vinculado
 */
export const getUserScope = (partnerId?: number, role?: string): string => {
  // Admin sistema tem acesso global
  if (role === 'ROLE_ADMIN_SISTEMA') {
    return 'GLOBAL';
  }
  
  // Se não tem partner_id, é um usuário interno (acesso global)
  if (!partnerId) {
    return 'GLOBAL';
  }
  
  // O escopo será determinado pelo tipo de parceiro
  // Esta informação vem do backend quando o partner é carregado
  return 'PARTNER';
};

/**
 * Labels para escopo de usuário
 */
export const SCOPE_LABELS: Record<string, string> = {
  GLOBAL: 'Global (Todos os dados)',
  COMPANY: 'Empresa Matriz',
  FRANQUIA: 'Franquia',
  FRANQUEADO: 'Franqueado',
  PARTNER: 'Acesso por Parceiro',
};

// ============================================
// API FUNCTIONS
// ============================================

export const usuariosApi = {
  /**
   * Get all usuários
   */
  async getAll(filters?: UsuarioFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/usuarios${query}`);
  },

  /**
   * Get single usuário by ID
   */
  async getById(id: number): Promise<any> {
    return apiCall<any>(`/api/usuarios/${id}`);
  },

  /**
   * Create new usuário
   * Para usuários com perfil de parceiro, o partner_id é obrigatório
   */
  async create(data: CreateUsuarioPayload): Promise<any> {
    // Validação: usuários com role de parceiro precisam de partner_id
    const partnerRoles = ['ROLE_GERENTE_FRANQUIA', 'ROLE_VENDEDOR', 'ROLE_FRANQUEADO'];
    if (partnerRoles.includes(data.role) && !data.partner_id) {
      throw new Error('Para este perfil, é obrigatório vincular a um parceiro');
    }
    
    return apiCall<any>('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing usuário
   */
  async update(id: number, data: UpdateUsuarioPayload): Promise<any> {
    return apiCall<any>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete usuário
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle usuário status
   */
  async toggleStatus(id: number): Promise<any> {
    return apiCall<any>(`/api/usuarios/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  /**
   * Get usuários por escopo de parceiro
   * Retorna usuários que pertencem a um parceiro específico ou seus filhos
   */
  async getByPartnerScope(partnerId: number, includeChildren: boolean = true): Promise<any[]> {
    const query = buildQueryString({
      partner_id: partnerId,
      include_children: includeChildren,
    });
    return apiCall<any[]>(`/api/usuarios${query}`);
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const usuariosApiResult = {
  async getAll(filters?: UsuarioFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await usuariosApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: CreateUsuarioPayload): Promise<ApiResult<any>> {
    try {
      const result = await usuariosApi.create(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: number, data: UpdateUsuarioPayload): Promise<ApiResult<any>> {
    try {
      const result = await usuariosApi.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
