// FINQZ PRO - Oportunidades API Module
// Endpoints para gerenciamento de oportunidades

import { apiCall, buildQueryString, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface OportunidadeFilters {
  status?: string;
  produto_id?: string;
  parceiro_id?: string;
  search?: string;
}

export interface CreateOportunidadePayload {
  nome: string;
  telefone: string;
  produto?: string;
  valor?: number;
  pipeline_id?: string;
  coluna_id?: string;
  observacoes?: string;
}

export interface UpdateOportunidadePayload extends Partial<CreateOportunidadePayload> {
  etapa?: string;
  tags?: string[];
}

// ============================================
// API FUNCTIONS
// ============================================

export const oportunidadesApi = {
  /**
   * Get all oportunidades with optional filters
   */
  async getAll(filters?: OportunidadeFilters): Promise<any[]> {
    const query = filters ? buildQueryString(filters) : '';
    return apiCall<any[]>(`/api/oportunidades${query}`);
  },

  /**
   * Get oportunidades in pipeline format
   */
  async getPipeline(produtoId?: string): Promise<any> {
    const query = produtoId ? `?produto_id=${produtoId}` : '';
    return apiCall<any>(`/api/oportunidades/pipeline${query}`);
  },

  /**
   * Get single oportunidade by ID
   */
  async getById(id: number): Promise<any> {
    return apiCall<any>(`/api/oportunidades/${id}`);
  },

  /**
   * Create new oportunidade
   */
  async create(data: CreateOportunidadePayload): Promise<any> {
    return apiCall<any>('/api/oportunidades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing oportunidade
   */
  async update(id: number, data: UpdateOportunidadePayload): Promise<any> {
    return apiCall<any>(`/api/oportunidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete oportunidade
   */
  async delete(id: number): Promise<void> {
    return apiCall<void>(`/api/oportunidades/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Move oportunidade to stage
   */
  async moveToStage(id: number, etapa: string): Promise<any> {
    return apiCall<any>(`/api/opportunidades/${id}/mover`, {
      method: 'POST',
      body: JSON.stringify({ etapa }),
    });
  },

  /**
   * Get documentos da oportunidade
   */
  async getDocumentos(oportunidadeId: number): Promise<any[]> {
    return apiCall<any[]>(`/api/documentos/${oportunidadeId}`);
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const oportunidadesApiResult = {
  async getAll(filters?: OportunidadeFilters): Promise<ApiResult<any[]>> {
    try {
      const data = await oportunidadesApi.getAll(filters);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getPipeline(produtoId?: string): Promise<ApiResult<any>> {
    try {
      const data = await oportunidadesApi.getPipeline(produtoId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: CreateOportunidadePayload): Promise<ApiResult<any>> {
    try {
      const result = await oportunidadesApi.create(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: number, data: UpdateOportunidadePayload): Promise<ApiResult<any>> {
    try {
      const result = await oportunidadesApi.update(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await oportunidadesApi.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
