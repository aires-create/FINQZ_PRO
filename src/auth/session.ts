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

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
};

export const getStoredAuthToken = (): string | null => {
  return safeLocalStorageGet(STORAGE_KEYS.TOKEN);
};

export const getStoredRefreshToken = (): string | null => {
  return safeLocalStorageGet(STORAGE_KEYS.REFRESH_TOKEN);
};

export const getStoredUser = <T extends FinqzSessionUser = FinqzSessionUser>(): T | null => {
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

export const clearStoredSession = (): void => {
  safeLocalStorageRemove(STORAGE_KEYS.TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.REFRESH_TOKEN);
  safeLocalStorageRemove(STORAGE_KEYS.USER);
};

