// FINQZ PRO - Auditoria API Module
// Endpoints para logs de auditoria

import { apiCall, ApiResult } from './base';

// ============================================
// TYPES
// ============================================

export interface AuditLog {
  id: number;
  usuarioId: string | null;
  acao: string;
  modulo: string;
  registroId: number | null;
  dadosAntes: Record<string, any> | null;
  dadosDepois: Record<string, any> | null;
  createdAt: number | null;
}

export interface AuditLogUsuario {
  id: string;
  nome: string;
  email: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  usuario?: string;
  acao?: string;
  modulo?: string;
  periodo?: 'hoje' | 'semana' | 'mes' | 'ano';
}

// ============================================
// API METHODS
// ============================================

export const auditoriaApi = {
  /**
   * Lista logs de auditoria com paginação e filtros
   */
  async getLogs(filters: AuditFilters = {}): Promise<ApiResult<AuditLogsResponse>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.usuario) params.append('usuario', filters.usuario);
    if (filters.acao) params.append('acao', filters.acao);
    if (filters.modulo) params.append('modulo', filters.modulo);
    if (filters.periodo) params.append('periodo', filters.periodo);

    const queryString = params.toString();
    const url = queryString ? `/api/auditoria/logs?${queryString}` : '/api/auditoria/logs';

    return apiCall<AuditLogsResponse>(url);
  },

  /**
   * Lista usuários que têm logs (para filtro)
   */
  async getUsuarios(): Promise<ApiResult<{ usuarios: AuditLogUsuario[] }>> {
    return apiCall<{ usuarios: AuditLogUsuario[] }>('/api/auditoria/usuarios');
  },
};
