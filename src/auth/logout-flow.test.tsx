import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthProvider";
import { clearLocalAuthState } from "./logout";
import { ProtectedRoute } from "./guards";
import { getAccessToken, getRefreshToken, storeSessionTokens } from "./session";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";

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

const LoginScreen = () => <div>Login screen</div>;

const ProtectedScreen = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div>
      <div>Protected screen</div>
      <div data-testid="path">{location.pathname}</div>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </div>
  );
};

const ErrorListener = () => {
  useApiErrorHandler();
  return null;
};

const buildAuthedUser = () => ({
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
});

describe("auth logout flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    clearLocalAuthState();
  });

  it("redirects protected routes to /login after logout", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: buildAuthedUser(),
        },
      },
    });
    finqzClientMock.post.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <MemoryRouter initialEntries={["/app/private"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <ProtectedScreen />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected screen")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(screen.getByText("Login screen")).toBeTruthy());

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(screen.queryByText("Protected screen")).toBeNull();
  });

  it("redirects to /login when auth:error is emitted after refresh failure", async () => {
    storeSessionTokens({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    finqzClientMock.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: buildAuthedUser(),
        },
      },
    });
    finqzClientMock.post.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <MemoryRouter initialEntries={["/app/private"]}>
        <AuthProvider>
          <ErrorListener />
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <ProtectedScreen />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected screen")).toBeTruthy());

    window.dispatchEvent(
      new CustomEvent("auth:error", {
        detail: { message: "Sessão expirada" },
      }),
    );

    await waitFor(() => expect(screen.getByText("Login screen")).toBeTruthy());

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
