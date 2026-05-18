// FINQZ PRO - HTTP foundation
// Owns base URL, headers, auth token injection and request correlation.

import { API_BASE_URL, API_CONFIG } from "../config/environment";
import { clearStoredSession, getStoredAuthToken } from "../auth/session";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface FinqzRequestInit extends RequestInit {
  requestId?: string;
  preserveApiPrefix?: boolean;
}

export interface FinqzHttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  requestId: string;
}

export class ApiException extends Error {
  status: number;
  code?: string;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getErrorMessage = (status: number, defaultMessage: string): string => {
  const errorMessages: Record<number, string> = {
    400: "Dados invalidos. Verifique os campos preenchidos.",
    401: "Sessao expirada. Faca login novamente.",
    403: "Voce nao tem permissao para realizar esta acao.",
    404: "Recurso nao encontrado.",
    422: "Erro de validacao. Verifique os dados enviados.",
    429: "Muitas requisicoes. Aguarde um momento.",
    500: "Erro interno do servidor. Tente novamente mais tarde.",
    502: "Servico temporariamente indisponivel.",
    503: "Servico em manutencao. Tente novamente mais tarde.",
  };

  return errorMessages[status] || defaultMessage;
};

export const isAuthError = (status: number): boolean => status === 401;

export const isPermissionError = (status: number): boolean => status === 403;

export const isValidationError = (status: number): boolean => status === 422;

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof TypeError && error.message === "Failed to fetch";
};

const isValidRequestId = (value: string): boolean => {
  return /^[A-Za-z0-9._:-]{8,128}$/.test(value);
};

const generateRequestId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `finqz-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const getHeaderValue = (headers: HeadersInit | undefined, name: string): string | null => {
  if (!headers) {
    return null;
  }

  const normalizedName = name.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(name);
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => key.toLowerCase() === normalizedName);
    return entry?.[1] ?? null;
  }

  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === normalizedName);
  return match?.[1] ? String(match[1]) : null;
};

const applyHeaders = (target: Headers, source: HeadersInit | undefined): void => {
  if (!source) {
    return;
  }

  if (source instanceof Headers) {
    source.forEach((value, key) => target.set(key, value));
    return;
  }

  if (Array.isArray(source)) {
    source.forEach(([key, value]) => target.set(key, value));
    return;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) {
      target.set(key, String(value));
    }
  });
};

export const getResolvedApiBaseUrl = (): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  return new URL(API_BASE_URL || "/", origin).toString();
};

export const normalizeApiEndpoint = (endpoint: string, preserveApiPrefix = false): string => {
  if (preserveApiPrefix) {
    return endpoint;
  }

  if (endpoint.startsWith("/api/")) {
    return endpoint.replace(/^\/api/, "");
  }

  return endpoint;
};

export const buildApiUrl = (endpoint: string, options: { preserveApiPrefix?: boolean } = {}): string => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  return `${API_BASE_URL}${normalizeApiEndpoint(endpoint, options.preserveApiPrefix)}`;
};

export const buildRequestHeaders = (
  headers: HeadersInit | undefined,
  options: { body?: BodyInit | null; requestId?: string } = {}
): { headers: Headers; requestId: string } => {
  const configuredRequestId = options.requestId || getHeaderValue(headers, "X-Request-ID");
  const requestId = configuredRequestId && isValidRequestId(configuredRequestId)
    ? configuredRequestId
    : generateRequestId();

  const mergedHeaders = new Headers(API_CONFIG.DEFAULT_HEADERS);
  applyHeaders(mergedHeaders, headers);

  if (options.body instanceof FormData) {
    mergedHeaders.delete("Content-Type");
  }

  const token = getStoredAuthToken();
  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  mergedHeaders.set("X-Request-ID", requestId);

  return { headers: mergedHeaders, requestId };
};

const handleAuthError = (): void => {
  clearStoredSession();
  window.dispatchEvent(new CustomEvent("auth:error", {
    detail: { message: "Sessao expirada" },
  }));
};

const parseErrorPayload = async (response: Response): Promise<Record<string, unknown>> => {
  try {
    const data = await response.json();
    return data && typeof data === "object" ? data as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

export async function httpRequest(
  endpoint: string,
  options: FinqzRequestInit = {}
): Promise<{ response: Response; requestId: string }> {
  const { requestId, preserveApiPrefix, ...requestOptions } = options;
  const prepared = buildRequestHeaders(requestOptions.headers, {
    body: requestOptions.body,
    requestId,
  });

  const response = await fetch(buildApiUrl(endpoint, { preserveApiPrefix }), {
    ...requestOptions,
    headers: prepared.headers,
  });

  return { response, requestId: prepared.requestId };
}

export async function apiRequest<T>(
  endpoint: string,
  options: FinqzRequestInit = {}
): Promise<FinqzHttpResponse<T>> {
  try {
    const { response, requestId } = await httpRequest(endpoint, options);

    if (!response.ok) {
      const errorData = await parseErrorPayload(response);
      const status = response.status;
      const message = getErrorMessage(status, (errorData.message as string | undefined) || "Erro na requisicao");

      if (isAuthError(status)) {
        handleAuthError();
      }

      throw new ApiException(
        message,
        status,
        errorData.code as string | undefined,
        errorData.details as Record<string, string[]> | undefined
      );
    }

    const data = await response.json() as T;
    return {
      data,
      status: response.status,
      headers: response.headers,
      requestId,
    };
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    if (isNetworkError(error)) {
      throw new ApiException("Erro de conexao. Verifique sua internet.", 0, "NETWORK_ERROR");
    }

    throw new ApiException("Erro inesperado. Tente novamente.", 0, "UNKNOWN_ERROR");
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: FinqzRequestInit = {}
): Promise<T> {
  const response = await apiRequest<T>(endpoint, options);
  return response.data;
}

export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export async function apiFetchWithRetry<T>(
  endpoint: string,
  options: FinqzRequestInit = {},
  attempts: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await apiFetch<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof ApiException && (isAuthError(error.status) || isValidationError(error.status))) {
        throw error;
      }

      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      }
    }
  }

  throw lastError;
}
