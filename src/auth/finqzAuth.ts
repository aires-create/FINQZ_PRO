// FINQZ PRO - Auth abstraction
// Feature code should depend on this adapter instead of platform clients.

import { finqzClient } from "../api/finqzClient";
import { ApiException, refreshSessionTokens } from "../api/http";
import type { LoginCredentials } from "../types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  storeSessionTokens,
} from "./session";
import {
  mapBackendAuthUser,
  type BackendLoginResponse,
  type MappedFinqzUser,
} from "./userMapper";

interface BackendSessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: string;
  perfil: string;
  tenantId: string;
  tenantName: string;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  permissions: string[];
}

interface BackendSessionResponse {
  success: boolean;
  data?: {
    user: BackendSessionUser;
  };
  message?: string;
}

export interface FinqzLoginResult {
  success: boolean;
  user?: MappedFinqzUser;
  error?: string;
  must_change_password?: boolean;
  backendUnavailable?: boolean;
}

export interface FinqzRefreshResult {
  success: boolean;
  error?: string;
}

export interface FinqzLogoutResult {
  success: boolean;
  error?: string;
  backendUnavailable?: boolean;
}

interface NativeLogoutResponse {
  success: boolean;
  message?: string;
}

const isBackendUnavailable = (error: unknown): boolean => {
  if (!(error instanceof ApiException)) {
    return false;
  }

  return error.code === "NETWORK_ERROR" ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504;
};

const getLoginErrorMessage = (error: unknown): string => {
  if (error instanceof ApiException && (error.status === 401 || error.status === 403)) {
    return "E-mail ou senha inválidos.";
  }

  if (error instanceof ApiException) {
    return error.message;
  }

  return "Não foi possível entrar agora.";
};

const buildLogoutPayload = (): { refreshToken: string } | undefined => {
  const refreshToken = getRefreshToken();
  return refreshToken ? { refreshToken } : undefined;
};

const executeNativeLogout = async (): Promise<boolean> => {
  const response = await finqzClient.post<NativeLogoutResponse>(
    "/api/v1/auth/logout",
    buildLogoutPayload(),
    {
      credentials: "include",
      skipAuthRefresh: true,
    },
  );

  return response.data.success;
};

export const finqzAuth = {
  login: async (input: LoginCredentials): Promise<FinqzLoginResult> => {
    const email = input.access_code_or_email.trim().toLowerCase();

    try {
      const response = await finqzClient.post<BackendLoginResponse>(
        "/api/v1/auth/login",
        {
          email,
          password: input.senha,
        },
        {
          credentials: "include",
        },
      );

      const authData = response.data.data;
      if (!response.data.success || !authData) {
        return {
          success: false,
          error: response.data.message || "Não foi possível entrar agora.",
        };
      }

      const mappedUser = mapBackendAuthUser(authData.user);

      storeSessionTokens({
        accessToken: authData.tokens.accessToken,
        refreshToken: authData.tokens.refreshToken,
      });

      return {
        success: true,
        user: mappedUser,
        must_change_password: mappedUser.must_change_password,
      };
    } catch (error) {
      if (isBackendUnavailable(error)) {
        return {
          success: false,
          backendUnavailable: true,
          error: "Backend indisponível.",
        };
      }

      return {
        success: false,
        error: getLoginErrorMessage(error),
      };
    }
  },
  refreshSession: async (): Promise<FinqzRefreshResult> => {
    const refreshed = await refreshSessionTokens();

    if (!refreshed) {
      return {
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      };
    }

    return { success: true };
  },
  logoutNative: async (): Promise<FinqzLogoutResult> => {
    if (!getAccessToken()) {
      return {
        success: false,
        error: "Sessão nativa ausente.",
      };
    }

    try {
      return { success: await executeNativeLogout() };
    } catch (error) {
      if (error instanceof ApiException && error.status === 401 && getRefreshToken()) {
        const refreshed = await refreshSessionTokens();

        if (refreshed && getAccessToken()) {
          try {
            return { success: await executeNativeLogout() };
          } catch (retryError) {
            return {
              success: false,
              error: retryError instanceof ApiException
                ? retryError.message
                : "Não foi possível encerrar a sessão nativa.",
            };
          }
        }
      }

      return {
        success: false,
        backendUnavailable: isBackendUnavailable(error),
        error: error instanceof ApiException
          ? error.message
          : "Não foi possível encerrar a sessão nativa.",
      };
    }
  },
  getSession: async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      return {
        data: null,
        error: null,
      };
    }

    try {
      const response = await finqzClient.get<BackendSessionResponse>("/api/v1/auth/profile");
      const sessionUser = response.data?.data?.user;

      if (!response.data.success || !sessionUser) {
        return {
          data: null,
          error: null,
        };
      }

      const normalizedUser: MappedFinqzUser = {
        ...mapBackendAuthUser({
          id: sessionUser.id,
          email: sessionUser.email,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          roleId: sessionUser.roleId,
          role: sessionUser.role,
          tenantId: sessionUser.tenantId,
          tenantName: sessionUser.tenantName,
          permissions: sessionUser.permissions,
        }),
        perfil: sessionUser.perfil,
        roleId: sessionUser.roleId,
        tenantName: sessionUser.tenantName,
        permissions: sessionUser.permissions,
      };

      return {
        data: {
          user: normalizedUser,
        },
        error: null,
      };
    } catch {
      return {
        data: null,
        error: null,
      };
    }
  },
  signOut: async () => {
    let nativeLogout: FinqzLogoutResult | undefined;
    let fallbackError: unknown = null;

    try {
      if (getAccessToken()) {
        nativeLogout = await finqzAuth.logoutNative();
      }

      if (!nativeLogout?.success) {
        const fallback = await finqzClient.auth.signOut();
        fallbackError = fallback.error;
      }

      return {
        data: null,
        error: nativeLogout?.success ? null : nativeLogout?.error ?? fallbackError,
      };
    } finally {
      clearSession();
    }
  },
};

export const getSession = finqzAuth.getSession;
export const login = finqzAuth.login;
export const logoutNative = finqzAuth.logoutNative;
export const refreshSession = finqzAuth.refreshSession;
export const signOut = finqzAuth.signOut;
