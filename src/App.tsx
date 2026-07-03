// FINQZ PRO - Main App
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAppStore from "./store";
import { Layout } from "./layouts/MainLayout";
import { ProtectedRoute } from "./auth/guards";
import { AuthProvider, AuthLandingRoute, PartnerRoute } from "./auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  adminRoutes,
  crmRoutes,
  hubRoutes,
  integrationsRoutes,
  operacoesRoutes,
} from "./routes";

const DashboardPage = lazy(() => import("./pages/Dashboard"));
const LoginParceiroPage = lazy(() => import("./pages/LoginParceiro"));
const DashboardParceiroPage = lazy(() => import("./pages/DashboardParceiro"));

const PageLoader = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="finqz-card flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Carregando módulo...
    </div>
  </div>
);

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

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AuthLandingRoute />} />
        <Route path="/parceiro/login" element={<LoginParceiroPage />} />
        <Route
          path="/app/parceiro"
          element={
            <PartnerRoute>
              <DashboardParceiroPage />
            </PartnerRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredPermission="DASHBOARD_VIEW" requiredModule="dashboard" requiredAction="view">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {crmRoutes}
          {operacoesRoutes}
          {adminRoutes}
          {hubRoutes}
          {integrationsRoutes}
        </Route>
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

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
