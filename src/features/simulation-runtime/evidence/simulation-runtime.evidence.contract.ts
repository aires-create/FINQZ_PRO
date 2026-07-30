import type { SimulationRuntimeNormalizedResponse } from "../mappers/simulation-runtime-response.mapper";
import type { SimulationRuntimeLegacyResult, SimulationRuntimeWorkspaceInput } from "../contracts/simulation-runtime.contract";
import type { SimulationRuntimeComparison } from "../comparison/simulation-runtime.comparison.types";
import type { SimulationRuntimeEvidence } from "./simulation-runtime.evidence.types";

export interface SimulationRuntimeEvidenceCollectorContext {
  workspace: SimulationRuntimeWorkspaceInput;
  legacyResult: SimulationRuntimeLegacyResult | null;
  runtime: SimulationRuntimeNormalizedResponse;
  comparison: SimulationRuntimeComparison;
  requestId: string;
  correlationId: string;
  executionId: string;
  legacyDurationMs?: number | null;
  runtimeDurationMs?: number | null;
  fallbackUsed?: boolean;
}

export type SimulationRuntimeEvidenceSink = (evidence: SimulationRuntimeEvidence) => void | Promise<void>;
export type SimulationRuntimeEvidenceStoreProvider = () => Promise<SimulationRuntimeEvidenceStore>;

export interface SimulationRuntimeEvidenceStore {
  save(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeEvidence>;
  findByEvidenceId(evidenceId: string): Promise<SimulationRuntimeEvidence | null>;
  list(): Promise<SimulationRuntimeEvidence[]>;
}
