import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";
import { clearSession, setSessionUser, storeSessionTokens } from "./session";

vi.mock("../App", async () => {
  const ReactModule = await import("react");

  return {
    AuthContext: ReactModule.createContext({
      user: null,
      loading: false,
      isAuthenticated: false,
      login: async () => ({ success: false }),
      requestPasswordReset: async () => ({ success: false }),
    }),
  };
});

vi.mock("../store", () => ({
  default: vi.fn(() => ({
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
    user: {
      nome: "Admin",
      perfil: "Admin Sistema",
      permissions: ["*"],
    },
    userPermissions: {},
    theme: "light",
    toggleTheme: vi.fn(),
    setAuth: vi.fn(),
  })),
}));

vi.mock("../auth/finqzAuth", () => ({
  finqzAuth: {
    signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { ProtectedRoute } from "./guards";
import { Layout } from "../layouts/MainLayout";
import { finqzAuth } from "../auth/finqzAuth";
import { AuthContext } from "../App";

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

describe("logout flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearSession();
  });

  it("redireciona uma rota protegida para /login quando o usuario nao existe", async () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <AuthContext.Provider
          value={{
            user: null,
            loading: false,
            isAuthenticated: false,
            login: async () => ({ success: false }),
            requestPasswordReset: async () => ({ success: false }),
          }}
        >
          <Routes>
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <div>Conteudo protegido</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Screen</div>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
  });

  it("leva o usuario para /login depois do logout", async () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <LocationProbe />
        <Routes>
          <Route
            path="/app"
            element={<Layout />}
          >
            <Route path="dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    fireEvent.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/login");
    });

    expect(finqzAuth.signOut).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
  });
});

describe("logout runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("mantem o login quando o bootstrap resolve depois do logout", async () => {
    const { clearSession: clearFreshSession } = await import("./session");
    const { finalizeLocalLogout: finalizeFreshLogout } = await import("./logout");

    const deferredSession = (() => {
      let resolve: (value: unknown) => void = () => undefined;
      const promise = new Promise((res) => {
        resolve = res;
      });

      return { promise, resolve };
    })();

    const appStoreState = {
      sidebarOpen: true,
      setSidebarOpen: vi.fn(),
      user: null as any,
      userPermissions: {},
      theme: "light",
      toggleTheme: vi.fn(),
      setAuth: vi.fn((nextUser: any | null) => {
        appStoreState.user = nextUser;
      }),
    };
    const getSessionMock = vi.fn(() => deferredSession.promise);
    const useAppStoreMock = Object.assign(() => appStoreState, {
      getState: () => appStoreState,
    });

    vi.doUnmock("../App");
    vi.doMock("../auth/finqzAuth", () => ({
      finqzAuth: {
        getSession: getSessionMock,
        signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
        login: vi.fn(),
      },
    }));
    vi.doMock("../components/auth/AdminLoginScreen", () => ({
      AdminLoginScreen: () => <div>Login Screen</div>,
    }));
    vi.doMock("../pages/Dashboard", () => ({
      default: () => <div>Dashboard Page</div>,
    }));
    vi.doMock("../pages/LoginParceiro", () => ({
      default: () => <div>Partner Login</div>,
    }));
    vi.doMock("../pages/DashboardParceiro", () => ({
      default: () => <div>Partner Dashboard</div>,
    }));
    vi.doMock("../routes", () => ({
      adminRoutes: [],
      crmRoutes: [],
      hubRoutes: [],
      integrationsRoutes: [],
      operacoesRoutes: [],
    }));
    vi.doMock("../store", () => ({
      default: useAppStoreMock,
    }));

    const { default: App } = await import("../App");

    clearFreshSession();
    window.history.pushState({}, "", "/app/dashboard");

    render(<App />);

    await waitFor(() => {
      expect(getSessionMock).toHaveBeenCalled();
    });

    await act(async () => {
      finalizeFreshLogout();
    });

    deferredSession.resolve({
      data: {
        user: {
          id: "1",
          email: "user@finqz.com",
          perfil: "Admin Sistema",
          permissions: ["*"],
        },
      },
    });

    await waitFor(() => {
      expect(getSessionMock).toHaveBeenCalledTimes(2);
    });

    expect(appStoreState.user).toBeNull();
  });

  it("faz auth:error terminar em logout e nao reativar a sessao", async () => {
    const ErrorHost = () => {
      useApiErrorHandler();
      const location = useLocation();
      return <span data-testid="path">{location.pathname}</span>;
    };

    setSessionUser({ id: "2", email: "error@finqz.com" });
    storeSessionTokens({
      accessToken: "error-access",
      refreshToken: "error-refresh",
    });

    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <LocationProbe />
        <Routes>
          <Route path="*" element={<ErrorHost />} />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("path")).toHaveTextContent("/app/dashboard");

    await act(async () => {
      window.dispatchEvent(new CustomEvent("auth:error", { detail: { message: "Sessao expirada" } }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/login");
    });

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
  });
});
