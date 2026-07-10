import type { SimulationRuntimeComparison } from "../comparison/simulation-runtime.comparison.types";
import type { SimulationRuntimeNormalizedResponse } from "../mappers/simulation-runtime-response.mapper";
import type { SimulationRuntimeWorkspaceInput } from "../contracts/simulation-runtime.contract";

export type SimulationRuntimeTelemetrySink = (event: SimulationRuntimeTelemetryEvent) => void;

export interface SimulationRuntimeTelemetryContext {
  productCode?: string;
  subproductCode?: string;
  requestedAmount?: number;
  term?: number;
  monthlyRate?: number;
  tenantId?: string | null;
}

export type SimulationRuntimeTelemetryEvent =
  | {
      type: "shadow_started";
      timestamp: string;
      requestId: string;
      correlationId: string;
      productCode?: string;
      subproductCode?: string;
      requestedAmount?: number;
      term?: number;
      monthlyRate?: number;
      tenantId?: string | null;
    }
  | {
      type: "shadow_completed";
      timestamp: string;
      requestId: string;
      correlationId: string;
      category: SimulationRuntimeComparison["category"];
      totalFields: number;
      divergentFields: number;
      criticalFields: number;
      runtimeStatus: string;
      warningsCount: number;
      proposalsCount: number;
    }
  | {
      type: "shadow_failed";
      timestamp: string;
      requestId: string;
      correlationId: string;
      reason: string;
    }
  | {
      type: "shadow_skipped";
      timestamp: string;
      requestId?: string | null;
      correlationId?: string | null;
      reason: string;
    };

export const sanitizeTelemetryWorkspace = (
  workspace: SimulationRuntimeWorkspaceInput,
): SimulationRuntimeTelemetryContext => ({
  productCode: workspace.acceptedSnapshot?.product?.code ?? workspace.simulationSnapshot?.product?.code ?? workspace.proposalSnapshot?.product?.code ?? workspace.selectedProduct?.code,
  subproductCode: workspace.acceptedSnapshot?.subproduct?.code ?? workspace.simulationSnapshot?.subproduct?.code ?? workspace.proposalSnapshot?.subproduct?.code ?? workspace.selectedSubproduct?.code,
  requestedAmount: Number(workspace.simulationFields?.valorVeiculo ?? 0) > 0 && Number(workspace.simulationFields?.percentualFinanciavel ?? 0) > 0
    ? Number(workspace.simulationFields?.valorVeiculo ?? 0) * (Number(workspace.simulationFields?.percentualFinanciavel ?? 0) / 100)
    : undefined,
  term: workspace.simulationFields?.prazo,
  monthlyRate: workspace.simulationFields?.taxaMes,
  tenantId: workspace.tenantId ?? workspace.opportunity?.tenantId ?? null,
});

export const createSimulationRuntimeTelemetry = (sink: SimulationRuntimeTelemetrySink = () => undefined) => {
  const emitStarted = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_started" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_started",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitCompleted = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_completed" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_completed",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitFailed = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_failed" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_failed",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitSkipped = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_skipped" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_skipped",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  return {
    emitStarted,
    emitCompleted,
    emitFailed,
    emitSkipped,
  };
};

export const buildShadowCompletionTelemetry = (
  requestId: string,
  correlationId: string,
  comparison: SimulationRuntimeComparison,
  runtime: SimulationRuntimeNormalizedResponse,
): Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_completed" }>, "type" | "timestamp"> => ({
  requestId,
  correlationId,
  category: comparison.category,
  totalFields: comparison.summary.totalFields,
  divergentFields: comparison.summary.divergentFields,
  criticalFields: comparison.summary.criticalFields,
  runtimeStatus: runtime.status,
  warningsCount: runtime.warnings.length,
  proposalsCount: runtime.proposals.length,
});
