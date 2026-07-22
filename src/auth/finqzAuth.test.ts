import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiException } from "../api/http";
import { AUTH_LOGOUT_EVENT } from "./logout";
import { clearSession, getAccessToken, getRefreshToken, setSessionUser, storeSessionTokens } from "./session";

vi.mock("../api/finqzClient", () => ({
  finqzClient: {
    post: vi.fn(),
    auth: {
      signOut: vi.fn(),
    },
  },
}));

import { finqzClient } from "../api/finqzClient";
import * as http from "../api/http";
import { finqzAuth } from "./finqzAuth";

const finqzClientMock = finqzClient as unknown as {
  post: ReturnType<typeof vi.fn>;
  auth: {
    signOut: ReturnType<typeof vi.fn>;
  };
};

describe("finqzAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.restoreAllMocks();
    finqzClientMock.post.mockReset();
    finqzClientMock.auth.signOut.mockReset();
  });

  it("nao tenta refresh ao fazer logout nativo", async () => {
    const refreshSpy = vi.spyOn(http, "refreshSessionTokens").mockResolvedValue(true);
    finqzClientMock.post.mockRejectedValueOnce(new ApiException("Sessao expirada", 401));

    setSessionUser({ id: "1", email: "user@finqz.com" });
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const result = await finqzAuth.logoutNative();

    expect(result.success).toBe(false);
    expect(finqzClientMock.post).toHaveBeenCalledTimes(1);
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it("sempre limpa a sessao local ao encerrar a sessao", async () => {
    const logoutEvents: Event[] = [];
    const listener = (event: Event) => logoutEvents.push(event);
    window.addEventListener(AUTH_LOGOUT_EVENT, listener);

    finqzClientMock.post.mockRejectedValueOnce(new ApiException("Sessao expirada", 401));
    finqzClientMock.auth.signOut.mockResolvedValue({ data: null, error: null });

    setSessionUser({ id: "1", email: "user@finqz.com" });
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const result = await finqzAuth.signOut();

    expect(result.data).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(logoutEvents).toHaveLength(1);

    window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
  });
});
