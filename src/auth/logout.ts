// FINQZ PRO - Local auth logout cleanup
// Centralizes the idempotent cleanup of session state and protected UI state.

import useAppStore from "../store";
import { clearSession } from "./session";

export const AUTH_LOGOUT_EVENT = "auth:logout";

type AuthCleanupTask = () => void;

const authCleanupTasks = new Set<AuthCleanupTask>();

const clearReactQueryCache = (): void => {
  const globalWindow = typeof window !== "undefined" ? window as Window & {
    __FINQZ_QUERY_CLIENT__?: {
      clear?: () => void;
      cancelQueries?: () => Promise<unknown> | void;
    };
  } : undefined;

  const queryClient = globalWindow?.__FINQZ_QUERY_CLIENT__;
  if (!queryClient) {
    return;
  }

  try {
    void queryClient.cancelQueries?.();
  } catch {
    // Ignore cleanup errors during logout.
  }

  try {
    queryClient.clear?.();
  } catch {
    // Ignore cache cleanup errors during logout.
  }
};

export const registerAuthCleanupTask = (task: AuthCleanupTask): (() => void) => {
  authCleanupTasks.add(task);

  return () => {
    authCleanupTasks.delete(task);
  };
};

const runAuthCleanupTasks = (): void => {
  for (const task of authCleanupTasks) {
    try {
      task();
    } catch {
      // Each cleanup must stay isolated from the others.
    }
  }
};

const resetAuthStore = (): void => {
  const storeApi = useAppStore as typeof useAppStore & {
    getState?: () => {
      setAuth?: (user: unknown) => void;
      setUserPermissions?: (permissions: Record<string, string[]>) => void;
    };
  };

  const store = typeof storeApi.getState === "function" ? storeApi.getState() : null;
  store?.setAuth?.(null);
  store?.setUserPermissions?.({});
};

export const broadcastAuthLogout = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
};

export const clearLocalAuthState = (): void => {
  clearSession();
  runAuthCleanupTasks();
  clearReactQueryCache();
  resetAuthStore();
  broadcastAuthLogout();
};

export const finalizeLocalLogout = clearLocalAuthState;
