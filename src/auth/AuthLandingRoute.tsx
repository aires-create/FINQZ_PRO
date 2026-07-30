// FINQZ PRO - Auth landing route
// Mantém a hidratação e o login encapsulados na camada oficial de autenticação.

import React, { useCallback } from "react";
import { Navigate } from "react-router-dom";
import { AdminLoginScreen } from "../components/auth/AdminLoginScreen";
import { authApi } from "../api/modules/auth.api";
import { useAuth } from "./AuthProvider";

const LoadingScreen = () => (
  <div className="finqz-shell flex min-h-screen items-center justify-center">
    <div className="text-sm text-[var(--text-muted)]">Carregando autenticação...</div>
  </div>
);

export const AuthLandingRoute: React.FC = () => {
  const { user, loading, login } = useAuth();

  const requestPasswordReset = useCallback(async (identifier: string) => {
    const result = await authApi.requestPasswordReset(identifier);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Recuperação de senha indisponível nesta versão.",
      };
    }

    return { success: true };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <AdminLoginScreen onLogin={login} onRequestPasswordReset={requestPasswordReset} />;
};

export default AuthLandingRoute;
