// FINQZ PRO - API Client
// Client HTTP com interceptors e tratamento de erros
import { finqzClient } from "./finqzClient";
import { clientesApi } from "./modules/clientes.api";
import { opportunitiesApi } from "./modules/opportunities.api";
import { partnersApi } from "./modules/partners.api";
import { automacoesApi } from "./modules/automacoes.api";
import { dashboardApi } from "./modules/dashboard.api";
import {
  apiFetch,
  buildQueryString,
} from "./http";
export {
  ApiException,
  apiFetch,
  apiFetchWithRetry,
  buildQueryString,
  getErrorMessage,
  isAuthError,
  isNetworkError,
  isPermissionError,
  isValidationError,
} from "./http";

// ============================================
// CLIENT CONFIGURATION
// ============================================

export const client = finqzClient;

// ============================================
// API ENDPOINTS (mantido para compatibilidade)
// ============================================
const shouldPreserveOfficialApiPrefix = (endpoint: string): boolean =>
  /^\/api\/v\d+(?:\/|$)/i.test(endpoint);

export const api = {
  // Dashboard
  getDashboardKPIs: () => dashboardApi.getKPIs(),
  getDashboardProducao: (periodo?: string) => dashboardApi.getProducao(periodo),
  getDashboardFunil: () => dashboardApi.getFunil(),

  // Clientes
  getClientes: (search?: string) => clientesApi.getAll(search ? { search } : undefined),
  getCliente: (id: number) => clientesApi.getById(id),
  createCliente: (data: any) => clientesApi.create(data),
  updateCliente: (id: number, data: any) => clientesApi.update(id, data),
  deleteCliente: (id: number) => clientesApi.delete(id),
  getAuditLogs: (params: { entity: string; entityId: string; limit?: number }) => {
    const query = new URLSearchParams();
    query.set("entity", params.entity);
    query.set("entityId", params.entityId);
    query.set("limit", String(params.limit ?? 20));
    return apiFetch<any>(`/api/v1/audit/logs?${query.toString()}`, {
      preserveApiPrefix: true,
    });
  },

  // Parceiros
  getParceiros: (tipo?: string, status?: string) =>
    partnersApi.getAll({ status: status as any, search: tipo } as any),
  getParceiro: (id: number) => partnersApi.getById(String(id)),
  createParceiro: (data: any) => partnersApi.create(data),
  updateParceiro: (id: number, data: any) => partnersApi.update(String(id), data),
  deleteParceiro: (id: number) => partnersApi.delete(String(id)),

  // Oportunidades
  getOportunidades: (params?: { status?: string; produto_id?: string; parceiro_id?: string }) => {
    return opportunitiesApi.getAll(params as any);
  },
  getOportunidade: (id: number) => opportunitiesApi.getById(String(id)),
  createOportunidade: (data: any) => opportunitiesApi.create(data),
  updateOportunidade: (id: number, data: any) => opportunitiesApi.update(String(id), data),
  deleteOportunidade: (id: number) => opportunitiesApi.delete(String(id)),

  // Automações
  getAutomacoes: () => automacoesApi.getAll(),
  createAutomacao: (data: any) => automacoesApi.create(data),
  updateAutomacao: (id: number, data: any) => automacoesApi.update(id, data),
  deleteAutomacao: (id: number) => automacoesApi.delete(id),

  // Eventos
  getEventos: (params?: { page?: number; limit?: number; type?: string; source?: string; startDate?: number; endDate?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.type) query.set("type", params.type);
    if (params?.source) query.set("source", params.source);
    if (params?.startDate) query.set("startDate", params.startDate.toString());
    if (params?.endDate) query.set("endDate", params.endDate.toString());
    return apiFetch<any>(`/api/eventos${query.toString() ? "?" + query.toString() : ""}`);
  },
  getEventosStats: (params?: { type?: string; source?: string; startDate?: number; endDate?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.source) query.set("source", params.source);
    if (params?.startDate) query.set("startDate", params.startDate.toString());
    if (params?.endDate) query.set("endDate", params.endDate.toString());
    return apiFetch<any>(`/api/eventos/stats${query.toString() ? "?" + query.toString() : ""}`);
  },
  get: <T = any>(endpoint: string, params?: Record<string, unknown>) => {
    const query = buildQueryString(params || {});
    return apiFetch<T>(`${endpoint}${query}`, {
      preserveApiPrefix: shouldPreserveOfficialApiPrefix(endpoint),
    });
  },
  post: <T = any>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      preserveApiPrefix: shouldPreserveOfficialApiPrefix(endpoint),
      body: JSON.stringify(data),
    }),
  put: <T = any>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      preserveApiPrefix: shouldPreserveOfficialApiPrefix(endpoint),
      body: JSON.stringify(data),
    }),
  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, {
      method: "DELETE",
      preserveApiPrefix: shouldPreserveOfficialApiPrefix(endpoint),
    }),
};

// ============================================
// EXPORTS
// ============================================

export default api;
