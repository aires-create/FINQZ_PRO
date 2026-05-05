// FINQZ PRO - Clientes API Module
// Endpoints para gerenciamento de clientes

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface ClienteFilters {
  search?: string;
  status?: string;
  tipo?: string;
  cidade?: string;
  estado?: string;
}

export interface CreateClientePayload {
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: 'ativo' | 'inativo' | 'nao_perturbe';
  observacao?: string;
  profissao?: string;
  estado_civil?: string;
}

export interface UpdateClientePayload extends Partial<CreateClientePayload> {}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lista clientes com filtros
 */
export const clientesApi = {
  /**
   * Get all clientes with optional filters
   */
  async getAll(filters?: ClienteFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/clientes${query}`);
  },

  /**
   * Get single cliente by ID
   */
  async getById(id: number): Promise<any> {
    return apiCall<any>(`/api/clientes/${id}`);
  },

  /**
   * Create new cliente
   */
  async create(data: CreateClientePayload): Promise<any> {
    return apiCall<any>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing cliente
   */
  async update(id: number, data: UpdateClientePayload): Promise<any> {
    return apiCall<any>(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete cliente
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Search clientes
   */
  async search(query: string): Promise<any[]> {
    return this.getAll({ search: query });
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const clientesApiResult = {
  async getAll(filters?: ClienteFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await clientesApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getById(id: number): Promise<ApiResult<any>> {
    try {
      const data = await clientesApi.getById(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: CreateClientePayload): Promise<ApiResult<any>> {
    try {
      const result = await clientesApi.create(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: number, data: UpdateClientePayload): Promise<ApiResult<any>> {
    try {
      const result = await clientesApi.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await clientesApi.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
