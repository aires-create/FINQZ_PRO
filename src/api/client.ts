// FINQZ PRO - API Client
// Client HTTP com interceptors e tratamento de erros
// Nota: Substituir por chamada real ao backend quando disponível

import { createEdgeSpark } from "@edgespark/client";
import { API_BASE_URL, API_CONFIG, STORAGE_KEYS } from "../config/environment";
import type { ApiError, ErrorResponse } from "../types/api";

// ============================================
// CLIENT CONFIGURATION
// ============================================

// Create EdgeSpark client
export const client = createEdgeSpark({
  baseUrl: new URL(API_BASE_URL, window.location.origin).toString(),
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Mapeia códigos de erro HTTP para mensagens amigáveis
 */
export const getErrorMessage = (status: number, defaultMessage: string): string => {
  const errorMessages: Record<number, string> = {
    400: 'Dados inválidos. Verifique os campos preenchidos.',
    401: 'Sessão expirada. Faça login novamente.',
    403: 'Você não tem permissão para realizar esta ação.',
    404: 'Recurso não encontrado.',
    422: 'Erro de validação. Verifique os dados enviados.',
    429: 'Muitas requisições. Aguarde um momento.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Serviço temporariamente indisponível.',
    503: 'Serviço em manutenção. Tente novamente mais tarde.',
  };
  
  return errorMessages[status] || defaultMessage;
};

/**
 * Classe de erro da API
 */
export class ApiException extends Error {
  status: number;
  code?: string;
  details?: Record<string, string[]>;
  
  constructor(message: string, status: number, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Verifica se o erro é de autenticação (401)
 */
export const isAuthError = (status: number): boolean => {
  return status === 401;
};

/**
 * Verifica se o erro é de permissão (403)
 */
export const isPermissionError = (status: number): boolean => {
  return status === 403;
};

/**
 * Verifica se o erro é de validação (422)
 */
export const isValidationError = (status: number): boolean => {
  return status === 422;
};

/**
 * Verifica se o erro é de rede
 */
export const isNetworkError = (error: unknown): boolean => {
  return error instanceof TypeError && error.message === 'Failed to fetch';
};

// ============================================
// API FETCH
// ============================================

/**
 * Obtém o token de autenticação
 */
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
};

/**
 * Wrapper para fetch com tratamento de erros
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  // Headers padrão
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Adiciona token se existir
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const normalizedEndpoint = endpoint.startsWith("/api/")
  ? endpoint.replace(/^\/api/, "")
  : endpoint;

const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
  ...options,
  headers,
});

    // Trata respostas de erro
    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      
      try {
        errorData = await response.json();
      } catch {
        // Ignora erro de parse
      }
      
      const status = response.status;
      const message = getErrorMessage(status, (errorData.message as string) || 'Erro na requisição');
      
      // Dispara evento de erro para tratamento global
      if (isAuthError(status)) {
        // Limpa sessão e redireciona para login
        handleAuthError();
      }
      
      throw new ApiException(
        message,
        status,
        errorData.code as string | undefined,
        errorData.details as Record<string, string[]> | undefined
      );
    }

    // Retorna dados
    return response.json();
  } catch (error) {
    // Se já é ApiException, relança
    if (error instanceof ApiException) {
      throw error;
    }
    
    // Erro de rede
    if (isNetworkError(error)) {
      throw new ApiException(
        'Erro de conexão. Verifique sua internet.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // Outro erro
    console.error('[API] Erro na requisição:', error);
    throw new ApiException(
      'Erro inesperado. Tente novamente.',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// ============================================
// AUTH ERROR HANDLER
// ============================================

/**
 * trata erros de autenticação
 */
const handleAuthError = (): void => {
  // Limpa tokens
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  
  // Dispara evento para redirect
  window.dispatchEvent(new CustomEvent('auth:error', { 
    detail: { message: 'Sessão expirada' } 
  }));
};

// ============================================
// API HELPERS
// ============================================

/**
 * Constrói query string
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Wrapper com retry
 */
export async function apiFetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  attempts: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await apiFetch<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;
      
      // Não retry em erros de autenticação ou validação
      if (error instanceof ApiException) {
        if (isAuthError(error.status) || isValidationError(error.status)) {
          throw error;
        }
      }
      
      // Espera antes de tentar novamente
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw lastError;
}

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
