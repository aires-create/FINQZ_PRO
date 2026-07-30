// FINQZ PRO - Auth Provider
// Provider de contexto de autenticação
// Fonte oficial: backend + sessão por token

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthUser } from "./permissions";
import useAppStore from "../store";
import { PROFILE_PERMISSIONS } from "../types";
import { mergeFrontendAdminPermissions } from "../config/permissions";
import { finqzAuth } from "./finqzAuth";
import { AUTH_LOGOUT_EVENT } from "./logout";
import { getSessionVersion, isSessionActive } from "./session";

// ============================================
// TYPES
// ============================================

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { access_code_or_email: string; senha: string }) => Promise<{ success: boolean; must_change_password?: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================
// CONTEXT
// ============================================

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ============================================
// AUTH PROVIDER
// ============================================
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuthenticatedState = useCallback(() => {
    setUser(null);
    setLoading(false);
    useAppStore.setState({
      isAuthenticated: false,
      user: null,
      userPermissions: {},
    });
  }, []);

  // Inicializa autenticação
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const sessionVersion = getSessionVersion();

      try {
        const session = await finqzAuth.getSession();

        if (cancelled || sessionVersion !== getSessionVersion() || !isSessionActive()) {
          return;
        }

        const sessionUser = session.data?.user;

        if (sessionUser) {
          const normalizedUser = sessionUser.role === "ROLE_ADMIN_SISTEMA"
            ? {
                ...sessionUser,
                permissions: mergeFrontendAdminPermissions(sessionUser.permissions),
                scope: "GLOBAL",
              }
            : sessionUser;

          setUser(normalizedUser);
          useAppStore.getState().setAuth(normalizedUser);
        } else {
          clearAuthenticatedState();
        }
      } catch (error) {
        console.error("[Auth] Erro ao inicializar:", error);
      } finally {
        if (!cancelled && sessionVersion === getSessionVersion()) {
          setLoading(false);
        }
      }
    };

    void initAuth();

    return () => {
      cancelled = true;
    };
  }, [clearAuthenticatedState]);

  useEffect(() => {
    const handleLogout = () => {
      clearAuthenticatedState();
      navigate("/login", { replace: true });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout as EventListener);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout as EventListener);
    };
  }, [clearAuthenticatedState, navigate]);

  // Função de login com access_code ou e-mail
  const login = useCallback(async (credentials: { access_code_or_email: string; senha: string }): Promise<{ success: boolean; must_change_password?: boolean; error?: string }> => {
    try {
      setLoading(true);

      const result = await finqzAuth.login({
        access_code_or_email: credentials.access_code_or_email,
        senha: credentials.senha,
      });

      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || "Credenciais inválidas",
        };
      }

      // Garante que Admin Sistema tenha permissões explícitas
      if (result.user.role === "ROLE_ADMIN_SISTEMA") {
        result.user.permissions = mergeFrontendAdminPermissions(result.user.permissions);
        result.user.scope = "GLOBAL";
      }

      setUser(result.user);
      useAppStore.getState().setAuth(result.user);

      const { setUserPermissions } = useAppStore.getState();

      const isAdmin =
        result.user.perfil === "admin" ||
        result.user.perfil === "Admin Sistema" ||
        result.user.perfil === "Admin" ||
        result.user.role === "ROLE_ADMIN_SISTEMA";

      if (isAdmin) {
        setUserPermissions({ "*": ["*"] });
      } else if (Array.isArray(result.user.permissions) && result.user.permissions.length > 0) {
        const convertedPermissions = result.user.permissions.reduce<Record<string, string[]>>((acc, permission) => {
          if (typeof permission !== "string" || !permission) {
            return acc;
          }

          const normalizedPermission = permission.toUpperCase();

          if (normalizedPermission === "*") {
            acc["*"] = ["*"];
            return acc;
          }

          const lastSeparatorIndex = normalizedPermission.lastIndexOf("_");
          if (lastSeparatorIndex <= 0 || lastSeparatorIndex >= normalizedPermission.length - 1) {
            const fallbackKey = normalizedPermission.toLowerCase();
            acc[fallbackKey] = acc[fallbackKey] || [];
            acc[fallbackKey].push("*");
            return acc;
          }

          const moduleKey = normalizedPermission.slice(0, lastSeparatorIndex).toLowerCase();
          const actionKey = normalizedPermission.slice(lastSeparatorIndex + 1).toLowerCase();
          acc[moduleKey] = acc[moduleKey] || [];
          acc[moduleKey].push(actionKey);
          return acc;
        }, {});

        setUserPermissions(convertedPermissions);
      } else {
        const profilePerms = PROFILE_PERMISSIONS[result.user.perfil];
        setUserPermissions(profilePerms || {});
      }

      return {
        success: true,
        must_change_password: result.must_change_password,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      console.error("[Auth] Erro no login:", error);
      return {
        success: false,
        error: message || "Erro ao fazer login",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de logout
  const logout = useCallback(async () => {
    await finqzAuth.signOut();
  }, []);

  // Atualiza dados do usuário
  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };

      // Garante que Admin sempre tenha permissões
      if (updated.role === "ROLE_ADMIN_SISTEMA") {
        updated.permissions = mergeFrontendAdminPermissions(updated.permissions);
      }

      useAppStore.getState().setAuth(updated);
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
