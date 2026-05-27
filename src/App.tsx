// FINQZ PRO - Main App
import React, { useEffect, useState, useCallback, createContext, useContext, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import useAppStore from "./store";
import { Layout } from "./layouts/MainLayout";
import { ProtectedRoute, AccessDenied } from "./auth/guards";
import { AuthUser, Module, Action } from "./auth/permissions";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminLoginScreen } from "./components/auth/AdminLoginScreen";
import { finqzAuth } from "./auth/finqzAuth";
import { getCurrentUser, setSessionUser } from "./auth/session";
import { mergeFrontendAdminPermissions } from "./config/permissions";
import { ENABLE_LEGACY_AUTH_FALLBACK } from "./config/environment";
import {
  adminRoutes,
  crmRoutes,
  hubRoutes,
  integrationsRoutes,
  operacoesRoutes,
} from "./routes";

// Route governance:
// 1) App.tsx is orchestration only (auth + layout + route-domain composition).
// 2) Pages in src/pages/** must be loaded via React.lazy to protect bundle budget.
// 3) Domain files in src/routes/** own route declarations and redirects.
// See docs/frontend-architecture-governance.md for full policy.
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const LoginParceiroPage = lazy(() => import("./pages/LoginParceiro"));
const DashboardParceiroPage = lazy(() => import("./pages/DashboardParceiro"));

import { generateSecurePassword } from "./utils/auth";

// Page loader for lazy-loaded routes
const PageLoader = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="finqz-card flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Carregando módulo...
    </div>
  </div>
);

// Auth Context
interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { access_code_or_email: string; senha: string }) => Promise<{ success: boolean; must_change_password?: boolean; error?: string }>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; temporaryPassword?: string; accessCode?: string; error?: string }>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: "Login indisponível" }),
  requestPasswordReset: async () => ({ success: false, error: "Recuperação indisponível" }),
});

const useAuth = () => useContext(AuthContext);

// Loading component
const LoadingScreen = () => (
  <div className="finqz-shell flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
        <span className="text-2xl font-bold text-white">F</span>
      </div>
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="mt-4 text-sm text-[var(--text-muted)]">Carregando FINQZ PRO...</p>
    </div>
  </div>
);

// Auth component
const AuthScreen = () => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 10000)
        );

        const session = await Promise.race([
          finqzAuth.getSession(),
          timeoutPromise,
        ]);

        if (isMounted && session.data?.user) {
          navigate("/app/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isChecking) {
    return <LoadingScreen />;
  }

  return <AdminLoginScreen onLogin={login} onRequestPasswordReset={requestPasswordReset} />;
};

// Private Route component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Parceiro Route component
const ParceiroRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.perfil !== "parceiro") {
    return <Navigate to="/parceiro/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Theme provider
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
};

// Auth Provider
// TODO(legacy-cleanup): consolidar com src/auth/AuthProvider.tsx apos governanca completa de sessao/hydration.
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setAuth } = useAppStore();

  const normalizeAdminUser = (currentUser: any) => {
    const isAdmin = currentUser?.email?.includes("admin") ||
      currentUser?.role === "ROLE_ADMIN_SISTEMA" ||
      currentUser?.perfil === "admin" ||
      currentUser?.perfil === "Admin Sistema";

    if (isAdmin) {
      return {
        ...currentUser,
        permissions: mergeFrontendAdminPermissions(currentUser.permissions),
        role: "ROLE_ADMIN_SISTEMA",
        scope: "GLOBAL",
        perfil: currentUser.perfil || "Admin Sistema",
      };
    }

    return currentUser;
  };

  const applyAuthenticatedUser = useCallback((nextUser: any) => {
    const normalizedUser = normalizeAdminUser(nextUser);
    setUser(normalizedUser);
    setAuth(normalizedUser);
    setSessionUser(normalizedUser);
    return normalizedUser;
  }, [setAuth]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const storedUser = getCurrentUser();
        if (storedUser && isMounted) {
          applyAuthenticatedUser(storedUser);
          return;
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 10000)
        );

        const session = await Promise.race([
          finqzAuth.getSession(),
          timeoutPromise,
        ]);

        if (isMounted && session.data?.user) {
          applyAuthenticatedUser(session.data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [applyAuthenticatedUser]);

  const login = useCallback(async ({ access_code_or_email, senha }: { access_code_or_email: string; senha: string }) => {
    const runLegacyLogin = () => {
      const identifier = access_code_or_email.trim().toLowerCase();
      const { usuarios } = useAppStore.getState();

      const matchedUser = usuarios.find((currentUser) => {
        const emailMatch = currentUser.email?.toLowerCase() === identifier;
        const accessCodeMatch = currentUser.access_code?.toLowerCase() === identifier;
        return (emailMatch || accessCodeMatch) && currentUser.senha === senha;
      });

      if (!matchedUser) {
        return { success: false, error: "E-mail, código ou senha inválidos." };
      }

      if (matchedUser.status !== "ATIVO") {
        return { success: false, error: "Seu acesso está inativo no momento." };
      }

      applyAuthenticatedUser({
        ...matchedUser,
        parceiroId: matchedUser.partner_id,
        perfil: matchedUser.perfil,
      });

      return { success: true, must_change_password: matchedUser.must_change_password };
    };

    const nativeLogin = await finqzAuth.login({ access_code_or_email, senha });

    if (nativeLogin.success && nativeLogin.user) {
      applyAuthenticatedUser(nativeLogin.user);
      return {
        success: true,
        must_change_password: nativeLogin.must_change_password,
      };
    }

    if (!nativeLogin.backendUnavailable) {
      return {
        success: false,
        error: nativeLogin.error || "Não foi possível entrar agora.",
      };
    }

    if (ENABLE_LEGACY_AUTH_FALLBACK) {
  console.warn('[AUTH] Using legacy auth fallback');
  return runLegacyLogin();
}

return {
  success: false,
  error: 'Authentication failed',
};
  }, [applyAuthenticatedUser]);

  const requestPasswordReset = useCallback(async (identifier: string) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const { usuarios, updateUsuario } = useAppStore.getState();
    const matchedUser = usuarios.find((currentUser) =>
      currentUser.email?.toLowerCase() === normalizedIdentifier ||
      currentUser.access_code?.toLowerCase() === normalizedIdentifier
    );

    if (!matchedUser) {
      return { success: false, error: "Não encontramos um acesso com esse e-mail ou código." };
    }

    const temporaryPassword = generateSecurePassword(10);

    updateUsuario(matchedUser.id, {
      senha: temporaryPassword,
      must_change_password: true,
      temporary_password_expires_at: Date.now() + 1000 * 60 * 60,
    });

    return {
      success: true,
      temporaryPassword,
      accessCode: matchedUser.access_code,
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Login Admin */}
      <Route path="/" element={<AuthScreen />} />

      {/* Login Parceiro */}
      <Route path="/parceiro/login" element={<LoginParceiroPage />} />

      {/* Dashboard Parceiro (protegido) */}
      <Route
        path="/app/parceiro"
        element={
          <ParceiroRoute>
            <DashboardParceiroPage />
          </ParceiroRoute>
        }
      />

      {/* Rotas protegidas */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={
          <ProtectedRoute requiredPermission="DASHBOARD_VIEW" requiredModule="dashboard" requiredAction="view">
            <DashboardPage />
          </ProtectedRoute>
        } />
        {/* Domain route composition. Keep URLs/guards unchanged when evolving modules. */}
        {crmRoutes}
        {operacoesRoutes}
        {adminRoutes}
        {hubRoutes}
        {integrationsRoutes}
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
};

// Root App
const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
