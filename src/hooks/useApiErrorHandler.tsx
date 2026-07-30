// FINQZ PRO - API Error Handler Hook
// Hook para tratamento global de erros da API

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Info, Zap } from "lucide-react";
import { ApiException, isAuthError, isPermissionError, isValidationError, getErrorMessage } from "../api/http";
import { useAuth } from "../auth";

// ============================================
// ERROR TYPES
// ============================================

export interface ErrorNotification {
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  duration?: number;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para tratamento global de erros da API
 */
export const useApiErrorHandler = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  /**
   * trata erro da API
   */
  const handleApiError = useCallback((error: unknown): ErrorNotification => {
    if (!(error instanceof ApiException)) {
      return {
        type: "error",
        title: "Erro",
        message: "Erro inesperado. Tente novamente.",
      };
    }

    const { status, message } = error;

    if (isAuthError(status)) {
      void logout();

      return {
        type: "warning",
        title: "Sessão Expirada",
        message: "Sua sessão expirou. Faça login novamente.",
        duration: 5000,
      };
    }

    if (isPermissionError(status)) {
      return {
        type: "error",
        title: "Acesso Negado",
        message: getErrorMessage(status, "Você não tem permissão para realizar esta ação."),
      };
    }

    if (isValidationError(status)) {
      return {
        type: "warning",
        title: "Dados Inválidos",
        message: message || "Verifique os dados enviados.",
      };
    }

    if (status === 0) {
      return {
        type: "error",
        title: "Erro de Conexão",
        message: "Verifique sua conexão com a internet.",
      };
    }

    return {
      type: "error",
      title: "Erro",
      message: getErrorMessage(status, message),
    };
  }, [logout]);

  /**
   * Registra listener para eventos de erro de autenticação
   */
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      handleApiError(new ApiException(
        event.detail?.message || "Sessão expirada",
        401,
        "AUTH_ERROR",
      ));
    };

    window.addEventListener("auth:error", handleAuthError as EventListener);

    return () => {
      window.removeEventListener("auth:error", handleAuthError as EventListener);
    };
  }, [handleApiError]);

  return { handleApiError };
};

// ============================================
// ERROR BOUNDARY
// ============================================

export const ApiErrorDisplay = ({
  error,
  onRetry,
}: {
  error: ErrorNotification;
  onRetry?: () => void;
}) => {
  const Icon = error.type === "error"
    ? AlertTriangle
    : error.type === "warning"
      ? Zap
      : error.type === "success"
        ? CheckCircle
        : Info;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={`mb-4 ${
        error.type === "error" ? "text-red-500" :
        error.type === "warning" ? "text-yellow-500" :
        error.type === "success" ? "text-green-500" : "text-blue-500"
      }`}>
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{error.title}</h3>
      <p className="mb-4 text-slate-600">{error.message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        )}
        <button
          onClick={() => navigate("/")}
          className="rounded bg-gray-200 px-4 py-2 text-slate-700 hover:bg-gray-300"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
};

export default useApiErrorHandler;
