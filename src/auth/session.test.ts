import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_LOGOUT_EVENT, finalizeLocalLogout } from "./logout";
import {
  canRefreshSession,
  clearSession,
  getSessionSnapshot,
  getSessionVersion,
  isSessionActive,
  setSessionUser,
  storeSessionTokens,
} from "./session";

describe("session", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
  });

  it("ativa e invalida a sessão local corretamente", () => {
    const versionBefore = getSessionVersion();

    setSessionUser({ id: "1", email: "user@finqz.com" });
    expect(isSessionActive()).toBe(true);
    expect(getSessionSnapshot().isAuthenticated).toBe(true);
    expect(canRefreshSession()).toBe(false);

    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(canRefreshSession()).toBe(true);
    expect(getSessionSnapshot().hasAccessToken).toBe(true);
    expect(getSessionSnapshot().hasRefreshToken).toBe(true);

    clearSession();

    expect(isSessionActive()).toBe(false);
    expect(canRefreshSession()).toBe(false);
    expect(getSessionSnapshot().isAuthenticated).toBe(false);
    expect(getSessionVersion()).toBe(versionBefore + 1);
  });

  it("nao permite refresh com dados incompletos", () => {
    setSessionUser({ id: "2", email: "only-user@finqz.com" });
    expect(canRefreshSession()).toBe(false);

    storeSessionTokens({ accessToken: "only-access" });
    expect(canRefreshSession()).toBe(false);

    storeSessionTokens({ refreshToken: "only-refresh" });
    expect(canRefreshSession()).toBe(true);
  });

  it("mantem logout idempotente ao finalizar repetidas vezes", () => {
    const versionBefore = getSessionVersion();
    const logoutEvents: Event[] = [];
    const listener = (event: Event) => logoutEvents.push(event);
    window.addEventListener(AUTH_LOGOUT_EVENT, listener);

    setSessionUser({ id: "3", email: "logout@finqz.com" });
    storeSessionTokens({
      accessToken: "logout-access",
      refreshToken: "logout-refresh",
    });

    expect(() => finalizeLocalLogout()).not.toThrow();
    expect(() => finalizeLocalLogout()).not.toThrow();

    expect(isSessionActive()).toBe(false);
    expect(canRefreshSession()).toBe(false);
    expect(getSessionSnapshot().isAuthenticated).toBe(false);
    expect(logoutEvents).toHaveLength(2);
    expect(getSessionVersion()).toBe(versionBefore + 2);

    window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
  });
});
