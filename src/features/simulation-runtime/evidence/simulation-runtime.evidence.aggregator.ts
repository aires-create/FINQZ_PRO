import type { SimulationRuntimeEvidence } from "./simulation-runtime.evidence.types";

export interface SimulationRuntimeEvidenceAggregation {
  totalExecutions: number;
  supportedExecutions: number;
  equivalentExecutions: number;
  equivalentWithInformationalDifferences: number;
  expectedCompatibilityDifferences: number;
  minorDivergences: number;
  criticalDivergences: number;
  structuralDivergences: number;
  mappingFailures: number;
  runtimeFailures: number;
  unsupportedScenarios: number;
  insufficientData: number;
  equivalenceRate: number;
  criticalDivergenceRate: number;
  runtimeSuccessRate: number;
  legacyAverageDurationMs: number | null;
  runtimeAverageDurationMs: number | null;
  runtimeP50DurationMs: number | null;
  runtimeP95DurationMs: number | null;
  runtimeP99DurationMs: number | null;
  fallbackRate: number;
}

export interface SimulationRuntimeEvidenceBreakdown {
  byProduct: Record<string, SimulationRuntimeEvidenceAggregation>;
  bySubproduct: Record<string, SimulationRuntimeEvidenceAggregation>;
  byEnvironment: Record<string, SimulationRuntimeEvidenceAggregation>;
}

const sortNumeric = (values: number[]): number[] => [...values].sort((a, b) => a - b);

const percentile = (values: number[], percent: number): number | null => {
  if (!values.length) return null;
  const sorted = sortNumeric(values);
  const idx = (values.length - 1) * percent;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower] ?? null;
  const weight = idx - lower;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
};

const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0;
  return numerator / denominator;
};

const toDurations = (evidences: SimulationRuntimeEvidence[]): number[] => {
  return evidences
    .map((item) => item.runtimeDurationMs)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
};

const buildAggregation = (items: SimulationRuntimeEvidence[]): SimulationRuntimeEvidenceAggregation => {
  const totalExecutions = items.length;
  const equivalentExecutions = items.filter((item) => item.comparisonStatus === "EQUIVALENT").length;
  const equivalentWithInformationalDifferences = items.filter((item) => item.comparisonStatus === "EQUIVALENT_WITH_INFORMATIONAL_DIFFERENCES").length;
  const expectedCompatibilityDifferences = items.filter((item) => item.comparisonStatus === "EXPECTED_COMPATIBILITY_DIFFERENCE").length;
  const minorDivergences = items.filter((item) => item.comparisonStatus === "NON_EQUIVALENT_MINOR").length;
  const criticalDivergences = items.filter((item) => item.comparisonStatus === "NON_EQUIVALENT_CRITICAL").length;
  const structuralDivergences = items.filter((item) => item.comparisonStatus === "STRUCTURALLY_INCOMPATIBLE").length;
  const mappingFailures = items.filter((item) => item.mappingFailure).length;
  const runtimeFailures = items.filter((item) => item.runtimeFailure).length;
  const unsupportedScenarios = items.filter((item) => item.unsupportedScenario).length;
  const insufficientData = items.filter((item) => item.comparisonStatus === "INSUFFICIENT_DATA").length;
  const supportedExecutions = items.filter((item) => !item.mappingFailure && !item.runtimeFailure && !item.unsupportedScenario).length;

  const durations = toDurations(items);
  const runtimeAverageDurationMs = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;

  return {
    totalExecutions,
    supportedExecutions,
    equivalentExecutions,
    equivalentWithInformationalDifferences,
    expectedCompatibilityDifferences,
    minorDivergences,
    criticalDivergences,
    structuralDivergences,
    mappingFailures,
    runtimeFailures,
    unsupportedScenarios,
    insufficientData,
    equivalenceRate: safeDivide(equivalentExecutions + equivalentWithInformationalDifferences + expectedCompatibilityDifferences, totalExecutions),
    criticalDivergenceRate: safeDivide(criticalDivergences, totalExecutions),
    runtimeSuccessRate: safeDivide(totalExecutions - runtimeFailures, totalExecutions),
    legacyAverageDurationMs: null,
    runtimeAverageDurationMs,
    runtimeP50DurationMs: percentile(durations, 0.5),
    runtimeP95DurationMs: percentile(durations, 0.95),
    runtimeP99DurationMs: percentile(durations, 0.99),
    fallbackRate: safeDivide(items.filter((item) => item.fallbackUsed).length, totalExecutions),
  };
};

export const aggregateSimulationRuntimeEvidence = (
  evidences: SimulationRuntimeEvidence[],
): SimulationRuntimeEvidenceAggregation & SimulationRuntimeEvidenceBreakdown => {
  const byProduct: Record<string, SimulationRuntimeEvidence[]>
    = {};
  const bySubproduct: Record<string, SimulationRuntimeEvidence[]>
    = {};
  const byEnvironment: Record<string, SimulationRuntimeEvidence[]>
    = {};

  for (const evidence of evidences) {
    const product = evidence.productCode || "UNKNOWN";
    const subproduct = evidence.subproductCode || "UNKNOWN";
    const environment = evidence.environment || "unknown";

    byProduct[product] = byProduct[product] ?? [];
    byProduct[product].push(evidence);

    bySubproduct[subproduct] = bySubproduct[subproduct] ?? [];
    bySubproduct[subproduct].push(evidence);

    byEnvironment[environment] = byEnvironment[environment] ?? [];
    byEnvironment[environment].push(evidence);
  }

  return {
    ...buildAggregation(evidences),
    byProduct: Object.fromEntries(
      Object.entries(byProduct).map(([key, items]) => [key, buildAggregation(items)]),
    ),
    bySubproduct: Object.fromEntries(
      Object.entries(bySubproduct).map(([key, items]) => [key, buildAggregation(items)]),
    ),
    byEnvironment: Object.fromEntries(
      Object.entries(byEnvironment).map(([key, items]) => [key, buildAggregation(items)]),
    ),
  };
};

export const aggregateSimulationRuntimeEvidenceForSubproduct = (
  evidences: SimulationRuntimeEvidence[],
  subproductCode: string,
): SimulationRuntimeEvidenceAggregation => {
  return buildAggregation(evidences.filter((item) => item.subproductCode === subproductCode));
};
