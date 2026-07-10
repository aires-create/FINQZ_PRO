export type SimulationRuntimeEvidenceComparisonStatus =
  | 'EQUIVALENT'
  | 'EQUIVALENT_WITH_INFORMATIONAL_DIFFERENCES'
  | 'EXPECTED_COMPATIBILITY_DIFFERENCE'
  | 'NON_EQUIVALENT_MINOR'
  | 'NON_EQUIVALENT_CRITICAL'
  | 'STRUCTURALLY_INCOMPATIBLE'
  | 'MAPPING_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'UNSUPPORTED_SCENARIO'
  | 'INSUFFICIENT_DATA';

export type SimulationRuntimeEvidenceDivergenceCategory =
  | 'NONE'
  | 'INFORMATIONAL'
  | 'EXPECTED_COMPATIBILITY'
  | 'FINANCIAL_MINOR'
  | 'FINANCIAL_CRITICAL'
  | 'STRUCTURAL'
  | 'MISSING_CANONICAL_FIELD'
  | 'MISSING_LEGACY_FIELD'
  | 'MAPPING_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'UNSUPPORTED_SCENARIO';

export interface SimulationRuntimeEvidenceInput {
  readonly evidenceId: string;
  readonly campaignId: string;
  readonly timestamp: string;
  readonly environment: string;
  readonly tenantIdHash: string | null;
  readonly opportunityIdHash: string | null;
  readonly requestId: string;
  readonly correlationId: string;
  readonly executionId: string;
  readonly productCode: string;
  readonly subproductCode: string;
  readonly legacyStatus: string | null;
  readonly canonicalStatus: string;
  readonly comparisonStatus: SimulationRuntimeEvidenceComparisonStatus;
  readonly divergenceCategory: SimulationRuntimeEvidenceDivergenceCategory;
  readonly divergenceCount: number;
  readonly financialCriticalCount: number;
  readonly financialMinorCount: number;
  readonly structuralCount: number;
  readonly missingCanonicalFieldCount: number;
  readonly missingLegacyFieldCount: number;
  readonly mappingFailure: boolean;
  readonly runtimeFailure: boolean;
  readonly unsupportedScenario: boolean;
  readonly legacyDurationMs: number | null;
  readonly runtimeDurationMs: number | null;
  readonly fallbackUsed: boolean;
  readonly shadowMode: boolean;
  readonly comparatorVersion: string;
  readonly contractVersion: string;
  readonly catalogVersion: string;
  readonly engineVersion: string;
  readonly policyVersion: string;
  readonly strategyVersion: string;
}

export interface SimulationRuntimeEvidenceContext {
  readonly tenantId: string;
  readonly receivedAt: Date;
  readonly receivedByUserId: string | null;
}

export interface SimulationRuntimeEvidenceRecord
  extends SimulationRuntimeEvidenceInput,
    SimulationRuntimeEvidenceContext {}
