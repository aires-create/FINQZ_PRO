// FINQZ PRO - Auth abstraction
// Feature code should depend on this adapter instead of platform clients.

import { finqzClient } from "../api/finqzClient";

export const finqzAuth = {
  getSession: () => finqzClient.auth.getSession(),
  signOut: () => finqzClient.auth.signOut(),
};

export const getSession = finqzAuth.getSession;
export const signOut = finqzAuth.signOut;

