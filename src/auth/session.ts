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

interface SessionRuntimeState {
  isActive: boolean;
  version: number;
}

const sessionRuntime: SessionRuntimeState = {
  isActive: false,
  version: 0,
};

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

const syncRuntimeStateFromStorage = (): void => {
  if (sessionRuntime.isActive) {
    return;
  }

  if (safeLocalStorageGet(STORAGE_KEYS.USER) || safeLocalStorageGet(STORAGE_KEYS.TOKEN) || safeLocalStorageGet(STORAGE_KEYS.REFRESH_TOKEN)) {
    sessionRuntime.isActive = true;
  }
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

  sessionRuntime.isActive = true;
  safeLocalStorageSet(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getSessionSnapshot = (): FinqzSessionSnapshot => {
  syncRuntimeStateFromStorage();

  const user = getCurrentUser();
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return {
    data: {
      user,
    },
    isAuthenticated: sessionRuntime.isActive && Boolean(user || accessToken || refreshToken),
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    source: "finqz",
  };
};

export const isAuthenticated = (): boolean => {
  return getSessionSnapshot().isAuthenticated;
};

export const getSessionVersion = (): number => {
  return sessionRuntime.version;
};

export const isSessionActive = (): boolean => {
  syncRuntimeStateFromStorage();
  return sessionRuntime.isActive;
};

export const canRefreshSession = (): boolean => {
  return isSessionActive() && Boolean(getAccessToken() && getRefreshToken());
};

export const storeSessionTokens = (tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): void => {
  if (tokens.accessToken || tokens.refreshToken) {
    sessionRuntime.isActive = true;
  }

  if ("accessToken" in tokens) {
    setAccessToken(tokens.accessToken);
  }

  if ("refreshToken" in tokens) {
    setRefreshToken(tokens.refreshToken);
  }
};

export const clearSession = (): void => {
  sessionRuntime.isActive = false;
  sessionRuntime.version += 1;
  safeLocalStorageRemove(STORAGE_KEYS.TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.REFRESH_TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.USER);
};

export const getStoredAuthToken = getAccessToken;
export const getStoredRefreshToken = getRefreshToken;
export const getStoredUser = getCurrentUser;
export const clearStoredSession = clearSession;
