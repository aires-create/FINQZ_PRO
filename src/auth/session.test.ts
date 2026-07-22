import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  getAccessToken,
  getCurrentUser,
  getRefreshToken,
  getSessionSnapshot,
  setAccessToken,
  setRefreshToken,
  setSessionUser,
} from "./session";

describe("auth/session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the session token-only and does not persist a user snapshot", () => {
    setAccessToken("access-token");
    setRefreshToken("refresh-token");
    setSessionUser({ id: "user-1", email: "admin@finqz.com.br" });

    const snapshot = getSessionSnapshot();

    expect(getCurrentUser()).toBeNull();
    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.hasAccessToken).toBe(true);
    expect(snapshot.hasRefreshToken).toBe(true);
    expect(snapshot.data?.user).toBeNull();
  });

  it("clears only token storage", () => {
    setAccessToken("access-token");
    setRefreshToken("refresh-token");

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getSessionSnapshot().isAuthenticated).toBe(false);
  });
});
