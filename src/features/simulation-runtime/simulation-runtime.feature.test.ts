import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAppStore from "../../store";
import { buildWorkspaceSimulationRuntimeRequest } from "./mappers/workspace-to-simulation-runtime.mapper";
import { compareSimulationRuntimeResults } from "./comparison/simulation-runtime.comparator";
import { mapSimulationRuntimeResponse } from "./mappers/simulation-runtime-response.mapper";
import { getSimulationRuntimeFlags } from "./config/simulation-runtime.flags";
import { useSimulationRuntimeShadow } from "./hooks/useSimulationRuntimeShadow";
import type { SimulationRuntimeLegacyResult, SimulationRuntimeWorkspaceInput } from "./contracts/simulation-runtime.contract";

const executeSimulationRuntimeShadowMock = vi.hoisted(() => vi.fn());

vi.mock("./api/simulation-runtime.api", () => ({
  executeSimulationRuntimeShadow: executeSimulationRuntimeShadowMock,
}));

vi.mock("./config/simulation-runtime.flags", () => ({
  getSimulationRuntimeFlags: () => ({
    shadowEnabled: true,
    primaryEnabled: false,
    fallbackEnabled: true,
  }),
}));

const baseWorkspace: SimulationRuntimeWorkspaceInput = {
  simulationType: "emprestimo-garantia",
  opportunity: {
    id: "opp-1",
    nome: "Gisele Monteiro",
    cliente_nome: "Gisele Monteiro",
    produto: "Consignado",
    pipelineId: "pipeline-consignado",
    tenantId: "tenant-1",
    email: "gisele@example.com",
    telefone: "(11) 99999-9999",
  },
  simulationFields: {
    valorVeiculo: 125000,
    veiculoQuitado: true,
    saldoDevedor: 0,
    percentualFinanciavel: 80,
    taxaMes: 2.09,
    prazo: 60,
    rendaMensal: 25000,
  },
  tenantId: "tenant-1",
  requestId: "req-1",
  correlationId: "corr-1",
  currentUserId: "user-1",
  currentUserName: "Aires",
  selectedProduct: {
    id: "product-emprestimo-com-garantia",
    code: "EMPRESTIMO_COM_GARANTIA",
    name: "Empréstimo com Garantia",
  },
  selectedSubproduct: {
    id: "subproduct-auto-equity",
    productId: "product-emprestimo-com-garantia",
    code: "AUTO_EQUITY",
    name: "Auto Equity",
  },
};

const buildRuntimeResponse = () => ({
  success: true as const,
  data: {
    requestId: "req-1",
    executionId: "req-1",
    correlationId: "corr-1",
    tenant: { id: "tenant-1" },
    product: {
      id: "product-emprestimo-com-garantia",
      code: "EMPRESTIMO_COM_GARANTIA",
      name: "Empréstimo com Garantia",
    },
    subproduct: {
      id: "subproduct-auto-equity",
      productId: "product-emprestimo-com-garantia",
      code: "AUTO_EQUITY",
      name: "Auto Equity",
    },
    status: "CALCULATED",
    decision: { status: "APPROVED", reasons: [] },
    result: [
      { key: "requestedAmount", label: "Valor solicitado", value: 100000, unit: "BRL" },
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
    compatibilityMode: "CANONICAL" as const,
  },
});

describe("simulation-runtime feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: {
        id: "user-1",
        nome: "Aires",
        email: "aires@example.com",
        perfil: "admin",
        role: "ROLE_ADMIN_SISTEMA",
        scope: "GLOBAL",
        tenant_id: "tenant-1",
      },
    } as never);
  });

  it("builds the canonical Auto Equity runtime request from workspace state", () => {
    const request = buildWorkspaceSimulationRuntimeRequest(baseWorkspace);

    expect(request).not.toBeNull();
    expect(request?.product.code).toBe("EMPRESTIMO_COM_GARANTIA");
    expect(request?.subproduct.code).toBe("AUTO_EQUITY");
    expect(request?.parameters.requestedAmount).toBe(100000);
    expect(request?.parameters.term).toBe(60);
    expect(request?.parameters.monthlyRate).toBe(2.09);
    expect(request?.execution?.requestId).toBe("req-1");
  });

  it("compares legacy and runtime financial outputs without mutating the UI state", () => {
    const response = mapSimulationRuntimeResponse(buildRuntimeResponse());
    const legacyResult: SimulationRuntimeLegacyResult = {
      valorBruto: 100000,
      parcela: 2939.82,
      valorLiberado: 100000,
      custoTotal: 176389.2,
      cetEstimado: 2.79,
      taxaMes: 2.09,
      prazo: 60,
      comprometimento: 11.76,
      status: "valida",
      mensagem: "Simulação válida",
    };

    const comparison = compareSimulationRuntimeResults(legacyResult, response, {
      productName: "Empréstimo com Garantia",
      subproductName: "Auto Equity",
      requestedAmount: 100000,
      releasedAmount: 100000,
      installmentAmount: 2939.82,
      term: 60,
      monthlyRate: 2.09,
      ltv: 80,
      rentCompromise: 11.76,
      warningsCount: 0,
      rejectionReasonsCount: 0,
      proposalsCount: 0,
    });

    expect(comparison.category).toBe("NONE");
    expect(comparison.summary.divergentFields).toBe(0);
    expect(comparison.fields.find((field) => field.field === "installmentAmount")?.equal).toBe(true);
  });

  it("executes the shadow runtime hook and records telemetry without changing the legacy result", async () => {
    executeSimulationRuntimeShadowMock.mockResolvedValueOnce(buildRuntimeResponse());
    const telemetryEvents: unknown[] = [];

    const { result } = renderHook(() =>
      useSimulationRuntimeShadow(baseWorkspace, {
        telemetrySink: (event) => {
          telemetryEvents.push(event);
        },
      }),
    );

    const legacyResult: SimulationRuntimeLegacyResult = {
      valorBruto: 100000,
      parcela: 2939.82,
      valorLiberado: 100000,
      custoTotal: 176389.2,
      cetEstimado: 2.79,
      taxaMes: 2.09,
      prazo: 60,
      comprometimento: 11.76,
      status: "valida",
      mensagem: "Simulação válida",
    };

    const comparison = await result.current.runShadowExecution(legacyResult);

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(comparison?.category).toBe("NONE");
    expect(executeSimulationRuntimeShadowMock).toHaveBeenCalledTimes(1);
    expect(telemetryEvents.some((event) => (event as { type?: string }).type === "shadow_started")).toBe(true);
    expect(telemetryEvents.some((event) => (event as { type?: string }).type === "shadow_completed")).toBe(true);
    expect(result.current.lastComparison?.summary.divergentFields).toBe(0);
  });

  it("keeps the feature flags defaulted for controlled rollout", () => {
    const flags = getSimulationRuntimeFlags();

    expect(flags.shadowEnabled).toBe(true);
    expect(flags.primaryEnabled).toBe(false);
    expect(flags.fallbackEnabled).toBe(true);
  });
});
