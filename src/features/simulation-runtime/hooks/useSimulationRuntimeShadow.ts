import { useCallback, useMemo, useRef, useState } from "react";
import useAppStore from "../../../store";
import { compareSimulationRuntimeResults } from "../comparison/simulation-runtime.comparator";
import type { SimulationRuntimeComparison } from "../comparison/simulation-runtime.comparison.types";
import {
  buildWorkspaceSimulationRuntimeLegacyResult,
  buildWorkspaceSimulationRuntimeRequestOrThrow,
} from "../mappers/workspace-to-simulation-runtime.mapper";
import { executeSimulationRuntimeShadow } from "../api/simulation-runtime.api";
import { getSimulationRuntimeFlags } from "../config/simulation-runtime.flags";
import {
  buildShadowCompletionTelemetry,
  createSimulationRuntimeTelemetry,
  sanitizeTelemetryWorkspace,
  type SimulationRuntimeTelemetrySink,
} from "../telemetry/simulation-runtime.telemetry";
import type {
  SimulationRuntimeLegacyResult,
  SimulationRuntimeWorkspaceInput,
} from "../contracts/simulation-runtime.contract";
import type { SimulationRuntimeNormalizedResponse } from "../mappers/simulation-runtime-response.mapper";
import { mapSimulationRuntimeResponse } from "../mappers/simulation-runtime-response.mapper";
import {
  collectSimulationRuntimeEvidence,
  type SimulationRuntimeEvidenceStore,
} from "../evidence";
import {
  createSimulationRuntimeRemoteEvidenceClient,
  createSimulationRuntimeRemoteEvidenceQueue,
  createSimulationRuntimeRemoteEvidenceStore,
} from "../evidence/remote";

export interface UseSimulationRuntimeShadowOptions {
  telemetrySink?: SimulationRuntimeTelemetrySink;
  evidenceStore?: SimulationRuntimeEvidenceStore;
}

export interface UseSimulationRuntimeShadowResult {
  flags: ReturnType<typeof getSimulationRuntimeFlags>;
  lastComparison: SimulationRuntimeComparison | null;
  lastResponse: SimulationRuntimeNormalizedResponse | null;
  lastError: string | null;
  status: "idle" | "disabled" | "skipped" | "loading" | "success" | "error";
  runShadowExecution: (legacyResult?: SimulationRuntimeLegacyResult | null) => Promise<SimulationRuntimeComparison | null>;
}

const buildShadowExecutionIds = (): { requestId: string; correlationId: string } => {
  const requestId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `shadow-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    requestId,
    correlationId: requestId,
  };
};

export const useSimulationRuntimeShadow = (
  workspace: SimulationRuntimeWorkspaceInput,
  options: UseSimulationRuntimeShadowOptions = {},
): UseSimulationRuntimeShadowResult => {
  const flags = useMemo(() => getSimulationRuntimeFlags(), []);
  const currentUser = useAppStore((state) => state.user);
  const telemetry = useMemo(
    () => createSimulationRuntimeTelemetry(options.telemetrySink),
    [options.telemetrySink],
  );
  const [lastComparison, setLastComparison] = useState<SimulationRuntimeComparison | null>(null);
  const [lastResponse, setLastResponse] = useState<SimulationRuntimeNormalizedResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [status, setStatus] = useState<UseSimulationRuntimeShadowResult["status"]>(
    flags.shadowEnabled ? "idle" : "disabled",
  );
  const inFlightRef = useRef<Promise<SimulationRuntimeComparison | null> | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);

  const stableWorkspace = useMemo<SimulationRuntimeWorkspaceInput>(() => ({
    ...workspace,
    tenantId: workspace.tenantId ?? currentUser?.tenant_id ?? null,
    currentUserId: workspace.currentUserId ?? currentUser?.id ?? null,
    currentUserName: workspace.currentUserName ?? currentUser?.nome ?? null,
  }), [workspace, currentUser]);

  const evidenceStore = useMemo<SimulationRuntimeEvidenceStore>(() => {
    if (options.evidenceStore) {
      return options.evidenceStore;
    }

    const client = createSimulationRuntimeRemoteEvidenceClient();
    const queue = createSimulationRuntimeRemoteEvidenceQueue(client, telemetry, {
      maxRetries: 3,
      baseDelayMs: 50,
    });

    return createSimulationRuntimeRemoteEvidenceStore({
      enabled: flags.remoteEvidenceEnabled,
      queue,
      telemetry,
    });
  }, [flags.remoteEvidenceEnabled, options.evidenceStore, telemetry]);

  const runShadowExecution = useCallback(async (legacyResult?: SimulationRuntimeLegacyResult | null) => {
    if (!flags.shadowEnabled) {
      setStatus("disabled");
      telemetry.emitSkipped({
        requestId: stableWorkspace.requestId ?? null,
        correlationId: stableWorkspace.correlationId ?? null,
        reason: "shadow-disabled",
      });
      return null;
    }

    const shadowLegacyResult = buildWorkspaceSimulationRuntimeLegacyResult(legacyResult);
    if (!shadowLegacyResult || shadowLegacyResult.status === "incompleto" || shadowLegacyResult.status === "inviavel") {
      setStatus("skipped");
      telemetry.emitSkipped({
        requestId: stableWorkspace.requestId ?? null,
        correlationId: stableWorkspace.correlationId ?? null,
        reason: "legacy-result-not-executable",
      });
      return null;
    }

    const executionIds = buildShadowExecutionIds();
    const requestWorkspace: SimulationRuntimeWorkspaceInput = {
      ...stableWorkspace,
      requestId: stableWorkspace.requestId ?? executionIds.requestId,
      correlationId: stableWorkspace.correlationId ?? executionIds.correlationId,
    };
    const workspaceRequest = buildWorkspaceSimulationRuntimeRequestOrThrow(requestWorkspace);
    const requestId = workspaceRequest.execution?.requestId ?? executionIds.requestId;
    const correlationId = workspaceRequest.execution?.correlationId ?? requestId;
    const executionKey = JSON.stringify({
      opportunityId: stableWorkspace.opportunity?.id ?? null,
      simulationType: stableWorkspace.simulationType ?? null,
      product: workspaceRequest.product.code,
      subproduct: workspaceRequest.subproduct.code,
      requestedAmount: workspaceRequest.parameters.requestedAmount ?? 0,
      term: workspaceRequest.parameters.term ?? 0,
      monthlyRate: workspaceRequest.parameters.monthlyRate ?? 0,
      ltv: workspaceRequest.parameters.ltv ?? 0,
      rentCompromise: workspaceRequest.parameters.rentCompromise ?? 0,
      valorVeiculo: stableWorkspace.simulationFields?.valorVeiculo ?? 0,
      valorSolicitado: workspaceRequest.parameters.requestedAmount ?? 0,
      legacyStatus: shadowLegacyResult?.status ?? null,
      legacyParcela: shadowLegacyResult?.parcela ?? 0,
      legacyLiberado: shadowLegacyResult?.valorLiberado ?? 0,
    });

    if (inFlightRef.current && inFlightKeyRef.current === executionKey) {
      return inFlightRef.current;
    }

    const telemetryWorkspace = sanitizeTelemetryWorkspace(stableWorkspace);
    telemetry.emitStarted({
      requestId,
      correlationId,
      ...telemetryWorkspace,
    });

    setStatus("loading");
    setLastError(null);

    let taskPromise: Promise<SimulationRuntimeComparison | null>;
    taskPromise = (async () => {
      try {
        const response = await executeSimulationRuntimeShadow(workspaceRequest, { requestId });
        const normalized = mapSimulationRuntimeResponse(response);
        const comparison = compareSimulationRuntimeResults(shadowLegacyResult, normalized, {
          productName: workspaceRequest.product.name,
          subproductName: workspaceRequest.subproduct.name,
          requestedAmount: workspaceRequest.parameters.requestedAmount,
          releasedAmount: shadowLegacyResult?.valorLiberado,
          installmentAmount: shadowLegacyResult?.parcela,
          term: workspaceRequest.parameters.term,
          monthlyRate: workspaceRequest.parameters.monthlyRate,
          ltv: workspaceRequest.parameters.ltv,
          rentCompromise: shadowLegacyResult?.comprometimento,
          cetRate: shadowLegacyResult?.cetEstimado,
          warningsCount: workspaceRequest.parameters.fees ? 1 : 0,
          rejectionReasonsCount: 0,
          proposalsCount: 0,
        });

        setLastResponse(normalized);
        setLastComparison(comparison);
        setStatus("success");

        telemetry.emitCompleted(
          buildShadowCompletionTelemetry(requestId, correlationId, comparison, normalized),
        );

        if (flags.evidenceEnabled) {
          try {
            const evidence = await collectSimulationRuntimeEvidence({
              workspace: stableWorkspace,
              legacyResult: shadowLegacyResult,
              runtime: normalized,
              comparison,
              requestId,
              correlationId,
              executionId: workspaceRequest.execution?.executionId ?? requestId,
              legacyDurationMs: null,
              runtimeDurationMs: null,
              fallbackUsed: false,
            });

            void evidenceStore.save(evidence).catch(() => undefined);
            telemetry.emitEvidenceStored({
              requestId,
              correlationId,
              evidenceId: evidence.evidenceId,
            });
          } catch (evidenceError) {
            const reason = evidenceError instanceof Error ? evidenceError.message : "evidence-storage-failed";
            telemetry.emitEvidenceFailed({
              requestId,
              correlationId,
              reason,
            });
          }
        }

        return comparison;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Shadow runtime execution failed";
        setLastError(message);
        setStatus("error");
        telemetry.emitFailed({
          requestId,
          correlationId,
          reason: message,
        });
        return null;
      } finally {
        if (inFlightRef.current === taskPromise) {
          inFlightRef.current = null;
          inFlightKeyRef.current = null;
        }
      }
    })();

    inFlightRef.current = taskPromise;
    inFlightKeyRef.current = executionKey;
    return taskPromise;
  }, [flags.shadowEnabled, flags.evidenceEnabled, stableWorkspace, telemetry, evidenceStore]);

  return {
    flags,
    lastComparison,
    lastResponse,
    lastError,
    status,
    runShadowExecution,
  };
};
