// FINQZ PRO - Local auth logout cleanup
// Centraliza a limpeza idempotente da sessão e do estado protegido.

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
    // Ignora falhas de cancelamento durante logout.
  }

  try {
    queryClient.clear?.();
  } catch {
    // Ignora falhas de limpeza de cache durante logout.
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
      // Cada cleanup deve ser independente.
    }
  }
};

const clearProtectedStoreState = (): void => {
  useAppStore.setState({
    isAuthenticated: false,
    user: null,
    userPermissions: {},
    clientes: [],
    produtos: [],
    estruturaComercial: [],
    roteirosOperacionais: [],
    transacoesFinanceiras: [],
    movimentosContaCorrente: [],
    parceiros: [],
    usuarios: [],
    pipelines: [],
    oportunidadesKanban: [],
    currentPipelineId: "",
  });
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
  clearProtectedStoreState();
  broadcastAuthLogout();
};
