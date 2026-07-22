// FINQZ PRO - Logout coordination
// Centraliza a limpeza local de auth para manter App, store e listeners sincronizados.

import useAppStore from "../store";
import { clearSession } from "./session";

export const AUTH_LOGOUT_EVENT = "finqz:auth-logout";

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

export const finalizeLocalLogout = (): void => {
  clearSession();
  resetAuthStore();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
};
