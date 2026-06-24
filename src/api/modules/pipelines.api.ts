// FINQZ PRO - Pipelines API Module
// Wrapper fino para o backend oficial de pipelines

import { apiCall } from './base';

const PIPELINES_BASE_PATH = '/api/v1/pipelines';

export interface PipelineStage {
  id: string;
  tenantId: string;
  pipelineId: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  stages?: PipelineStage[];
}

export interface CreatePipelinePayload {
  name: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdatePipelinePayload {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface CreateStagePayload {
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export interface UpdateStagePayload {
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
  isActive?: boolean;
}

export interface ReorderStagesPayload {
  stages: Array<{
    stageId: string;
    order: number;
  }>;
}

export interface GetAllPipelinesOptions {
  includeInactive?: boolean;
}

export const pipelinesApi = {
  /**
   * Lista pipelines oficiais.
   * Mantém o payload bruto retornado pelo backend para compatibilidade com telas legadas.
   */
  async getAll(options?: GetAllPipelinesOptions): Promise<any> {
    const query = options?.includeInactive === true ? '?includeInactive=true' : '';

    return apiCall<any>(`${PIPELINES_BASE_PATH}${query}`);
  },

  async createPipeline(payload: CreatePipelinePayload): Promise<any> {
    return apiCall<any>(PIPELINES_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePipeline(pipelineId: string, payload: UpdatePipelinePayload): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/${pipelineId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deletePipeline(pipelineId: string): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/${pipelineId}`, {
      method: 'DELETE',
    });
  },

  async createStage(pipelineId: string, payload: CreateStagePayload): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/${pipelineId}/stages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStage(stageId: string, payload: UpdateStagePayload): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteStage(stageId: string): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/stages/${stageId}`, {
      method: 'DELETE',
    });
  },

  async reorderStages(pipelineId: string, payload: ReorderStagesPayload): Promise<any> {
    return apiCall<any>(`${PIPELINES_BASE_PATH}/${pipelineId}/stages/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
