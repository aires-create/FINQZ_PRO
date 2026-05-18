// FINQZ PRO - API/Auth compatibility client
// EdgeSpark stays encapsulated here during the migration window.

import { createEdgeSpark, type EdgeSparkClient } from "@edgespark/client";
import "@edgespark/client/styles.css";
import {
  apiRequest,
  buildRequestHeaders,
  getResolvedApiBaseUrl,
  type FinqzHttpResponse,
  type FinqzRequestInit,
  type HttpMethod,
} from "./http";
import { clearStoredSession } from "../auth/session";

type EdgeSparkSession = Awaited<ReturnType<EdgeSparkClient["auth"]["getSession"]>>;
type EdgeSparkSignOutResult = Awaited<ReturnType<EdgeSparkClient["auth"]["signOut"]>>;

export type FinqzClientResponse<T> = FinqzHttpResponse<T>;

const edgeSparkClient = createEdgeSpark({
  baseUrl: getResolvedApiBaseUrl(),
});

const fetchWithStandardHeaders = (endpoint: string, options: FinqzRequestInit = {}): Promise<Response> => {
  const { requestId, ...requestOptions } = options;
  const prepared = buildRequestHeaders(requestOptions.headers, {
    body: requestOptions.body,
    requestId,
  });

  return edgeSparkClient.api.fetch(endpoint, {
    ...requestOptions,
    headers: prepared.headers,
  });
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
    getSession: (): Promise<EdgeSparkSession> => edgeSparkClient.auth.getSession(),
    signOut: async (): Promise<EdgeSparkSignOutResult> => {
      try {
        return await edgeSparkClient.auth.signOut();
      } finally {
        clearStoredSession();
      }
    },
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
  destroy: (options?: { clearToken?: boolean }): void => edgeSparkClient.destroy(options),
};

export type FinqzClient = typeof finqzClient;
