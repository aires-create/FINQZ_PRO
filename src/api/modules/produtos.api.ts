// FINQZ PRO - Produtos API Module
// Endpoints para gerenciamento de produtos

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface ProdutoFilters {
  search?: string;
  categoria?: string;
  ativo?: boolean;
}

export interface CreateProdutoPayload {
  nome: string;
  descricao?: string;
  pipeline?: string;
  documentos?: string;
  ativo?: number;
  categoria?: string;
  taxa_juros?: number;
  prazo_minimo?: number;
  prazo_maximo?: number;
  valor_minimo?: number;
  valor_maximo?: number;
}

export interface UpdateProdutoPayload extends Partial<CreateProdutoPayload> {}

// ============================================
// API FUNCTIONS
// ============================================

export const produtosApi = {
  /**
   * Get all produtos
   */
  async getAll(filters?: ProdutoFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/produtos${query}`);
  },

  /**
   * Get single produto by ID
   */
  async getById(id: number): Promise<any> {
    return apiCall<any>(`/api/produtos/${id}`);
  },

  /**
   * Create new produto
   */
  async create(data: CreateProdutoPayload): Promise<any> {
    return apiCall<any>('/api/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing produto
   */
  async update(id: number, data: UpdateProdutoPayload): Promise<any> {
    return apiCall<any>(`/api/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete produto
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/produtos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const produtosApiResult = {
  async getAll(filters?: ProdutoFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await produtosApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: CreateProdutoPayload): Promise<ApiResult<any>> {
    try {
      const result = await produtosApi.create(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
