// FINQZ PRO - Auth Provider
// Provider de contexto de autenticação
// Nota: Integração com backend real necessária para validação de tokens

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser, getScopeByRole, isAdminRole, Permission } from './permissions';
import useAppStore from '../store';
import { PROFILE_PERMISSIONS } from '../types';

// ============================================
// TYPES
// ============================================

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { access_code_or_email: string; senha: string }) => Promise<{ success: boolean; must_change_password?: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ============================================
// ADMIN PERMISSIONS - Permissões explícitas para Admin Sistema
// ============================================

/**
 * Lista completa de permissões para Admin do Sistema
 * Formato: modulo_acao (seguindo o padrão de ROLE_PERMISSIONS)
 */
const ADMIN_PERMISSIONS: Permission[] = [
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

// ============================================
// FALLBACK USER (para ambiente atual sem backend)
// ============================================

/**
 * Usuário fallback para ambiente de desenvolvimento
 * NOTA: Remover quando backend real estiver disponível
 */
const getFallbackUser = (): AuthUser | null => {
  // Tenta obter do localStorage
  try {
    const stored = localStorage.getItem('finqz_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignora erros de parse
  }
  return null;
};

// ============================================
// AUTH PROVIDER
// ============================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializa autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Tenta obter usuário do localStorage ou sessão
        const storedUser = getFallbackUser();
        
        if (storedUser) {
          // Garante que Admin Sistema tenha permissões explícitas
          if (storedUser.role === 'ROLE_ADMIN_SISTEMA' && (!storedUser.permissions || storedUser.permissions.length === 0)) {
            storedUser.permissions = ADMIN_PERMISSIONS;
            storedUser.scope = 'GLOBAL';
            localStorage.setItem('finqz_user', JSON.stringify(storedUser));
          }
          setUser(storedUser);
        }
      } catch (error) {
        console.error('[Auth] Erro ao inicializar:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Função de login com access_code ou e-mail
  const login = useCallback(async (credentials: { access_code_or_email: string; senha: string }): Promise<{ success: boolean; must_change_password?: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Importa a API de autenticação
      const { authApi } = await import('../api/modules/auth.api');
      
      // Tenta fazer login
      const result = await authApi.login({
        access_code_or_email: credentials.access_code_or_email,
        senha: credentials.senha,
      });

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Credenciais inválidas',
        };
      }

      // Garante que Admin Sistema tenha permissões explícitas
      if (result.user.role === 'ROLE_ADMIN_SISTEMA' && (!result.user.permissions || result.user.permissions.length === 0)) {
        result.user.permissions = ADMIN_PERMISSIONS;
        result.user.scope = 'GLOBAL';
      }

      // Armazena no localStorage (temporário - tokens devem ser usados em produção)
      localStorage.setItem('finqz_user', JSON.stringify(result.user));
      
      setUser(result.user);
      
      // Inicializa permissões baseadas no perfil do usuário
      const { setUserPermissions } = useAppStore.getState();
      // Admin tem acesso total - aceita vários formatos de perfil admin
      const isAdmin = result.user.perfil === 'admin' || 
                     result.user.perfil === 'Admin Sistema' || 
                     result.user.perfil === 'Admin' ||
                     result.user.role === 'ROLE_ADMIN_SISTEMA';
      
      if (isAdmin) {
        setUserPermissions({ '*': ['*'] });
      } else {
        const profilePerms = PROFILE_PERMISSIONS[result.user.perfil];
        if (profilePerms) {
          setUserPermissions(profilePerms);
        } else {
          // Se não tem perfil definido, usa permissões vazias (acesso negado por padrão)
          setUserPermissions({});
        }
      }
      
      return {
        success: true,
        must_change_password: result.must_change_password,
      };
    } catch (error: any) {
      console.error('[Auth] Erro no login:', error);
      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de logout
  const logout = useCallback(() => {
    // Remove dados de autenticação
    localStorage.removeItem('finqz_user');
    setUser(null);
  }, []);

  // Atualiza dados do usuário
  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      
      // Garante que Admin sempre tenha permissões
      if (updated.role === 'ROLE_ADMIN_SISTEMA' && (!updated.permissions || updated.permissions.length === 0)) {
        updated.permissions = ADMIN_PERMISSIONS;
      }
      
      localStorage.setItem('finqz_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// EXPORT
// ============================================

export default AuthProvider;
