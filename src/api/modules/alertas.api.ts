// FINQZ PRO - Alertas API Module
// Endpoints para alertas de segurança

import { apiCall, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface Alert {
  id: number;
  tipo: string;
  usuarioId: string | null;
  severidade: 'low' | 'medium' | 'high' | 'critical';
  mensagem: string;
  dadosExtras: Record<string, any> | null;
  resolved: number;
  resolvedAt: number | null;
  resolvedBy: string | null;
  createdAt: number | null;
}

export interface AlertsResponse {
  alertas: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AlertFilters {
  page?: number;
  limit?: number;
  unresolved?: boolean;
}

// ============================================
// API METHODS
// ============================================

export const alertasApi = {
  /**
   * Lista alertas de segurança com paginação
   */
  async getAlertas(filters: AlertFilters = {}): Promise<ApiResult<AlertsResponse>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.unresolved) params.append('unresolved', 'true');

    const queryString = params.toString();
    const url = queryString ? `/api/alertas?${queryString}` : '/api/alertas';

    return apiCall<AlertsResponse>(url);
  },

  /**
   * Marca um alerta como resolvido
   */
  async resolveAlert(alertId: number): Promise<ApiResult<{ success: boolean }>> {
    return apiCall<{ success: boolean }>(`/api/alertas/${alertId}/resolve`, {
      method: 'PUT',
    });
  },
};
