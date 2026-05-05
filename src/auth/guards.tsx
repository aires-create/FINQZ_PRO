// FINQZ PRO - Auth Guards & Routes
// Componentes de proteção de rotas
// Nota: Validação final deve ocorrer no backend

import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthUser, canAccess, Module, Action } from './permissions';
import { AuthContext } from '../App';

// ============================================
// TYPES
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  user?: AuthUser | null;
  requiredModule?: Module;
  requiredAction?: Action;
  fallbackPath?: string;
}

interface PublicRouteProps {
  children: React.ReactNode;
  user: AuthUser | null;
  redirectTo?: string;
}

// ============================================
// LOADING COMPONENT
// ============================================

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-[#00010b] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-2xl flex items-center justify-center">
        <span className="text-white font-bold text-2xl">F</span>
      </div>
      <div className="w-8 h-8 border-2 border-[#000dff] border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-500 dark:text-gray-400 mt-4">Carregando...</p>
    </div>
  </div>
);

// ============================================
// ACCESS DENIED COMPONENT
// ============================================

export const AccessDenied: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
      <p className="text-gray-600 mb-6">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isso é um erro.
      </p>
      <a
        href="/app/dashboard"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#000dff] text-white rounded-xl font-medium hover:bg-[#0000cc] transition-colors"
      >
        Voltar ao Dashboard
      </a>
    </div>
  </div>
);

// ============================================
// PROTECTED ROUTE
// ============================================

/**
 * Rota protegida - redireciona se não autenticado ou sem permissão
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  user: userProp,
  requiredModule,
  requiredAction = 'view',
  fallbackPath = '/',
}) => {
  const location = useLocation();
  
  // Try to get user from context if not provided as prop
  const authContext = useContext(AuthContext);
  const user = userProp ?? authContext?.user;

  // Loading state - show loading screen
  if (authContext?.loading) {
    return <LoadingScreen />;
  }

  // Não autenticado - redireciona para login
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verifica permissão específica se requerida
  if (requiredModule && requiredAction) {
    const hasPermission = canAccess(user, requiredModule, requiredAction);
    
    if (!hasPermission) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};

// ============================================
// PUBLIC ROUTE
// ============================================

/**
 * Rota pública - redireciona se já autenticado
 * Usado para páginas de login
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  user,
  redirectTo = '/app/dashboard',
}) => {
  // Se já autenticado, redireciona para dashboard
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// ============================================
// PERMISSION GATE
// ============================================

interface PermissionGateProps {
  children: React.ReactNode;
  user: AuthUser | null;
  module: Module;
  action: Action;
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza filhos apenas se o usuário tiver permissão
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  user,
  module,
  action,
  fallback = null,
}) => {
  const hasPermission = canAccess(user, module, action);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================
// CONDITIONAL RENDER
// ============================================

interface ConditionalRenderProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renderiza filhos condicionalmente
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  condition,
  children,
  fallback = null,
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// ============================================
// AUTH GUARD HOOK
// ============================================

/**
 * Hook para verificar permissões
 */
export const usePermission = (module: Module, action: Action = 'view') => {
  // Este hook deve ser usado com o contexto de autenticação
  // A implementação real dependerá de como o auth está configurado
  return {
    canAccess: (user: AuthUser | null) => canAccess(user, module, action),
  };
};

export default {
  ProtectedRoute,
  PublicRoute,
  PermissionGate,
  AccessDenied,
  LoadingScreen,
};
