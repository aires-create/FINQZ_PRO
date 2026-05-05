// FINQZ PRO - Automações API Module
// Endpoints para gerenciamento de automações

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface AutomacaoFilters {
  search?: string;
  ativo?: boolean;
  trigger_tipo?: string;
}

export interface CreateAutomacaoPayload {
  nome: string;
  descricao?: string;
  trigger_tipo: string;
  trigger_condicao?: string;
  acao_tipo: string;
  acao_parametros?: string;
  ativo?: number;
}

export interface UpdateAutomacaoPayload extends Partial<CreateAutomacaoPayload> {}

// ============================================
// API FUNCTIONS
// ============================================

export const automacoesApi = {
  /**
   * Get all automações
   */
  async getAll(filters?: AutomacaoFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/automacoes${query}`);
  },

  /**
   * Get single automação by ID
   */
  async getById(id: number): Promise<any> {
    return apiCall<any>(`/api/automacoes/${id}`);
  },

  /**
   * Create new automação
   */
  async create(data: CreateAutomacaoPayload): Promise<any> {
    return apiCall<any>('/api/automacoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing automação
   */
  async update(id: number, data: UpdateAutomacaoPayload): Promise<any> {
    return apiCall<any>(`/api/automacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete automação
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/automacoes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle automação status
   */
  async toggleStatus(id: number): Promise<any> {
    return apiCall<any>(`/api/automacoes/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  /**
   * Execute automação manually
   */
  async execute(id: number): Promise<any> {
    return apiCall<any>(`/api/automacoes/${id}/execute`, {
      method: 'POST',
    });
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const automacoesApiResult = {
  async getAll(filters?: AutomacaoFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await automacoesApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: CreateAutomacaoPayload): Promise<ApiResult<any>> {
    try {
      const result = await automacoesApi.create(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: number, data: UpdateAutomacaoPayload): Promise<ApiResult<any>> {
    try {
      const result = await automacoesApi.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
