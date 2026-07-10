export type SimulationRuntimeDivergenceCategory =
  | "NONE"
  | "INFORMATIONAL"
  | "EXPECTED_COMPATIBILITY"
  | "FINANCIAL_MINOR"
  | "FINANCIAL_CRITICAL"
  | "STRUCTURAL"
  | "MISSING_CANONICAL_FIELD"
  | "MISSING_LEGACY_FIELD"
  | "RUNTIME_FAILURE"
  | "MAPPING_FAILURE"
  | "UNSUPPORTED_SCENARIO";

export interface SimulationRuntimeFieldComparison {
  field: string;
  category: SimulationRuntimeDivergenceCategory;
  legacyValue: unknown;
  runtimeValue: unknown;
  equal: boolean;
  delta?: number;
  note?: string;
}

export interface SimulationRuntimeComparisonSummary {
  totalFields: number;
  divergentFields: number;
  criticalFields: number;
}

export interface SimulationRuntimeComparison {
  category: SimulationRuntimeDivergenceCategory;
  summary: SimulationRuntimeComparisonSummary;
  fields: SimulationRuntimeFieldComparison[];
}

export interface SimulationRuntimeComparisonContext {
  productName?: string;
  subproductName?: string;
  requestedAmount?: number;
  releasedAmount?: number;
  installmentAmount?: number;
  term?: number;
  monthlyRate?: number;
  ltv?: number;
  rentCompromise?: number;
  warningsCount?: number;
  rejectionReasonsCount?: number;
  proposalsCount?: number;
}
