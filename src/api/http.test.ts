import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiException,
  apiRequest,
  refreshSessionTokens,
} from "./http";
import * as http from "./http";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  storeSessionTokens,
} from "../auth/session";
import { clearLocalAuthState } from "../auth/logout";

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const errorJson = (status: number, body: unknown = { message: "Erro" }) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("http auth flow", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignora uma resposta de refresh que chega depois do logout", async () => {
    storeSessionTokens({
      accessToken: "old-access",
      refreshToken: "old-refresh",
    });

    let resolveFetch: (value: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));

    vi.stubGlobal("fetch", fetchMock);

    const refreshPromise = refreshSessionTokens();
    clearSession();

    resolveFetch(okJson({
      success: true,
      data: {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      },
    }));

    await expect(refreshPromise).resolves.toEqual({ refreshed: false, invalidated: true });
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("nao dispara auth:error quando a sessao ja foi limpa", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const refreshSpy = vi.spyOn(http, "refreshSessionTokens");
    const fetchMock = vi.fn().mockResolvedValue(errorJson(401, { message: "Sessao expirada" }));

    storeSessionTokens({
      accessToken: "active-access",
      refreshToken: "active-refresh",
    });
    clearSession();
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/v1/crm/clientes")).rejects.toBeInstanceOf(ApiException);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: "auth:error" }));
  });

  it("clears the session and emits auth:error when refresh fails with 401", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const authErrorHandler = vi.fn();
    window.addEventListener("auth:error", authErrorHandler as EventListener);

    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Sessao expirada" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("", {
        status: 401,
      }),
    );

    await expect(apiRequest("/api/v1/crm/clientes")).rejects.toMatchObject({ status: 401 });

    expect(authErrorHandler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    window.removeEventListener("auth:error", authErrorHandler as EventListener);
  });

  it("clears the session and emits auth:error once when refresh returns 400", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const authErrorHandler = vi.fn();
    window.addEventListener("auth:error", authErrorHandler as EventListener);

    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Refresh inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await refreshSessionTokens();

    expect(result).toEqual({ refreshed: false, invalidated: true });
    expect(authErrorHandler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:error", authErrorHandler as EventListener);
  });

  it("does not end the global session when a common route returns 400", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const authErrorHandler = vi.fn();
    window.addEventListener("auth:error", authErrorHandler as EventListener);

    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/api/v1/crm/clientes")).rejects.toMatchObject({ status: 400 });

    expect(authErrorHandler).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:error", authErrorHandler as EventListener);
  });

  it("does not try to refresh after the session has already been cleared by logout", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    clearLocalAuthState();

    const authErrorHandler = vi.fn();
    window.addEventListener("auth:error", authErrorHandler as EventListener);

    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Sessao expirada" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiRequest("/api/v1/crm/clientes")).rejects.toMatchObject({ status: 401 });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(authErrorHandler).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();

    window.removeEventListener("auth:error", authErrorHandler as EventListener);
  });
});
