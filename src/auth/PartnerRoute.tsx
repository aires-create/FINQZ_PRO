// FINQZ PRO - Partner route guard
// Mantém a validação de perfil de parceiro encapsulada na camada oficial de auth.

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const LoadingScreen = () => (
  <div className="finqz-shell flex min-h-screen items-center justify-center">
    <div className="text-sm text-[var(--text-muted)]">Carregando autenticação...</div>
  </div>
);

export const PartnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

export default PartnerRoute;
