import type { SimulationRuntimeNormalizedResponse } from "../mappers/simulation-runtime-response.mapper";
import type { SimulationRuntimeLegacyResult, SimulationRuntimeWorkspaceInput } from "../contracts/simulation-runtime.contract";
import type { SimulationRuntimeComparison } from "../comparison/simulation-runtime.comparison.types";
import type { SimulationRuntimeEvidence } from "./simulation-runtime.evidence.types";
import { sanitizeSimulationRuntimeEvidence } from "./simulation-runtime.evidence.sanitizer";

export interface SimulationRuntimeEvidenceCollectorInput {
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

export const collectSimulationRuntimeEvidence = async (
  input: SimulationRuntimeEvidenceCollectorInput,
): Promise<SimulationRuntimeEvidence> => {
  return sanitizeSimulationRuntimeEvidence({
    workspace: input.workspace,
    legacyResult: input.legacyResult,
    runtime: input.runtime,
    comparison: input.comparison,
    requestId: input.requestId,
    correlationId: input.correlationId,
    executionId: input.executionId,
    legacyDurationMs: input.legacyDurationMs ?? null,
    runtimeDurationMs: input.runtimeDurationMs ?? null,
    fallbackUsed: input.fallbackUsed ?? false,
  });
};
