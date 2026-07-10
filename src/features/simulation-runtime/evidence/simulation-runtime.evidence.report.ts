import type { SimulationRuntimeEvidence } from "./simulation-runtime.evidence.types";
import { aggregateSimulationRuntimeEvidence } from "./simulation-runtime.evidence.aggregator";

export interface SimulationRuntimeEvidenceReport {
  generatedAt: string;
  period?: {
    from?: string;
    to?: string;
  };
  totalExecutions: number;
  supportedExecutions: number;
  equivalenceRate: number;
  criticalDivergenceRate: number;
  runtimeSuccessRate: number;
  totalCriticalDivergences: number;
  totalMinorDivergences: number;
  totalStructuralDivergences: number;
  totalMappingFailures: number;
  totalRuntimeFailures: number;
  totalUnsupportedScenarios: number;
  fallbackRate: number;
  byProduct: Record<string, ReturnType<typeof aggregateSimulationRuntimeEvidence>>;
  bySubproduct: Record<string, ReturnType<typeof aggregateSimulationRuntimeEvidence>>;
  byEnvironment: Record<string, ReturnType<typeof aggregateSimulationRuntimeEvidence>>;
}

export const buildSimulationRuntimeEvidenceReport = (
  evidences: SimulationRuntimeEvidence[],
  period?: { from?: string; to?: string },
): SimulationRuntimeEvidenceReport => {
  const aggregation = aggregateSimulationRuntimeEvidence(evidences);

  return {
    generatedAt: new Date().toISOString(),
    period,
    totalExecutions: aggregation.totalExecutions,
    supportedExecutions: aggregation.supportedExecutions,
    equivalenceRate: aggregation.equivalenceRate,
    criticalDivergenceRate: aggregation.criticalDivergenceRate,
    runtimeSuccessRate: aggregation.runtimeSuccessRate,
    totalCriticalDivergences: aggregation.criticalDivergences,
    totalMinorDivergences: aggregation.minorDivergences,
    totalStructuralDivergences: aggregation.structuralDivergences,
    totalMappingFailures: aggregation.mappingFailures,
    totalRuntimeFailures: aggregation.runtimeFailures,
    totalUnsupportedScenarios: aggregation.unsupportedScenarios,
    fallbackRate: aggregation.fallbackRate,
    byProduct: aggregation.byProduct,
    bySubproduct: aggregation.bySubproduct,
    byEnvironment: aggregation.byEnvironment,
  };
};
