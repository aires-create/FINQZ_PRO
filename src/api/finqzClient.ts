// FINQZ PRO - API/Auth compatibility client
// EdgeSpark stays encapsulated here during the migration window.

import { createEdgeSpark, type EdgeSparkClient } from "@edgespark/client";
import "@edgespark/client/styles.css";
import {
  apiRequest,
  buildRequestHeaders,
  getResolvedApiBaseUrl,
  httpRequest,
  type FinqzHttpResponse,
  type FinqzRequestInit,
  type HttpMethod,
} from "./http";
import {
  clearSession,
  getSessionSnapshot,
  setSessionUser,
  type FinqzSession,
} from "../auth/session";

type EdgeSparkSession = Awaited<ReturnType<EdgeSparkClient["auth"]["getSession"]>>;

export type FinqzClientResponse<T> = FinqzHttpResponse<T>;
export type FinqzAuthSession = FinqzSession | EdgeSparkSession;

type FinqzSignOutResult = {
  data: null;
  error: unknown;
};

const edgeSparkClient = createEdgeSpark({
  baseUrl: getResolvedApiBaseUrl(),
});

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

  return response;
};

const fetchWithEdgeSparkFallback = async (endpoint: string, options: FinqzRequestInit = {}): Promise<Response> => {
  try {
    return await fetchWithStandardHeaders(endpoint, options);
  } catch {
    const { requestId, preserveApiPrefix, ...requestOptions } = options;
    const prepared = buildRequestHeaders(requestOptions.headers, {
      body: requestOptions.body,
      requestId,
    });

    return edgeSparkClient.api.fetch(endpoint, {
      ...requestOptions,
      headers: prepared.headers,
    });
  }
};

const getFallbackSession = async (): Promise<EdgeSparkSession> => {
  const session = await edgeSparkClient.auth.getSession();
  const fallbackUser = session.data?.user;

  if (fallbackUser && typeof fallbackUser === "object") {
    setSessionUser(fallbackUser);
  }

  return session;
};

const getSession = async (): Promise<FinqzAuthSession> => {
  const nativeSession = getSessionSnapshot();
  if (nativeSession.isAuthenticated) {
    return nativeSession;
  }

  return getFallbackSession();
};

const signOut = async (): Promise<FinqzSignOutResult> => {
  clearSession();

  try {
    await edgeSparkClient.auth.signOut();
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
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
    fetch: fetchWithEdgeSparkFallback,
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
  destroy: (options?: { clearToken?: boolean }): void => edgeSparkClient.destroy(options),
};

export type FinqzClient = typeof finqzClient;
