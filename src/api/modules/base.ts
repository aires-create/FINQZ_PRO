// FINQZ PRO - Base API Module
// Configuração base para todos os módulos de API

import { httpRequest } from '../http';

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// BASE API FUNCTION
// ============================================

/**
 * Função base para chamadas API
 * @param endpoint - Endpoint da API
 * @param options - Opções da requisição
 * @returns Dados da resposta
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const { response } = await httpRequest(endpoint, {
      ...options,
      preserveApiPrefix: true,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((errorData.message as string | undefined) || `Erro HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
    console.error(`[API Error] ${endpoint}: Erro desconhecido`);
    throw new Error('Erro desconhecido ao conectar com o servidor');
  }
}

// ============================================
// WRAPPER WITH ERROR HANDLING
// ============================================

/**
 * Wrapper para chamadas API com tratamento de erro
 * @param fn - Função de API
 * @param fallback - Valor fallback em caso de erro
 * @returns Resultado ou fallback
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallback: T | null = null
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error('[API] Erro na operação:', error);
    return fallback;
  }
}

// ============================================
// BUILD QUERY STRING
// ============================================

/**
 * Constrói query string a partir de objeto de parâmetros
 * @param params - Objeto com parâmetros
 * @returns Query string formatada
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================
// API RESULT TYPE
// ============================================

/**
 * Tipo para resultado de API com estado
 */
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wrapper que retorna resultado formatado
 */
export async function apiResult<T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}
