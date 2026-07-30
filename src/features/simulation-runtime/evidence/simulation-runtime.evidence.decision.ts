import type { SimulationRuntimeEvidenceAggregation } from "./simulation-runtime.evidence.aggregator";

export type SimulationRuntimeEvidenceDecision =
  | "REMAIN_IN_SHADOW_MODE"
  | "FIX_MAPPERS"
  | "FIX_CONTRACTS"
  | "FIX_RUNTIME"
  | "INSUFFICIENT_EVIDENCE"
  | "APPROVE_CANARY_MODE"
  | "NO_GO";

export interface SimulationRuntimeEvidenceDecisionCriteria {
  minTotalExecutions: number;
  minExecutionsPerSubproduct: number;
  minEquivalenceRate: number;
  minRuntimeSuccessRate: number;
  maxFallbackRate: number;
}

export const defaultSimulationRuntimeEvidenceDecisionCriteria: SimulationRuntimeEvidenceDecisionCriteria = {
  minTotalExecutions: 50,
  minExecutionsPerSubproduct: 10,
  minEquivalenceRate: 0.99,
  minRuntimeSuccessRate: 0.98,
  maxFallbackRate: 0.05,
};

export const assessSimulationRuntimeEvidence = (
  aggregation: SimulationRuntimeEvidenceAggregation,
  criteria: SimulationRuntimeEvidenceDecisionCriteria = defaultSimulationRuntimeEvidenceDecisionCriteria,
): SimulationRuntimeEvidenceDecision => {
  if (aggregation.totalExecutions === 0) {
    return "INSUFFICIENT_EVIDENCE";
  }

  if (aggregation.totalExecutions < criteria.minTotalExecutions) {
    return "INSUFFICIENT_EVIDENCE";
  }

  if (aggregation.mappingFailures > 0) {
    return "FIX_MAPPERS";
  }

  if (aggregation.runtimeFailures > 0) {
    return "FIX_RUNTIME";
  }

  if (aggregation.criticalDivergences > 0 || aggregation.structuralDivergences > 0) {
    return "FIX_CONTRACTS";
  }

  if (aggregation.unsupportedScenarios > 0) {
    return "REMAIN_IN_SHADOW_MODE";
  }

  if (aggregation.equivalenceRate < criteria.minEquivalenceRate) {
    return "REMAIN_IN_SHADOW_MODE";
  }

  if (aggregation.runtimeSuccessRate < criteria.minRuntimeSuccessRate) {
    return "REMAIN_IN_SHADOW_MODE";
  }

  if (aggregation.fallbackRate > criteria.maxFallbackRate) {
    return "REMAIN_IN_SHADOW_MODE";
  }

  return "APPROVE_CANARY_MODE";
};
