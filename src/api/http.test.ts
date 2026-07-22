import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiException,
  apiRequest,
} from "./http";
import * as http from "./http";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSessionUser,
  storeSessionTokens,
} from "../auth/session";

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
    setSessionUser({ id: "1", email: "user@finqz.com" });
    storeSessionTokens({
      accessToken: "old-access",
      refreshToken: "old-refresh",
    });

    let resolveFetch: (value: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));

    vi.stubGlobal("fetch", fetchMock);

    const refreshPromise = http.refreshSessionTokens();
    clearSession();

    resolveFetch(
      okJson({
        success: true,
        data: {
          accessToken: "new-access",
          refreshToken: "new-refresh",
        },
      })
    );

    await expect(refreshPromise).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("nao dispara auth:error quando a sessao ja foi limpa", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const refreshSpy = vi.spyOn(http, "refreshSessionTokens");
    const fetchMock = vi.fn().mockResolvedValue(errorJson(401, { message: "Sessao expirada" }));

    setSessionUser({ id: "1", email: "live@finqz.com" });
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
});
