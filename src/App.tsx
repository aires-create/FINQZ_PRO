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

// Lazy loading for code splitting - improves initial load time
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ClientesPage = lazy(() => import("./pages/Clientes"));
const OportunidadesPage = lazy(() => import("./pages/Oportunidades"));
const ParceirosPage = lazy(() => import("./pages/Parceiros"));
const ProdutosPage = lazy(() => import("./pages/Produtos"));
const EstruturaComercialPage = lazy(() => import("./pages/EstruturaComercial"));
const RoteirosOperacionaisPage = lazy(() => import("./pages/RoteirosOperacionais"));
const FinanceiroPage = lazy(() => import("./pages/Financeiro"));
const ContaCorrentePage = lazy(() => import("./pages/ContaCorrente"));
const AutomacoesPage = lazy(() => import("./pages/Automacoes"));
const RelatoriosPage = lazy(() => import("./pages/Relatorios"));
const AuditoriaPage = lazy(() => import("./pages/Auditoria"));
const UsuariosPage = lazy(() => import("./pages/Usuarios"));
const EventosPage = lazy(() => import("./pages/Eventos"));
// ConfiguracoesPage foi substituído por páginas de administração individuais em src/pages/admin/
const CampanhasPage = lazy(() => import("./pages/Campanhas"));
const ConversasPage = lazy(() => import("./pages/Conversas"));
const AudienciasPage = lazy(() => import("./pages/Audiencias"));
const LoginParceiroPage = lazy(() => import("./pages/LoginParceiro"));
const DashboardParceiroPage = lazy(() => import("./pages/DashboardParceiro"));

// Novas páginas de administração (sem tabs internas)
const GeralPage = lazy(() => import("./pages/admin/Geral"));
const TagsPage = lazy(() => import("./pages/admin/Tags"));
const PipelinesPage = lazy(() => import("./pages/admin/Pipelines"));
const IntegracoesPage = lazy(() => import("./pages/admin/Integracoes"));
const AdminAutomacoesPage = lazy(() => import("./pages/admin/Automacoes"));
const NotificacoesPage = lazy(() => import("./pages/admin/Notificacoes"));
const SegurancaPage = lazy(() => import("./pages/admin/Seguranca"));
const PermissoesPage = lazy(() => import("./pages/admin/Permissoes"));
const BancosPage = lazy(() => import("./pages/admin/Bancos"));
const TabelasComerciaisPage = lazy(() => import("./pages/TabelasComerciais"));
const SimuladorPage = lazy(() => import("./pages/Simulador"));

// Placeholder pages - apenas módulos em preparação
import {
  HubDisparos,
  HubAutomacao,
  HubHigienizacao,
  HubMailing
} from "./pages/Placeholders";

import { SdrIaHubPage } from "./pages/SdrIaHub";

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

// ============================================
// ADMIN PERMISSIONS - Permissões explícitas para Admin Sistema
// ============================================

/**
 * Lista completa de permissões para Admin do Sistema
 * Formato: modulo_acao (seguindo o padrão de ROLE_PERMISSIONS)
 */
const ADMIN_PERMISSIONS = [
  // Wildcard - acesso total (com logging de risco)
  '*',
  
  // Dashboard
  'DASHBOARD_VIEW',
  
  // Clientes
  'CLIENTES_VIEW',
  'CLIENTES_CREATE',
  'CLIENTES_EDIT',
  'CLIENTES_DELETE',
  'CLIENTES_EXPORT',
  
  // Oportunidades
  'OPORTUNIDADES_VIEW',
  'OPORTUNIDADES_CREATE',
  'OPORTUNIDADES_EDIT',
  'OPORTUNIDADES_DELETE',
  'OPORTUNIDADES_MOVE_OPPORTUNITY',
  'OPORTUNIDADES_EXPORT',
  
  // Parceiros
  'PARCEIROS_VIEW',
  'PARCEIROS_CREATE',
  'PARCEIROS_EDIT',
  'PARCEIROS_DELETE',
  'PARCEIROS_RESET_PASSWORD',
  'PARCEIROS_EXPORT',
  
  // Estrutura Comercial
  'ESTRUTURA_COMERCIAL_VIEW',
  'ESTRUTURA_COMERCIAL_CREATE',
  'ESTRUTURA_COMERCIAL_EDIT',
  'ESTRUTURA_COMERCIAL_DELETE',
  'ESTRUTURA_COMERCIAL_EXPORT',
  
  // Roteiros Operacionais
  'ROTEIROS_OPERACIONAIS_VIEW',
  'ROTEIROS_OPERACIONAIS_CREATE',
  'ROTEIROS_OPERACIONAIS_EDIT',
  'ROTEIROS_OPERACIONAIS_DELETE',
  'ROTEIROS_OPERACIONAIS_EXPORT',
  
  // Financeiro
  'FINANCEIRO_VIEW',
  'FINANCEIRO_VIEW_FINANCIAL',
  'FINANCEIRO_CREATE',
  'FINANCEIRO_EDIT',
  'FINANCEIRO_EXPORT',
  
  // Conta Corrente
  'CONTA_CORRENTE_VIEW',
  'CONTA_CORRENTE_VIEW_FINANCIAL',
  'CONTA_CORRENTE_EDIT',
  
  // Relatórios
  'RELATORIOS_VIEW',
  'RELATORIOS_VIEW_REPORTS',
  'RELATORIOS_EXPORT',
  
  // Usuários
  'USUARIOS_VIEW',
  'USUARIOS_CREATE',
  'USUARIOS_EDIT',
  'USUARIOS_DELETE',
  'USUARIOS_RESET_PASSWORD',
  
  // Configurações
  'CONFIGURACOES_VIEW',
  'CONFIGURACOES_CHANGE_SETTINGS',
  
  // Automações
  'AUTOMACOES_VIEW',
  'AUTOMACOES_CREATE',
  'AUTOMACOES_EDIT',
  'AUTOMACOES_DELETE',
  
  // Produtos
  'PRODUTOS_VIEW',
  'PRODUTOS_CREATE',
  'PRODUTOS_EDIT',
  'PRODUTOS_DELETE',
  'PRODUTOS_EXPORT',
];

// Auth Provider
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { setAuth } = useAppStore();

  const normalizeAdminUser = (currentUser: any) => {
    const isAdmin = currentUser?.email?.includes("admin") ||
      currentUser?.role === "ROLE_ADMIN_SISTEMA" ||
      currentUser?.perfil === "admin" ||
      currentUser?.perfil === "Admin Sistema";

    if (isAdmin && (!currentUser.permissions || currentUser.permissions.length === 0)) {
      return {
        ...currentUser,
        permissions: ADMIN_PERMISSIONS,
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
          <ProtectedRoute requiredModule="dashboard" requiredAction="view">
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="crm/clientes" element={
          <ProtectedRoute requiredModule="clientes" requiredAction="view">
            <ClientesPage />
          </ProtectedRoute>
        } />
        <Route path="crm/pipeline" element={
          <ProtectedRoute requiredModule="oportunidades" requiredAction="view">
            <OportunidadesPage />
          </ProtectedRoute>
        } />
        <Route path="crm/simulador" element={
          <ProtectedRoute requiredModule="simulador" requiredAction="view">
            <SimuladorPage />
          </ProtectedRoute>
        } />
        <Route path="parceiros" element={
          <ProtectedRoute requiredModule="parceiros" requiredAction="view">
            <ParceirosPage />
          </ProtectedRoute>
        } />
        <Route path="estrutura-comercial" element={
          <ProtectedRoute requiredModule="estrutura_comercial" requiredAction="view">
            <EstruturaComercialPage />
          </ProtectedRoute>
        } />
        <Route path="roteiros-operacionais" element={
          <ProtectedRoute requiredModule="roteiros_operacionais" requiredAction="view">
            <RoteirosOperacionaisPage />
          </ProtectedRoute>
        } />
        <Route path="financeiro" element={
          <ProtectedRoute requiredModule="financeiro" requiredAction="view">
            <FinanceiroPage />
          </ProtectedRoute>
        } />
        <Route path="conta-corrente" element={
          <ProtectedRoute requiredModule="conta_corrente" requiredAction="view">
            <ContaCorrentePage />
          </ProtectedRoute>
        } />
        <Route path="relatorios" element={
          <ProtectedRoute requiredModule="relatorios" requiredAction="view">
            <RelatoriosPage />
          </ProtectedRoute>
        } />
        <Route path="auditoria" element={
          <ProtectedRoute requiredModule="auditoria" requiredAction="view">
            <AuditoriaPage />
          </ProtectedRoute>
        } />
        <Route path="usuarios" element={
          <ProtectedRoute requiredModule="usuarios" requiredAction="view">
            <UsuariosPage />
          </ProtectedRoute>
        } />

        <Route path="campanhas" element={
          <ProtectedRoute requiredModule="campanhas" requiredAction="view">
            <CampanhasPage />
          </ProtectedRoute>
        } />
        <Route path="conversas" element={
          <ProtectedRoute requiredModule="conversas" requiredAction="view">
            <ConversasPage />
          </ProtectedRoute>
        } />
        <Route path="audiencias" element={
          <ProtectedRoute requiredModule="audiencias" requiredAction="view">
            <AudienciasPage />
          </ProtectedRoute>
        } />

        {/* ==================== NOVAS ROTAS - FINQZ HUB ==================== */}
        <Route path="hub/audiencias" element={
          <ProtectedRoute requiredModule="audiencias" requiredAction="view">
            <AudienciasPage />
          </ProtectedRoute>
        } />
        <Route path="hub/campanhas" element={
          <ProtectedRoute requiredModule="campanhas" requiredAction="view">
            <CampanhasPage />
          </ProtectedRoute>
        } />
        <Route path="hub/disparos" element={
          <ProtectedRoute requiredModule="hub" requiredAction="view">
            <HubDisparos />
          </ProtectedRoute>
        } />
        <Route path="hub/whatsapp" element={
          <ProtectedRoute requiredModule="conversas" requiredAction="view">
            <ConversasPage />
          </ProtectedRoute>
        } />
        <Route path="hub/automacao" element={
          <ProtectedRoute requiredModule="hub" requiredAction="view">
            <HubAutomacao />
          </ProtectedRoute>
        } />
        <Route path="hub/sdr-ia" element={
          <ProtectedRoute requiredModule="hub" requiredAction="view">
            <SdrIaHubPage />
          </ProtectedRoute>
        } />
        <Route path="hub/higienizacao" element={
          <ProtectedRoute requiredModule="hub" requiredAction="view">
            <HubHigienizacao />
          </ProtectedRoute>
        } />
        <Route path="hub/mailing" element={
          <ProtectedRoute requiredModule="hub" requiredAction="view">
            <HubMailing />
          </ProtectedRoute>
        } />


        {/* ==================== NOVAS ROTAS - CRM ==================== */}
        <Route path="crm/clientes" element={
          <ProtectedRoute requiredModule="clientes" requiredAction="view">
            <ClientesPage />
          </ProtectedRoute>
        } />
        <Route path="crm/oportunidades" element={
          <ProtectedRoute requiredModule="oportunidades" requiredAction="view">
            <OportunidadesPage />
          </ProtectedRoute>
        } />


        {/* ==================== NOVAS ROTAS - OPERAÇÕES ==================== */}
        <Route path="operacoes/parceiros" element={
          <ProtectedRoute requiredModule="parceiros" requiredAction="view">
            <ParceirosPage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/estrutura-comercial" element={
          <ProtectedRoute requiredModule="estrutura_comercial" requiredAction="view">
            <EstruturaComercialPage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/tabelas-comerciais" element={
          <ProtectedRoute requiredModule="estrutura_comercial" requiredAction="view">
            <TabelasComerciaisPage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/roteiros" element={
          <ProtectedRoute requiredModule="roteiros_operacionais" requiredAction="view">
            <RoteirosOperacionaisPage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/financeiro" element={
          <ProtectedRoute requiredModule="financeiro" requiredAction="view">
            <FinanceiroPage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/conta-corrente" element={
          <ProtectedRoute requiredModule="conta_corrente" requiredAction="view">
            <ContaCorrentePage />
          </ProtectedRoute>
        } />
        <Route path="operacoes/relatorios" element={
          <ProtectedRoute requiredModule="relatorios" requiredAction="view">
            <RelatoriosPage />
          </ProtectedRoute>
        } />

        {/* ==================== NOVAS ROTAS - ADMINISTRAÇÃO ==================== */}
        <Route path="admin/usuarios" element={
          <ProtectedRoute requiredModule="usuarios" requiredAction="view">
            <UsuariosPage />
          </ProtectedRoute>
        } />
        <Route path="admin/auditoria" element={
          <ProtectedRoute requiredModule="auditoria" requiredAction="view">
            <AuditoriaPage />
          </ProtectedRoute>
        } />
        <Route path="admin/permissoes" element={
          <ProtectedRoute requiredModule="admin" requiredAction="view">
            <PermissoesPage />
          </ProtectedRoute>
        } />
        <Route path="admin/eventos" element={
          <ProtectedRoute requiredModule="admin" requiredAction="view">
            <EventosPage />
          </ProtectedRoute>
        } />
        {/* Novas rotas de administração - cada item é uma página independente */}
        <Route path="admin/geral" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <GeralPage />
          </ProtectedRoute>
        } />
        <Route path="admin/tags" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <TagsPage />
          </ProtectedRoute>
        } />
        <Route path="admin/pipelines" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <PipelinesPage />
          </ProtectedRoute>
        } />
        <Route path="admin/integracoes" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <IntegracoesPage />
          </ProtectedRoute>
        } />
        <Route path="admin/automacoes" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <AdminAutomacoesPage />
          </ProtectedRoute>
        } />
        <Route path="admin/notificacoes" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <NotificacoesPage />
          </ProtectedRoute>
        } />
        <Route path="admin/seguranca" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <SegurancaPage />
          </ProtectedRoute>
        } />
        <Route path="admin/bancos" element={
          <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
            <BancosPage />
          </ProtectedRoute>
        } />
        {/* Rota legada de configurações - redireciona para geral */}
        <Route path="admin/configuracoes" element={<Navigate to="/app/admin/geral" replace />} />

        {/* ==================== REDIRECTS - Rotas Antigas para Novas ==================== */}
        <Route path="clientes" element={<Navigate to="/app/crm/clientes" replace />} />
        <Route path="oportunidades" element={<Navigate to="/app/crm/pipeline" replace />} />
        <Route path="crm/oportunidades" element={<Navigate to="/app/crm/pipeline" replace />} />
        <Route path="parceiros" element={<Navigate to="/app/operacoes/parceiros" replace />} />
        <Route path="estrutura-comercial" element={<Navigate to="/app/operacoes/estrutura-comercial" replace />} />
        <Route path="roteiros-operacionais" element={<Navigate to="/app/operacoes/roteiros" replace />} />
        <Route path="financeiro" element={<Navigate to="/app/operacoes/financeiro" replace />} />
        <Route path="conta-corrente" element={<Navigate to="/app/operacoes/conta-corrente" replace />} />
        <Route path="relatorios" element={<Navigate to="/app/operacoes/relatorios" replace />} />
        <Route path="auditoria" element={<Navigate to="/app/admin/auditoria" replace />} />
        <Route path="usuarios" element={<Navigate to="/app/admin/usuarios" replace />} />
        <Route path="campanhas" element={<Navigate to="/app/hub/campanhas" replace />} />
        <Route path="conversas" element={<Navigate to="/app/hub/whatsapp" replace />} />
        <Route path="hub/conversas" element={<Navigate to="/app/hub/whatsapp" replace />} />
        <Route path="crm/pipelines" element={<Navigate to="/app/admin/pipelines" replace />} />
        {/* Redirects de automação */}
        <Route path="hub/automacao" element={<Navigate to="/app/admin/automacoes" replace />} />
        <Route path="automacao" element={<Navigate to="/app/admin/automacoes" replace />} />
        <Route path="audiencias" element={<Navigate to="/app/hub/audiencias" replace />} />
        {/* Redirects de configurações - para novas rotas de administração */}
        <Route path="configuracoes" element={<Navigate to="/app/admin/geral" replace />} />
        <Route path="configuracoes/geral" element={<Navigate to="/app/admin/geral" replace />} />
        <Route path="configuracoes/tags" element={<Navigate to="/app/admin/tags" replace />} />
        <Route path="configuracoes/pipelines" element={<Navigate to="/app/admin/pipelines" replace />} />
        <Route path="configuracoes/integracoes" element={<Navigate to="/app/admin/integracoes" replace />} />
        <Route path="configuracoes/integrations" element={<Navigate to="/app/admin/integracoes" replace />} />
        <Route path="configuracoes/automacao" element={<Navigate to="/app/admin/automacoes" replace />} />
        <Route path="configuracoes/automacoes" element={<Navigate to="/app/admin/automacoes" replace />} />
        <Route path="configuracoes/notificacoes" element={<Navigate to="/app/admin/notificacoes" replace />} />
        <Route path="configuracoes/notifications" element={<Navigate to="/app/admin/notificacoes" replace />} />
        <Route path="configuracoes/seguranca" element={<Navigate to="/app/admin/seguranca" replace />} />
        <Route path="configuracoes/security" element={<Navigate to="/app/admin/seguranca" replace />} />
        <Route path="configuracoes/permissoes" element={<Navigate to="/app/admin/permissoes" replace />} />
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
      <BrowserRouter>
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
