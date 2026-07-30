import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { SimulationRuntimeLegacyResult, SimulationRuntimeWorkspaceInput } from "../contracts/simulation-runtime.contract";
import { createInMemorySimulationRuntimeEvidenceStore, collectSimulationRuntimeEvidence, sanitizeSimulationRuntimeEvidence, type SimulationRuntimeEvidenceStore } from "./index";
import { useSimulationRuntimeShadow } from "../hooks/useSimulationRuntimeShadow";
import { buildWorkspaceSimulationRuntimeRequest } from "../mappers/workspace-to-simulation-runtime.mapper";
import { mapSimulationRuntimeResponse } from "../mappers/simulation-runtime-response.mapper";
import { compareSimulationRuntimeResults } from "../comparison/simulation-runtime.comparator";
import type { SimulationRuntimeSuccessResponse } from "../contracts/simulation-runtime.contract";
import { getSimulationRuntimeFlags } from "../config/simulation-runtime.flags";

const executeSimulationRuntimeShadowMock = vi.hoisted(() => vi.fn());

vi.mock("../api/simulation-runtime.api", () => ({
  executeSimulationRuntimeShadow: executeSimulationRuntimeShadowMock,
}));

vi.mock("../config/simulation-runtime.flags", () => ({
  getSimulationRuntimeFlags: () => ({
    shadowEnabled: true,
    primaryEnabled: false,
    fallbackEnabled: true,
    evidenceEnabled: true,
    remoteEvidenceEnabled: false,
  }),
}));

const baseWorkspace: SimulationRuntimeWorkspaceInput = {
  simulationType: "emprestimo-garantia",
  opportunity: {
    id: "opp-1",
    nome: "Cliente Teste",
    cliente_nome: "Cliente Teste",
    produto: "Consignado",
    pipelineId: "pipeline-consignado",
    tenantId: "tenant-1",
  },
  simulationFields: {
    valorVeiculo: 100000,
    percentualFinanciavel: 80,
    taxaMes: 2.09,
    prazo: 60,
  },
  tenantId: "tenant-1",
  requestId: "req-1",
  correlationId: "corr-1",
  currentUserId: "user-1",
  currentUserName: "User Teste",
  selectedProduct: {
    id: "product-empresa",
    code: "EMPRESTIMO_COM_GARANTIA",
    name: "Empréstimo com Garantia",
  },
  selectedSubproduct: {
    id: "subproduct-auto-equity",
    productId: "product-empresa",
    code: "AUTO_EQUITY",
    name: "Auto Equity",
  },
};

const buildRuntimeResponse = (): SimulationRuntimeSuccessResponse => ({
  success: true,
  data: {
    requestId: "req-1",
    executionId: "req-1",
    correlationId: "corr-1",
    tenant: { id: "tenant-1" },
    product: {
      id: "product-empresa",
      code: "EMPRESTIMO_COM_GARANTIA",
      name: "Empréstimo com Garantia",
    },
    subproduct: {
      id: "subproduct-auto-equity",
      productId: "product-empresa",
      code: "AUTO_EQUITY",
      name: "Auto Equity",
    },
    status: "CALCULATED",
    decision: { status: "APPROVED", reasons: [] },
    result: [
      { key: "requestedAmount", label: "Valor solicitado", value: 80000, unit: "BRL" },
      { key: "releasedAmount", label: "Valor liberado", value: 100000, unit: "BRL" },
      { key: "installmentAmount", label: "Parcela", value: 2939.82, unit: "BRL" },
      { key: "term", label: "Prazo", value: 60, unit: "MESES" },
      { key: "monthlyRate", label: "Taxa", value: 2.09, unit: "PCT" },
      { key: "ltv", label: "% financiado", value: 80, unit: "PCT" },
      { key: "rentCompromise", label: "% renda", value: 11.76, unit: "PCT" },
      { key: "cetRate", label: "CET", value: 2.79, unit: "PCT" },
    ],
    proposals: [],
    ranking: { candidates: [] },
    warnings: [],
    rejectionReasons: [],
    snapshotReference: { snapshotId: "snap-1", snapshotVersion: "1" },
    auditReference: { auditId: "audit-1" },
    engineVersion: "3.2.0",
    catalogVersion: "3.1.0",
    policyVersion: "1.0.0",
    strategyVersion: "1.0.0",
    executionTimestamp: "2026-07-09T00:00:00.000Z",
    compatibilityMode: "CANONICAL",
  },
});

const legacyResult: SimulationRuntimeLegacyResult = {
  valorBruto: 100000,
  parcela: 2939.82,
  valorLiberado: 100000,
  cetEstimado: 2.79,
  taxaMes: 2.09,
  prazo: 60,
  comprometimento: 11.76,
  status: "valida",
};

describe("simulation runtime evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sanitizes evidence without sensitive payload fields", async () => {
    const runtime = mapSimulationRuntimeResponse(buildRuntimeResponse());
    const comparison = compareSimulationRuntimeResults(legacyResult, runtime, {
      productName: baseWorkspace.selectedProduct?.name,
      subproductName: baseWorkspace.selectedSubproduct?.name,
      requestedAmount: 80000,
      releasedAmount: 100000,
      installmentAmount: 2939.82,
      term: 60,
      monthlyRate: 2.09,
      ltv: 80,
      rentCompromise: 11.76,
      cetRate: 2.79,
      warningsCount: 0,
      rejectionReasonsCount: 0,
      proposalsCount: 0,
    });

    const evidence = await sanitizeSimulationRuntimeEvidence({
      workspace: baseWorkspace,
      legacyResult,
      runtime,
      comparison,
      requestId: "req-1",
      correlationId: "corr-1",
      executionId: "exec-1",
      legacyDurationMs: 100,
      runtimeDurationMs: 200,
      fallbackUsed: false,
    });

    expect(evidence).toMatchObject({
      requestId: "req-1",
      correlationId: "corr-1",
      executionId: "exec-1",
      productCode: "EMPRESTIMO_COM_GARANTIA",
      subproductCode: "AUTO_EQUITY",
      comparisonStatus: "EQUIVALENT",
      divergenceCategory: "NONE",
      financialCriticalCount: 0,
      financialMinorCount: 0,
      structuralCount: 0,
      mappingFailure: false,
      runtimeFailure: false,
      unsupportedScenario: false,
      legacyDurationMs: 100,
      runtimeDurationMs: 200,
      fallbackUsed: false,
      shadowMode: true,
    });

    const sensitiveKeys = [
      "cpf",
      "cnpj",
      "name",
      "email",
      "phone",
      "income",
      "salary",
      "patrimony",
      "bankAccount",
      "document",
      "legacyResult",
      "canonicalResult",
      "requestPayload",
      "responsePayload",
    ];

    for (const key of sensitiveKeys) {
      expect(Object.prototype.hasOwnProperty.call(evidence, key)).toBe(false);
    }
  });

  it("deduplicates evidence in the in-memory store", async () => {
    const store = createInMemorySimulationRuntimeEvidenceStore();
    const evidence = {
      evidenceId: "evidence-1",
      timestamp: new Date().toISOString(),
      environment: "hml",
      tenantIdHash: "tenant-hash",
      opportunityIdHash: "opp-hash",
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
      legacyDurationMs: 10,
      runtimeDurationMs: 20,
      fallbackUsed: false,
      shadowMode: true,
      comparatorVersion: "1.0.0",
      contractVersion: "CANONICAL",
      catalogVersion: "3.1.0",
      engineVersion: "3.2.0",
      policyVersion: "1.0.0",
      strategyVersion: "1.0.0",
    };

    const firstSave = await store.save(evidence);
    const secondSave = await store.save({ ...evidence, legacyDurationMs: 15 });

    expect(firstSave).toEqual(evidence);
    expect(secondSave).toEqual(evidence);
    expect(await store.list()).toHaveLength(1);
  });

  it("records evidence only when evidenceEnabled is true and does not block the user", async () => {
    executeSimulationRuntimeShadowMock.mockResolvedValueOnce(buildRuntimeResponse());
    const savedEvidence: unknown[] = [];
    const telemetryEvents: unknown[] = [];
    const mockStore: SimulationRuntimeEvidenceStore = {
      save: vi.fn(async (evidence) => {
        savedEvidence.push(evidence);
        return evidence;
      }),
      findByEvidenceId: vi.fn(async () => null),
      list: vi.fn(async () => []),
    };

    const { result } = renderHook(() => useSimulationRuntimeShadow(baseWorkspace, {
      evidenceStore: mockStore,
      telemetrySink: (event) => telemetryEvents.push(event),
    }));

    let comparison: ReturnType<typeof result.current.runShadowExecution>;
    await act(async () => {
      comparison = await result.current.runShadowExecution(legacyResult);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(comparison?.category).toBe("NONE");
    expect(mockStore.save).toHaveBeenCalledTimes(1);
    expect(telemetryEvents.some((event: any) => event.type === "shadow_evidence_stored")).toBe(true);
  });

  it("does not block shadow completion when remote evidence save is still pending", async () => {
    vi.useFakeTimers();
    executeSimulationRuntimeShadowMock.mockResolvedValueOnce(buildRuntimeResponse());
    const telemetryEvents: unknown[] = [];
    const mockStore: SimulationRuntimeEvidenceStore = {
      save: vi.fn(() => new Promise<never>(() => undefined)),
      findByEvidenceId: vi.fn(async () => null),
      list: vi.fn(async () => []),
    };

    const { result } = renderHook(() => useSimulationRuntimeShadow(baseWorkspace, {
      evidenceStore: mockStore,
      telemetrySink: (event) => telemetryEvents.push(event),
    }));

    let comparisonPromise: ReturnType<typeof result.current.runShadowExecution>;
    await act(async () => {
      comparisonPromise = result.current.runShadowExecution(legacyResult);
    });

    const racePromise = Promise.race([
      comparisonPromise!.then(() => "completed"),
      new Promise<"blocked">((resolve) => setTimeout(() => resolve("blocked"), 5)),
    ]);

    await vi.advanceTimersByTimeAsync(5);

    await expect(racePromise).resolves.toBe("completed");
    await expect(comparisonPromise!).resolves.toMatchObject({ category: "NONE" });
    expect(result.current.status).toBe("success");
    expect(mockStore.save).toHaveBeenCalledTimes(1);
    expect(telemetryEvents.some((event: any) => event.type === "shadow_evidence_stored")).toBe(true);
  });
});
