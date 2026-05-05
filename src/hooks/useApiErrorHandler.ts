// FINQZ PRO - API Error Handler Hook
// Hook para tratamento global de erros da API

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException, isAuthError, isPermissionError, isValidationError, getErrorMessage } from '../api/client';
import { STORAGE_KEYS } from '../config/environment';

// ============================================
// ERROR TYPES
// ============================================

export interface ErrorNotification {
  type: 'error' | 'warning' | 'info' | 'success';
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
  const navigate = useNavigate();

  /**
   * trata erro da API
   */
  const handleApiError = useCallback((error: unknown): ErrorNotification => {
    // Se não for ApiException, retorna erro genérico
    if (!(error instanceof ApiException)) {
      return {
        type: 'error',
        title: 'Erro',
        message: 'Erro inesperado. Tente novamente.',
      };
    }

    const { status, message } = error;

    // Erro de autenticação
    if (isAuthError(status)) {
      // Limpa sessão
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Redirect para login
      navigate('/login', { replace: true });
      
      return {
        type: 'warning',
        title: 'Sessão Expirada',
        message: 'Sua sessão expirou. Faça login novamente.',
        duration: 5000,
      };
    }

    // Erro de permissão
    if (isPermissionError(status)) {
      return {
        type: 'error',
        title: 'Acesso Negado',
        message: getErrorMessage(status, 'Você não tem permissão para realizar esta ação.'),
      };
    }

    // Erro de validação
    if (isValidationError(status)) {
      return {
        type: 'warning',
        title: 'Dados Inválidos',
        message: message || 'Verifique os dados enviados.',
      };
    }

    // Erro de rede (status 0)
    if (status === 0) {
      return {
        type: 'error',
        title: 'Erro de Conexão',
        message: 'Verifique sua conexão com a internet.',
      };
    }

    // Outros erros
    return {
      type: 'error',
      title: 'Erro',
      message: getErrorMessage(status, message),
    };
  }, [navigate]);

  /**
   * Registra listener para eventos de erro de autenticação
   */
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      handleApiError(new ApiException(
        event.detail?.message || 'Sessão expirada',
        401,
        'AUTH_ERROR'
      ));
    };

    window.addEventListener('auth:error', handleAuthError as EventListener);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError as EventListener);
    };
  }, [handleApiError]);

  return { handleApiError };
};

// ============================================
// ERROR BOUNDARY
// ============================================

/**
 * Componente para exibir erro
 */
export const ApiErrorDisplay = ({ 
  error, 
  onRetry 
}: { 
  error: ErrorNotification; 
  onRetry?: () => void 
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={`text-4xl mb-4 ${
        error.type === 'error' ? 'text-red-500' :
        error.type === 'warning' ? 'text-yellow-500' :
        error.type === 'success' ? 'text-green-500' : 'text-blue-500'
      }`}>
        {error.type === 'error' ? '⚠️' : 
         error.type === 'warning' ? '⚡' : 
         error.type === 'success' ? '✅' : 'ℹ️'}
      </div>
      <h3 className="text-lg font-semibold mb-2">{error.title}</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
};

export default useApiErrorHandler;
