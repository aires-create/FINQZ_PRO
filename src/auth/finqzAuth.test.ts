import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_LOGOUT_EVENT } from "./logout";
import { finqzAuth } from "./finqzAuth";
import {
  clearSession,
  getAccessToken,
  getCurrentUser,
  getRefreshToken,
  getSessionSnapshot,
  storeSessionTokens,
} from "./session";

const finqzClientMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
  api: {
    fetch: vi.fn(),
  },
  destroy: vi.fn(),
}));

vi.mock("../api/finqzClient", () => ({
  finqzClient: finqzClientMock,
}));

describe("auth/finqzAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.clearAllMocks();
  });

  it("stores session tokens and user snapshot on login", async () => {
    finqzClientMock.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "admin@finqz.com.br",
            firstName: "Admin",
            lastName: "Sistema",
            roleId: "role-1",
            role: "ROLE_ADMIN_SISTEMA",
            perfil: "admin",
            tenantId: "tenant-1",
            tenantName: "FINQZ PRO",
            permissions: ["USUARIOS_VIEW"],
          },
          tokens: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
          },
        },
      },
    });

    const result = await finqzAuth.login({
      access_code_or_email: "admin@finqz.com.br",
      senha: "Password123!",
    });

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      id: "user-1",
      email: "admin@finqz.com.br",
      role: "ROLE_ADMIN_SISTEMA",
      tenant_id: "tenant-1",
    });
    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(getCurrentUser()).toMatchObject({
      id: "user-1",
      email: "admin@finqz.com.br",
    });
    expect(getSessionSnapshot().data?.user).toMatchObject({
      id: "user-1",
      email: "admin@finqz.com.br",
    });
  });

  it("hydrates the session user from the backend profile endpoint", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "admin@finqz.com.br",
            firstName: "Admin",
            lastName: "Sistema",
            roleId: "role-1",
            role: "ROLE_ADMIN_SISTEMA",
            perfil: "admin",
            tenantId: "tenant-1",
            tenantName: "FINQZ PRO",
            roles: [
              {
                id: "role-1",
                name: "Admin Sistema",
                slug: "ROLE_ADMIN_SISTEMA",
                type: "SYSTEM",
              },
            ],
            permissions: ["USUARIOS_VIEW", "PERMISSOES_VIEW"],
          },
        },
      },
    });

    const session = await finqzAuth.getSession();

    expect(session.data?.user).toMatchObject({
      id: "user-1",
      email: "admin@finqz.com.br",
      role: "ROLE_ADMIN_SISTEMA",
      tenant_id: "tenant-1",
      tenantName: "FINQZ PRO",
      permissions: ["USUARIOS_VIEW", "PERMISSOES_VIEW"],
    });
    expect(getCurrentUser()).toMatchObject({
      id: "user-1",
      email: "admin@finqz.com.br",
    });
    expect(finqzClientMock.get).toHaveBeenCalledWith("/api/v1/auth/profile");
  });

  it("clears session tokens on sign out", async () => {
    const logoutEvents: Event[] = [];
    const listener = (event: Event) => logoutEvents.push(event);
    window.addEventListener(AUTH_LOGOUT_EVENT, listener);

    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.post.mockResolvedValueOnce({
      data: { success: true },
    });

    await finqzAuth.signOut();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(logoutEvents).toHaveLength(1);

    window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
  });

  it("clears local session even when logout network fails", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.post.mockRejectedValueOnce(new Error("network down"));

    const result = await finqzAuth.signOut();

    expect(result.error).toBe("Não foi possível encerrar a sessão nativa.");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });

  it("is idempotent when sign out runs more than once", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.post.mockResolvedValue({ data: { success: true } });

    await finqzAuth.signOut();
    await finqzAuth.signOut();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(finqzClientMock.post).toHaveBeenCalled();
  });
});
