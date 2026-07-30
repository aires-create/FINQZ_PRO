import type { SimulationRuntimeEvidence } from "./simulation-runtime.evidence.types";

const baseEvidence = (): Omit<SimulationRuntimeEvidence, "evidenceId" | "timestamp"> => ({
  environment: "hml",
  tenantIdHash: "tenant-1-hash",
  opportunityIdHash: "opportunity-1-hash",
  requestId: "req-1",
  correlationId: "corr-1",
  executionId: "exec-1",
  productCode: "EMPRESTIMO_COM_GARANTIA",
  subproductCode: "AUTO_EQUITY",
  legacyStatus: "valida",
  canonicalStatus: "CALCULATED",
  comparisonStatus: "EQUIVALENT",
  divergenceCategory: "NONE",
  divergenceCount: 0,
  financialCriticalCount: 0,
  financialMinorCount: 0,
  structuralCount: 0,
  missingCanonicalFieldCount: 0,
  missingLegacyFieldCount: 0,
  mappingFailure: false,
  runtimeFailure: false,
  unsupportedScenario: false,
  legacyDurationMs: null,
  runtimeDurationMs: 168,
  fallbackUsed: false,
  shadowMode: true,
  comparatorVersion: "1.0.0",
  contractVersion: "1.0.0",
  catalogVersion: "3.1.0",
  engineVersion: "3.2.0",
  policyVersion: "1.0.0",
  strategyVersion: "1.0.0",
});

const buildEvidence = (partial: Partial<SimulationRuntimeEvidence>): SimulationRuntimeEvidence => ({
  ...baseEvidence(),
  ...(partial as SimulationRuntimeEvidence),
  evidenceId: partial.evidenceId ?? "evidence-1",
  timestamp: partial.timestamp ?? new Date().toISOString(),
});

export const createAutoEquityApprovedEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "auto-equity-approved-1",
    comparisonStatus: "EQUIVALENT",
    divergenceCategory: "NONE",
    divergenceCount: 0,
    runtimeDurationMs: 150,
  });

export const createAutoEquityRejectedEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "auto-equity-rejected-1",
    comparisonStatus: "NON_EQUIVALENT_CRITICAL",
    divergenceCategory: "FINANCIAL_CRITICAL",
    divergenceCount: 3,
    runtimeDurationMs: 210,
  });

export const createHomeEquityApprovedEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "home-equity-approved-1",
    subproductCode: "HOME_EQUITY",
    comparisonStatus: "EQUIVALENT",
    divergenceCategory: "NONE",
    divergenceCount: 0,
    runtimeDurationMs: 170,
  });

export const createMappingFailureEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "mapping-failure-1",
    comparisonStatus: "MAPPING_FAILURE",
    divergenceCategory: "MAPPING_FAILURE",
    divergenceCount: 1,
    mappingFailure: true,
    runtimeDurationMs: 120,
  });

export const createRuntimeFailureEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "runtime-failure-1",
    comparisonStatus: "RUNTIME_FAILURE",
    divergenceCategory: "RUNTIME_FAILURE",
    divergenceCount: 1,
    runtimeFailure: true,
  });

export const createUnsupportedScenarioEvidence = (): SimulationRuntimeEvidence =>
  buildEvidence({
    evidenceId: "unsupported-1",
    comparisonStatus: "UNSUPPORTED_SCENARIO",
    divergenceCategory: "UNSUPPORTED_SCENARIO",
    divergenceCount: 1,
    unsupportedScenario: true,
  });
