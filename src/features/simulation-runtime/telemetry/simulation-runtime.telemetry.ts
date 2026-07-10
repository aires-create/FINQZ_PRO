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
      type: "shadow_evidence_stored";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
    }
  | {
      type: "shadow_evidence_failed";
      timestamp: string;
      requestId: string;
      correlationId: string;
      reason: string;
    }
  | {
      type: "shadow_remote_evidence_enqueued";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
    }
  | {
      type: "shadow_remote_evidence_success";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
      statusCode: number;
    }
  | {
      type: "shadow_remote_evidence_retry";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
      attempt: number;
      reason: string;
    }
  | {
      type: "shadow_remote_evidence_failure";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
      reason: string;
    }
  | {
      type: "shadow_remote_evidence_conflict";
      timestamp: string;
      requestId: string;
      correlationId: string;
      evidenceId: string;
      statusCode: number;
    }
  | {
      type: "shadow_remote_evidence_disabled";
      timestamp: string;
      requestId?: string | null;
      correlationId?: string | null;
      reason: string;
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

  const emitEvidenceStored = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_evidence_stored" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_evidence_stored",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitEvidenceFailed = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_evidence_failed" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_evidence_failed",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceEnqueued = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_enqueued" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_enqueued",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceSuccess = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_success" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_success",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceRetry = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_retry" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_retry",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceFailure = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_failure" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_failure",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceConflict = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_conflict" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_conflict",
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  const emitRemoteEvidenceDisabled = (payload: Omit<Extract<SimulationRuntimeTelemetryEvent, { type: "shadow_remote_evidence_disabled" }>, "type" | "timestamp">) => {
    sink({
      type: "shadow_remote_evidence_disabled",
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
    emitEvidenceStored,
    emitEvidenceFailed,
    emitRemoteEvidenceEnqueued,
    emitRemoteEvidenceSuccess,
    emitRemoteEvidenceRetry,
    emitRemoteEvidenceFailure,
    emitRemoteEvidenceConflict,
    emitRemoteEvidenceDisabled,
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
