// FINQZ PRO - Local auth logout cleanup
// Centraliza a limpeza idempotente da sessão e do estado protegido.

import useAppStore from "../store";
import { clearSession } from "./session";

export const AUTH_LOGOUT_EVENT = "auth:logout";

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
  clearProtectedStoreState();
  broadcastAuthLogout();
};
