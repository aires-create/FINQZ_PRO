// FINQZ PRO - Frontend session utilities
// Centralizes local session storage without exposing sensitive values.

import { STORAGE_KEYS } from "../config/environment";

export interface FinqzSessionUser {
  id?: string;
  email?: string;
  name?: string;
  nome?: string;
  perfil?: string;
  role?: string;
  scope?: string;
  permissions?: string[];
  [key: string]: unknown;
}

export interface FinqzSessionData {
  user?: FinqzSessionUser | null;
}

export interface FinqzSession {
  data?: FinqzSessionData | null;
  error?: unknown;
}

export interface FinqzSessionSnapshot extends FinqzSession {
  isAuthenticated: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  source: "finqz";
}

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
};

const safeLocalStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
};

const setTokenValue = (key: string, token: string | null | undefined): void => {
  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    safeLocalStorageRemove(key);
    return;
  }

  safeLocalStorageSet(key, normalizedToken);
};

export const getAccessToken = (): string | null => {
  return safeLocalStorageGet(STORAGE_KEYS.TOKEN);
};

export const setAccessToken = (token: string | null | undefined): void => {
  setTokenValue(STORAGE_KEYS.TOKEN, token);
};

export const getRefreshToken = (): string | null => {
  return safeLocalStorageGet(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string | null | undefined): void => {
  setTokenValue(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getCurrentUser = <T extends FinqzSessionUser = FinqzSessionUser>(): T | null => {
  const storedUser = safeLocalStorageGet(STORAGE_KEYS.USER);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as T;
  } catch {
    return null;
  }
};

export const setSessionUser = (user: FinqzSessionUser | null | undefined): void => {
  if (!user) {
    safeLocalStorageRemove(STORAGE_KEYS.USER);
    return;
  }

  safeLocalStorageSet(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getSessionSnapshot = (): FinqzSessionSnapshot => {
  const user = getCurrentUser();
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return {
    data: {
      user,
    },
    isAuthenticated: Boolean(user || accessToken),
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    source: "finqz",
  };
};

export const isAuthenticated = (): boolean => {
  return getSessionSnapshot().isAuthenticated;
};

export const storeSessionTokens = (tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): void => {
  if ("accessToken" in tokens) {
    setAccessToken(tokens.accessToken);
  }

  if ("refreshToken" in tokens) {
    setRefreshToken(tokens.refreshToken);
  }
};

export const clearSession = (): void => {
  safeLocalStorageRemove(STORAGE_KEYS.TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.REFRESH_TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.USER);
};

export const getStoredAuthToken = getAccessToken;
export const getStoredRefreshToken = getRefreshToken;
export const getStoredUser = getCurrentUser;
export const clearStoredSession = clearSession;
