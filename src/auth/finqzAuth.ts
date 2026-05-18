// FINQZ PRO - Auth abstraction
// Feature code should depend on this adapter instead of platform clients.

import { finqzClient } from "../api/finqzClient";
import { clearSession, getSessionSnapshot } from "./session";

export const finqzAuth = {
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
export const signOut = finqzAuth.signOut;
