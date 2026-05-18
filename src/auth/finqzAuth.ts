// FINQZ PRO - Auth abstraction
// Feature code should depend on this adapter instead of platform clients.

import { finqzClient } from "../api/finqzClient";
import { ApiException } from "../api/http";
import type { LoginCredentials } from "../types";
import { clearSession, getSessionSnapshot, setSessionUser, storeSessionTokens } from "./session";
import {
  mapBackendAuthUser,
  type BackendLoginResponse,
  type MappedFinqzUser,
} from "./userMapper";

export interface FinqzLoginResult {
  success: boolean;
  user?: MappedFinqzUser;
  error?: string;
  must_change_password?: boolean;
  backendUnavailable?: boolean;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const finqzAuth = {
  login: async (input: LoginCredentials): Promise<FinqzLoginResult> => {
    const email = input.access_code_or_email.trim().toLowerCase();

    if (!emailPattern.test(email)) {
      return {
        success: false,
        error: "Use seu e-mail corporativo para entrar nesta versão.",
      };
    }

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
      setSessionUser(mappedUser);

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
  getSession: async () => {
    const nativeSession = getSessionSnapshot();
    if (nativeSession.isAuthenticated) {
      return nativeSession;
    }

    return finqzClient.auth.getSession();
  },
  signOut: async () => {
    clearSession();
    return finqzClient.auth.signOut();
  },
};

export const getSession = finqzAuth.getSession;
export const login = finqzAuth.login;
export const signOut = finqzAuth.signOut;
