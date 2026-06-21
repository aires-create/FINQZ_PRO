// FINQZ PRO - Pipelines API Module
// Wrapper fino para o backend oficial de pipelines

import { apiCall } from './base';

const PIPELINES_BASE_PATH = '/api/v1/pipelines';

export const pipelinesApi = {
  /**
   * Lista pipelines oficiais.
   * Mantém o payload bruto retornado pelo backend para compatibilidade com telas legadas.
   */
  async getAll(): Promise<any> {
    return apiCall<any>(PIPELINES_BASE_PATH);
  },
};
