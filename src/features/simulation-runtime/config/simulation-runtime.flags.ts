export interface SimulationRuntimeFlags {
  shadowEnabled: boolean;
  primaryEnabled: boolean;
  fallbackEnabled: boolean;
  evidenceEnabled: boolean;
  remoteEvidenceEnabled: boolean;
}

const readBooleanEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const getSimulationRuntimeFlags = (): SimulationRuntimeFlags => ({
  shadowEnabled: readBooleanEnv(import.meta.env.VITE_SIMULATION_RUNTIME_SHADOW_ENABLED, false),
  primaryEnabled: readBooleanEnv(import.meta.env.VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED, false),
  fallbackEnabled: readBooleanEnv(import.meta.env.VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED, true),
  evidenceEnabled: readBooleanEnv(import.meta.env.VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED, false),
  remoteEvidenceEnabled: readBooleanEnv(import.meta.env.VITE_REMOTE_EVIDENCE_ENABLED, false),
});
