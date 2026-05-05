// FINQZ PRO - Financeiro API Module
// Endpoints para operações financeiras

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface TransacaoFilters {
  tipo?: string;
  categoria?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface CreateTransacaoPayload {
  tipo: string;
  categoria: string;
  valor: number;
  descricao?: string;
  /** ID do parceiro (obrigatório) - vincula a transação à hierarquia */
  parceiro_id: number;
  oportunidade_id?: number;
  forma_pagamento?: string;
  data?: string;
}

export interface UpdateTransacaoPayload extends Partial<CreateTransacaoPayload> {
  status?: string;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Valida se a transação tem partner_id obrigatório
 */
export const validateTransacao = (data: CreateTransacaoPayload): { valid: boolean; error?: string } => {
  if (!data.parceiro_id) {
    return {
      valid: false,
      error: 'É obrigatório vincular a transação a um parceiro',
    };
  }
  
  if (!data.tipo) {
    return {
      valid: false,
      error: 'O tipo da transação é obrigatório',
    };
  }
  
  if (!data.categoria) {
    return {
      valid: false,
      error: 'A categoria da transação é obrigatória',
    };
  }
  
  if (!data.valor || data.valor <= 0) {
    return {
      valid: false,
      error: 'O valor da transação deve ser maior que zero',
    };
  }
  
  return { valid: true };
};

// ============================================
// API FUNCTIONS
// ============================================

export const financeiroApi = {
  /**
   * Get all transações
   */
  async getTransacoes(filters?: TransacaoFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/financeiro/transacoes${query}`);
  },

  /**
   * Get saldo atual
   */
  async getSaldo(): Promise<any> {
    return apiCall<any>('/api/financeiro/saldo');
  },

  /**
   * Get extrato
   */
  async getExtrato(params?: { parceiro_id?: number; mes?: number; ano?: number }): Promise<any> {
    const query = params ? buildQueryString(params) : '';
    return apiCall<any>(`/api/financeiro/extrato${query}`);
  },

  /**
   * Create transação
   * Valida se o partner_id está presente antes de criar
   */
  async createTransacao(data: CreateTransacaoPayload): Promise<any> {
    // Validação local antes de enviar para API
    const validation = validateTransacao(data);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return apiCall<any>('/api/financeiro/transacoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update transação
   */
  async updateTransacao(id: number, data: UpdateTransacaoPayload): Promise<any> {
    return apiCall<any>(`/api/financeiro/transacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get comissões
   */
  async getComissoes(params?: { parceiro_id?: string; status?: string }): Promise<any[]> {
    const query = params ? buildQueryString(params) : '';
    return apiCall<any[]>(`/api/comissoes${query}`);
  },

  /**
   * Get resumo de comissões
   */
  async getComissoesResumo(): Promise<any> {
    return apiCall<any>('/api/comissoes/resumo');
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const financeiroApiResult = {
  async getTransacoes(filters?: TransacaoFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await financeiroApi.getTransacoes(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getSaldo(): Promise<ApiResult<any>> {
    try {
      const data = await financeiroApi.getSaldo();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async createTransacao(data: CreateTransacaoPayload): Promise<ApiResult<any>> {
    try {
      const result = await financeiroApi.createTransacao(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
