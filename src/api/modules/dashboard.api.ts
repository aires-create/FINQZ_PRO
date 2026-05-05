// FINQZ PRO - Dashboard API Module
// Endpoints para dados do dashboard

import { apiCall, ApiResult } from './base';

// ============================================
// API FUNCTIONS
// ============================================

export const dashboardApi = {
  /**
   * Get KPIs do dashboard
   */
  async getKPIs(): Promise<any> {
    return apiCall<any>('/api/dashboard/kpis');
  },

  /**
   * Get dados de produção
   */
  async getProducao(periodo: string = 'mes'): Promise<any> {
    return apiCall<any>(`/api/dashboard/producao?periodo=${periodo}`);
  },

  /**
   * Get dados do funil
   */
  async getFunil(): Promise<any> {
    return apiCall<any>('/api/dashboard/funil');
  },

  /**
   * Get estatísticas gerais
   */
  async getEstatisticas(): Promise<any> {
    return apiCall<any>('/api/dashboard/estatisticas');
  },
};

// ============================================
// RESULT WRAPPERS
// ============================================

export const dashboardApiResult = {
  async getKPIs(): Promise<ApiResult<any>> {
    try {
      const data = await dashboardApi.getKPIs();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getProducao(periodo: string = 'mes'): Promise<ApiResult<any>> {
    try {
      const data = await dashboardApi.getProducao(periodo);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getFunil(): Promise<ApiResult<any>> {
    try {
      const data = await dashboardApi.getFunil();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
