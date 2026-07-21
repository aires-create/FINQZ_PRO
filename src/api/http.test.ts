import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, buildRequestHeaders, refreshSessionTokens } from "./http";
import { clearLocalAuthState } from "../auth/logout";
import { getAccessToken, getRefreshToken, storeSessionTokens } from "../auth/session";

describe("api/http", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearLocalAuthState();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not attach Authorization after local logout cleanup", () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    clearLocalAuthState();

    const { headers } = buildRequestHeaders(undefined);

    expect(headers.get("Authorization")).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("clears the session and emits auth:error when refresh fails with 401", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const authErrorHandler = vi.fn();
    window.addEventListener("auth:error", authErrorHandler as EventListener);

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
});
