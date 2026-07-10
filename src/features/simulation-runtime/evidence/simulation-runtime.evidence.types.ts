import type { SimulationRuntimeDivergenceCategory } from "../comparison/simulation-runtime.comparison.types";

export type SimulationRuntimeEquivalenceStatus =
  | "EQUIVALENT"
  | "EQUIVALENT_WITH_INFORMATIONAL_DIFFERENCES"
  | "EXPECTED_COMPATIBILITY_DIFFERENCE"
  | "NON_EQUIVALENT_MINOR"
  | "NON_EQUIVALENT_CRITICAL"
  | "STRUCTURALLY_INCOMPATIBLE"
  | "MAPPING_FAILURE"
  | "RUNTIME_FAILURE"
  | "UNSUPPORTED_SCENARIO"
  | "INSUFFICIENT_DATA";

export interface SimulationRuntimeEvidence {
  evidenceId: string;
  timestamp: string;
  environment: string;
  tenantIdHash: string | null;
  opportunityIdHash: string | null;
  requestId: string;
  correlationId: string;
  executionId: string;
  productCode: string;
  subproductCode: string;
  legacyStatus: string | null;
  canonicalStatus: string;
  comparisonStatus: SimulationRuntimeEquivalenceStatus;
  divergenceCategory: SimulationRuntimeDivergenceCategory;
  divergenceCount: number;
  financialCriticalCount: number;
  financialMinorCount: number;
  structuralCount: number;
  missingCanonicalFieldCount: number;
  missingLegacyFieldCount: number;
  mappingFailure: boolean;
  runtimeFailure: boolean;
  unsupportedScenario: boolean;
  legacyDurationMs?: number | null;
  runtimeDurationMs?: number | null;
  fallbackUsed: boolean;
  shadowMode: boolean;
  comparatorVersion: string;
  contractVersion: string;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
}

export interface SimulationRuntimeEvidenceStore {
  save(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeEvidence>;
  findByEvidenceId(evidenceId: string): Promise<SimulationRuntimeEvidence | null>;
  list(): Promise<SimulationRuntimeEvidence[]>;
}

export interface SimulationRuntimeEvidenceRequest {
  productCode: string;
  subproductCode: string;
  legacyStatus: string | null;
  canonicalStatus: string;
  comparisonStatus: SimulationRuntimeEquivalenceStatus;
  divergenceCategory: SimulationRuntimeDivergenceCategory;
  divergenceCount: number;
  financialCriticalCount: number;
  financialMinorCount: number;
  structuralCount: number;
  missingCanonicalFieldCount: number;
  missingLegacyFieldCount: number;
  mappingFailure: boolean;
  runtimeFailure: boolean;
  unsupportedScenario: boolean;
  legacyDurationMs?: number | null;
  runtimeDurationMs?: number | null;
  fallbackUsed: boolean;
  shadowMode: boolean;
  comparatorVersion: string;
  contractVersion: string;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
}
