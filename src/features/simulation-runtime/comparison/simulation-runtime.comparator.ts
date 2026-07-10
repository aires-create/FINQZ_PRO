import type {
  SimulationRuntimeLegacyResult,
  SimulationRuntimeResponseData,
} from "../contracts/simulation-runtime.contract";
import type {
  SimulationRuntimeComparison,
  SimulationRuntimeComparisonContext,
  SimulationRuntimeDivergenceCategory,
  SimulationRuntimeFieldComparison,
} from "./simulation-runtime.comparison.types";
import { getSimulationRuntimeMetric } from "../mappers/simulation-runtime-response.mapper";
import type { SimulationRuntimeNormalizedResponse } from "../mappers/simulation-runtime-response.mapper";

const FINANCIAL_FIELDS = new Set([
  "requestedAmount",
  "approvedAmount",
  "releasedAmount",
  "installmentAmount",
  "term",
  "monthlyRate",
  "ltv",
  "rentCompromise",
  "cetRate",
]);

const normalizeText = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numeric = Number(String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
};

const getFinancialCategory = (delta: number): SimulationRuntimeDivergenceCategory => {
  if (delta <= 0.01) {
    return "NONE";
  }

  if (delta <= 1) {
    return "FINANCIAL_MINOR";
  }

  return "FINANCIAL_CRITICAL";
};

const compareText = (
  field: string,
  legacyValue: unknown,
  runtimeValue: unknown,
): SimulationRuntimeFieldComparison => {
  const normalizedLegacy = normalizeText(legacyValue);
  const normalizedRuntime = normalizeText(runtimeValue);
  const equal = normalizedLegacy === normalizedRuntime;

  return {
    field,
    category: equal ? "NONE" : "STRUCTURAL",
    legacyValue,
    runtimeValue,
    equal,
  };
};

const compareNumber = (
  field: string,
  legacyValue: unknown,
  runtimeValue: unknown,
): SimulationRuntimeFieldComparison => {
  const legacy = toNumber(legacyValue);
  const runtime = toNumber(runtimeValue);

  if (legacy === null || runtime === null) {
    return {
      field,
      category: legacy === null && runtime === null
        ? "NONE"
        : legacy === null
          ? "MISSING_LEGACY_FIELD"
          : "MISSING_CANONICAL_FIELD",
      legacyValue,
      runtimeValue,
      equal: legacy === runtime,
    };
  }

  const delta = Math.abs(legacy - runtime);
  const category = FINANCIAL_FIELDS.has(field)
    ? getFinancialCategory(delta)
    : delta === 0
      ? "NONE"
      : "INFORMATIONAL";

  return {
    field,
    category,
    legacyValue,
    runtimeValue,
    equal: delta <= 0.01,
    delta,
  };
};

const compareCount = (
  field: string,
  legacyValue: unknown,
  runtimeValue: unknown,
): SimulationRuntimeFieldComparison => {
  const legacy = Array.isArray(legacyValue)
    ? legacyValue.length
    : toNumber(legacyValue);
  const runtime = Array.isArray(runtimeValue)
    ? runtimeValue.length
    : toNumber(runtimeValue);

  if (legacy === null || runtime === null) {
    return {
      field,
      category: legacy === null && runtime === null ? "NONE" : "MISSING_CANONICAL_FIELD",
      legacyValue,
      runtimeValue,
      equal: false,
    };
  }

  const equal = legacy === runtime;

  return {
    field,
    category: equal ? "NONE" : "INFORMATIONAL",
    legacyValue,
    runtimeValue,
    equal,
    delta: Math.abs(legacy - runtime),
  };
};

const pickRuntimeMetric = (runtime: SimulationRuntimeNormalizedResponse, keys: string[]): unknown => {
  return getSimulationRuntimeMetric(runtime, keys);
};

const buildFieldComparisons = (
  legacyResult: SimulationRuntimeLegacyResult | null | undefined,
  runtime: SimulationRuntimeNormalizedResponse,
  context: SimulationRuntimeComparisonContext,
): SimulationRuntimeFieldComparison[] => {
  const legacy = legacyResult ?? {};

  return [
    compareText("product", context.productName, runtime.product.name),
    compareText("subproduct", context.subproductName, runtime.subproduct.name),
    compareNumber("requestedAmount", context.requestedAmount ?? legacy?.valorBruto, pickRuntimeMetric(runtime, ["requestedAmount", "requested_amount", "valorSolicitado", "approvedAmount"])),
    compareNumber("releasedAmount", context.releasedAmount ?? legacy?.valorLiberado, pickRuntimeMetric(runtime, ["releasedAmount", "valorLiberado", "netAmount"])),
    compareNumber("installmentAmount", context.installmentAmount ?? legacy?.parcela, pickRuntimeMetric(runtime, ["installmentAmount", "parcela", "installment"])),
    compareNumber("term", context.term ?? legacy?.prazo, pickRuntimeMetric(runtime, ["term", "prazo"])),
    compareNumber("monthlyRate", context.monthlyRate ?? legacy?.taxaMes, pickRuntimeMetric(runtime, ["monthlyRate", "taxaMes", "rate"])),
    compareNumber("ltv", context.ltv, pickRuntimeMetric(runtime, ["ltv", "percentualFinanciado"])),
    compareNumber("rentCompromise", context.rentCompromise ?? legacy?.comprometimento, pickRuntimeMetric(runtime, ["rentCompromise", "comprometimento", "comprometimentoRenda"])),
    compareNumber("cetRate", legacy?.cetEstimado, pickRuntimeMetric(runtime, ["cetRate", "cetEstimado", "cet"])),
    compareCount("warnings", context.warningsCount ?? 0, runtime.warnings),
    compareCount("rejectionReasons", context.rejectionReasonsCount ?? 0, runtime.rejectionReasons),
    compareCount("proposals", context.proposalsCount ?? 0, runtime.proposals),
  ];
};

const summarizeComparison = (fields: SimulationRuntimeFieldComparison[]) => {
  const divergentFields = fields.filter((field) => field.category !== "NONE").length;
  const criticalFields = fields.filter((field) =>
    field.category === "FINANCIAL_CRITICAL" ||
    field.category === "STRUCTURAL" ||
    field.category === "RUNTIME_FAILURE" ||
    field.category === "MAPPING_FAILURE" ||
    field.category === "UNSUPPORTED_SCENARIO",
  ).length;

  return {
    totalFields: fields.length,
    divergentFields,
    criticalFields,
  };
};

const resolveComparisonCategory = (
  fields: SimulationRuntimeFieldComparison[],
): SimulationRuntimeDivergenceCategory => {
  if (fields.some((field) => field.category === "RUNTIME_FAILURE")) {
    return "RUNTIME_FAILURE";
  }

  if (fields.some((field) => field.category === "MAPPING_FAILURE")) {
    return "MAPPING_FAILURE";
  }

  if (fields.some((field) => field.category === "UNSUPPORTED_SCENARIO")) {
    return "UNSUPPORTED_SCENARIO";
  }

  if (fields.some((field) => field.category === "FINANCIAL_CRITICAL")) {
    return "FINANCIAL_CRITICAL";
  }

  if (fields.some((field) => field.category === "STRUCTURAL")) {
    return "STRUCTURAL";
  }

  if (fields.some((field) => field.category === "FINANCIAL_MINOR")) {
    return "FINANCIAL_MINOR";
  }

  if (fields.some((field) => field.category === "EXPECTED_COMPATIBILITY")) {
    return "EXPECTED_COMPATIBILITY";
  }

  if (fields.some((field) => field.category === "INFORMATIONAL")) {
    return "INFORMATIONAL";
  }

  if (fields.some((field) => field.category === "MISSING_CANONICAL_FIELD")) {
    return "MISSING_CANONICAL_FIELD";
  }

  if (fields.some((field) => field.category === "MISSING_LEGACY_FIELD")) {
    return "MISSING_LEGACY_FIELD";
  }

  return "NONE";
};

export const compareSimulationRuntimeResults = (
  legacyResult: SimulationRuntimeLegacyResult | null | undefined,
  runtime: SimulationRuntimeNormalizedResponse,
  context: SimulationRuntimeComparisonContext = {},
): SimulationRuntimeComparison => {
  const fields = buildFieldComparisons(legacyResult, runtime, context);

  return {
    category: resolveComparisonCategory(fields),
    summary: summarizeComparison(fields),
    fields,
  };
};
