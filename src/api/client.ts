// FINQZ PRO - API Client
// Client HTTP com interceptors e tratamento de erros
// Nota: Substituir por chamada real ao backend quando disponível

import { finqzClient } from "./finqzClient";
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

export interface DashboardFilters {
  periodo?: string;
  parceiro?: string;
  tipoParceiro?: string;
  tipoProduto?: string;
  statusOportunidade?: string;
  canal?: string;
  dataRangeStart?: string;
  dataRangeEnd?: string;
}

const buildFilterParams = (filters: DashboardFilters): string => {
  const params = new URLSearchParams();
  
  if (filters.periodo) params.append('periodo', filters.periodo);
  if (filters.parceiro) params.append('parceiro', filters.parceiro);
  if (filters.tipoParceiro) params.append('tipoParceiro', filters.tipoParceiro);
  if (filters.tipoProduto) params.append('tipoProduto', filters.tipoProduto);
  if (filters.statusOportunidade) params.append('statusOportunidade', filters.statusOportunidade);
  if (filters.canal) params.append('canal', filters.canal);
  if (filters.dataRangeStart) params.append('dataRangeStart', filters.dataRangeStart);
  if (filters.dataRangeEnd) params.append('dataRangeEnd', filters.dataRangeEnd);
  
  return params.toString();
};

export const api = {
  // Dashboard
  getDashboardKPIs: (filters?: DashboardFilters) => {
    const params = buildFilterParams(filters || {});
    return apiFetch<any>(`/api/dashboard/kpis${params ? `?${params}` : ''}`);
  },
  getDashboardProducao: (filters?: DashboardFilters) => {
    const params = buildFilterParams(filters || {});
    return apiFetch<any>(`/api/dashboard/producao${params ? `?${params}` : ''}`);
  },
  getDashboardFunil: (filters?: DashboardFilters) => {
    const params = buildFilterParams(filters || {});
    return apiFetch<any>(`/api/dashboard/funil${params ? `?${params}` : ''}`);
  },

  // Clientes
  getClientes: (search?: string) =>
    apiFetch<any>(`/api/clientes${search ? `?search=${search}` : ""}`),
  getCliente: (id: number) => apiFetch<any>(`/api/clientes/${id}`),
  createCliente: (data: any) =>
    apiFetch<any>("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCliente: (id: number, data: any) =>
    apiFetch<any>(`/api/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCliente: (id: number) =>
    apiFetch<any>(`/api/clientes/${id}`, { method: "DELETE" }),

  // Produtos
  getProdutos: () => apiFetch<any>("/api/produtos"),
  getProduto: (id: number) => apiFetch<any>(`/api/produtos/${id}`),
  createProduto: (data: any) =>
    apiFetch<any>("/api/produtos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduto: (id: number, data: any) =>
    apiFetch<any>(`/api/produtos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduto: (id: number) =>
    apiFetch<any>(`/api/produtos/${id}`, { method: "DELETE" }),

  // Parceiros
  getParceiros: (tipo?: string, status?: string) =>
    apiFetch<any>(
      `/api/parceiros${tipo || status ? "?" : ""}${tipo ? `tipo=${tipo}` : ""}${status ? `&status=${status}` : ""}`
    ),
  getParceiro: (id: number) => apiFetch<any>(`/api/parceiros/${id}`),
  createParceiro: (data: any) =>
    apiFetch<any>("/api/parceiros", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateParceiro: (id: number, data: any) =>
    apiFetch<any>(`/api/parceiros/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteParceiro: (id: number) =>
    apiFetch<any>(`/api/parceiros/${id}`, { method: "DELETE" }),

  // Oportunidades
  getOportunidades: (params?: { status?: string; produto_id?: string; parceiro_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.produto_id) query.set("produto_id", params.produto_id);
    if (params?.parceiro_id) query.set("parceiro_id", params.parceiro_id);
    return apiFetch<any>(`/api/oportunidades${query.toString() ? "?" + query.toString() : ""}`);
  },
  getOportunidadesPipeline: (produtoId?: string) =>
    apiFetch<any>(`/api/oportunidades/pipeline${produtoId ? `?produto_id=${produtoId}` : ""}`),
  getOportunidade: (id: number) => apiFetch<any>(`/api/oportunidades/${id}`),
  createOportunidade: (data: any) =>
    apiFetch<any>("/api/oportunidades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOportunidade: (id: number, data: any) =>
    apiFetch<any>(`/api/oportunidades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteOportunidade: (id: number) =>
    apiFetch<any>(`/api/oportenidades/${id}`, { method: "DELETE" }),

  // Automações
  getAutomacoes: () => apiFetch<any>("/api/automacoes"),
  createAutomacao: (data: any) =>
    apiFetch<any>("/api/automacoes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAutomacao: (id: number, data: any) =>
    apiFetch<any>(`/api/automacoes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAutomacao: (id: number) =>
    apiFetch<any>(`/api/automacoes/${id}`, { method: "DELETE" }),

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
    return apiFetch<T>(`${endpoint}${query}`);
  },
  post: <T = any>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T = any>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: "DELETE" }),};

// ============================================
// EXPORTS
// ============================================

export default api;
