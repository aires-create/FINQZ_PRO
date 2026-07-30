import { afterEach, describe, expect, it, vi } from "vitest";

import { getSimulationRuntimeFlags } from "./simulation-runtime.flags";

describe("simulation-runtime flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the remote evidence flag only from the official VITE env key", () => {
    vi.stubEnv("VITE_REMOTE_EVIDENCE_ENABLED", "true");
    vi.stubEnv("REMOTE_EVIDENCE_ENABLED", "false");

    expect(getSimulationRuntimeFlags().remoteEvidenceEnabled).toBe(true);

    vi.stubEnv("VITE_REMOTE_EVIDENCE_ENABLED", "false");
    vi.stubEnv("REMOTE_EVIDENCE_ENABLED", "true");

    expect(getSimulationRuntimeFlags().remoteEvidenceEnabled).toBe(false);
  });

  it("falls back to false when the official remote evidence flag is unset or invalid", () => {
    vi.stubEnv("VITE_REMOTE_EVIDENCE_ENABLED", "");
    expect(getSimulationRuntimeFlags().remoteEvidenceEnabled).toBe(false);

    vi.stubEnv("VITE_REMOTE_EVIDENCE_ENABLED", "maybe");
    expect(getSimulationRuntimeFlags().remoteEvidenceEnabled).toBe(false);
  });
});
