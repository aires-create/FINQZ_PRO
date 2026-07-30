// FINQZ PRO - API/Auth compatibility client
// Client oficial para requests HTTP e sessão canônica.

import {
  apiRequest,
  buildRequestHeaders,
  httpRequest,
  refreshSessionTokens,
  type FinqzHttpResponse,
  type FinqzRequestInit,
  type HttpMethod,
} from "./http";
import {
  canRefreshSession,
  clearSession,
  getSessionSnapshot,
  type FinqzSession,
} from "../auth/session";

type FinqzSignOutResult = {
  data: null;
  error: unknown;
};

export type FinqzClientResponse<T> = FinqzHttpResponse<T>;
export type FinqzAuthSession = FinqzSession;

const fetchWithStandardHeaders = async (endpoint: string, options: FinqzRequestInit = {}): Promise<Response> => {
  const { requestId, ...requestOptions } = options;
  const prepared = buildRequestHeaders(requestOptions.headers, {
    body: requestOptions.body,
    requestId,
  });

  const { response } = await httpRequest(endpoint, {
    ...requestOptions,
    preserveApiPrefix: requestOptions.preserveApiPrefix ?? true,
    headers: prepared.headers,
  });

  if (response.status === 401 && !requestOptions.skipAuthRefresh && canRefreshSession()) {
    const refreshed = await refreshSessionTokens();

    if (refreshed.refreshed) {
      const retryPrepared = buildRequestHeaders(requestOptions.headers, {
        body: requestOptions.body,
        requestId: prepared.requestId,
      });

      const retry = await httpRequest(endpoint, {
        ...requestOptions,
        preserveApiPrefix: requestOptions.preserveApiPrefix ?? true,
        skipAuthRefresh: true,
        headers: retryPrepared.headers,
      });

      return retry.response;
    }
  }

  return response;
};

const getSession = async (): Promise<FinqzAuthSession> => {
  return getSessionSnapshot();
};

const signOut = async (): Promise<FinqzSignOutResult> => {
  clearSession();
  return { data: null, error: null };
};

const request = <T>(
  method: HttpMethod,
  endpoint: string,
  data?: unknown,
  options: FinqzRequestInit = {}
): Promise<FinqzClientResponse<T>> => {
  const body = data === undefined ? options.body : JSON.stringify(data);

  return apiRequest<T>(endpoint, {
    ...options,
    method,
    body,
    preserveApiPrefix: options.preserveApiPrefix ?? true,
  });
};

export const finqzClient = {
  auth: {
    getSession,
    signOut,
  },
  api: {
    fetch: fetchWithStandardHeaders,
  },
  get: <T = unknown>(endpoint: string, options?: FinqzRequestInit) =>
    request<T>("GET", endpoint, undefined, options),
  post: <T = unknown>(endpoint: string, data?: unknown, options?: FinqzRequestInit) =>
    request<T>("POST", endpoint, data, options),
  put: <T = unknown>(endpoint: string, data?: unknown, options?: FinqzRequestInit) =>
    request<T>("PUT", endpoint, data, options),
  patch: <T = unknown>(endpoint: string, data?: unknown, options?: FinqzRequestInit) =>
    request<T>("PATCH", endpoint, data, options),
  delete: <T = unknown>(endpoint: string, options?: FinqzRequestInit) =>
    request<T>("DELETE", endpoint, undefined, options),
  destroy: () => clearSession(),
};

export type FinqzClient = typeof finqzClient;
