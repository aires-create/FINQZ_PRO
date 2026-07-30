import type { SimulationRuntimeWorkspaceInput } from "../contracts/simulation-runtime.contract";
import type { SimulationRuntimeEvidenceCollectorContext, SimulationRuntimeEvidenceSink } from "./simulation-runtime.evidence.contract";
import type { SimulationRuntimeEvidence, SimulationRuntimeEquivalenceStatus } from "./simulation-runtime.evidence.types";
import { SIMULATION_RUNTIME_COMPARATOR_VERSION } from "../comparison/simulation-runtime.comparator";

const normalizeString = (value: unknown): string => {
  return String(value ?? "").trim().toLowerCase();
};

const buildDeterministicHash = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const sanitizeIdentifier = (input?: string | null): string | null => {
  const candidate = normalizeString(input);
  if (!candidate) {
    return null;
  }
  return buildDeterministicHash(candidate);
};

const sanitizeEvidenceWorkspace = (
  workspace: SimulationRuntimeWorkspaceInput,
): { tenantId?: string | null } => ({
  tenantId: workspace.tenantId ?? workspace.opportunity?.tenantId ?? null,
});

export const buildSimulationRuntimeEvidenceId = (
  requestId: string,
  executionId: string,
  correlationId: string,
  comparatorVersion: string,
): string => {
  const normalized = [requestId, executionId, correlationId, comparatorVersion]
    .filter(Boolean)
    .join("|");
  return `sim-runtime-evidence-${buildDeterministicHash(normalized)}`;
};

const resolveEquivalenceStatus = (
  comparisonCategory: SimulationRuntimeEvidence["divergenceCategory"],
): SimulationRuntimeEquivalenceStatus => {
  switch (comparisonCategory) {
    case "NONE":
      return "EQUIVALENT";
    case "INFORMATIONAL":
      return "EQUIVALENT_WITH_INFORMATIONAL_DIFFERENCES";
    case "EXPECTED_COMPATIBILITY":
      return "EXPECTED_COMPATIBILITY_DIFFERENCE";
    case "FINANCIAL_MINOR":
      return "NON_EQUIVALENT_MINOR";
    case "FINANCIAL_CRITICAL":
      return "NON_EQUIVALENT_CRITICAL";
    case "STRUCTURAL":
      return "STRUCTURALLY_INCOMPATIBLE";
    case "MAPPING_FAILURE":
      return "MAPPING_FAILURE";
    case "RUNTIME_FAILURE":
      return "RUNTIME_FAILURE";
    case "UNSUPPORTED_SCENARIO":
      return "UNSUPPORTED_SCENARIO";
    case "MISSING_CANONICAL_FIELD":
    case "MISSING_LEGACY_FIELD":
    default:
      return "INSUFFICIENT_DATA";
  }
};

export const sanitizeSimulationRuntimeEvidence = async (
  context: SimulationRuntimeEvidenceCollectorContext,
): Promise<SimulationRuntimeEvidence> => {
  const {
    workspace,
    legacyResult,
    runtime,
    comparison,
    requestId,
    correlationId,
    executionId,
    legacyDurationMs = null,
    runtimeDurationMs = null,
    fallbackUsed = false,
  } = context;

  const environment = typeof window !== "undefined" && typeof window.location !== "undefined"
    ? window.location.hostname
    : "unknown";

  const tenantIdHash = sanitizeIdentifier(workspace.tenantId ?? workspace.opportunity?.tenantId ?? null);
  const opportunityIdHash = sanitizeIdentifier(workspace.opportunity?.id ?? null);
  const comparatorVersion = SIMULATION_RUNTIME_COMPARATOR_VERSION;
  const evidenceId = buildSimulationRuntimeEvidenceId(requestId, executionId, correlationId, comparatorVersion);
  const comparisonStatus = resolveEquivalenceStatus(comparison.category);

  const evidence: SimulationRuntimeEvidence = {
    evidenceId,
    timestamp: new Date().toISOString(),
    environment,
    tenantIdHash,
    opportunityIdHash,
    requestId,
    correlationId,
    executionId,
    productCode: workspace.selectedProduct?.code ?? runtime.product.code,
    subproductCode: workspace.selectedSubproduct?.code ?? runtime.subproduct.code,
    legacyStatus: legacyResult?.status ?? null,
    canonicalStatus: runtime.status,
    comparisonStatus,
    divergenceCategory: comparison.category,
    divergenceCount: comparison.summary.divergentFields,
    financialCriticalCount: comparison.fields.filter((field) => field.category === "FINANCIAL_CRITICAL").length,
    financialMinorCount: comparison.fields.filter((field) => field.category === "FINANCIAL_MINOR").length,
    structuralCount: comparison.fields.filter((field) => field.category === "STRUCTURAL").length,
    missingCanonicalFieldCount: comparison.fields.filter((field) => field.category === "MISSING_CANONICAL_FIELD").length,
    missingLegacyFieldCount: comparison.fields.filter((field) => field.category === "MISSING_LEGACY_FIELD").length,
    mappingFailure: comparison.fields.some((field) => field.category === "MAPPING_FAILURE"),
    runtimeFailure: comparison.fields.some((field) => field.category === "RUNTIME_FAILURE"),
    unsupportedScenario: comparison.fields.some((field) => field.category === "UNSUPPORTED_SCENARIO"),
    legacyDurationMs,
    runtimeDurationMs,
    fallbackUsed,
    shadowMode: true,
    comparatorVersion,
    contractVersion: runtime.compatibilityMode,
    catalogVersion: runtime.catalogVersion,
    engineVersion: runtime.engineVersion,
    policyVersion: runtime.policyVersion,
    strategyVersion: runtime.strategyVersion,
  };

  return evidence;
};

export const sanitizeEvidenceSink = (
  sink: SimulationRuntimeEvidenceSink,
): SimulationRuntimeEvidenceSink => {
  return async (evidence) => {
    try {
      await sink(evidence);
    } catch {
      // Do not throw; evidence recording must not break workspace flow.
    }
  };
};
