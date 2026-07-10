import { describe, expect, it, vi } from "vitest";

import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
import type {
  SimulationRuntimeRemoteEvidenceQueue,
  SimulationRuntimeRemoteEvidenceTelemetry,
} from "./simulation-runtime-remote-evidence.types";
import { SimulationRuntimeRemoteEvidenceStore } from "./simulation-runtime-remote-evidence.store";

const buildEvidence = (evidenceId = "sim-runtime-evidence-00000001"): SimulationRuntimeEvidence => ({
  evidenceId,
  timestamp: "2026-07-10T12:00:00.000Z",
  environment: "homologation",
  tenantIdHash: "tenant-hash",
  opportunityIdHash: "opportunity-hash",
  requestId: "request-1",
  correlationId: "correlation-1",
  executionId: "execution-1",
  productCode: "LOAN_WITH_COLLATERAL",
  subproductCode: "AUTO_EQUITY",
  legacyStatus: "approved",
  canonicalStatus: "approved",
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
  legacyDurationMs: null,
  runtimeDurationMs: 120,
  fallbackUsed: false,
  shadowMode: true,
  comparatorVersion: "1.0.0",
  contractVersion: "1.0.0",
  catalogVersion: "1.0.0",
  engineVersion: "1.0.0",
  policyVersion: "1.0.0",
  strategyVersion: "1.0.0",
});

const createTelemetryRecorder = () => {
  const events: string[] = [];
  const telemetry: SimulationRuntimeRemoteEvidenceTelemetry = {
    emitRemoteEvidenceEnqueued: () => events.push("enqueued"),
    emitRemoteEvidenceSuccess: () => events.push("success"),
    emitRemoteEvidenceRetry: () => events.push("retry"),
    emitRemoteEvidenceFailure: () => events.push("failure"),
    emitRemoteEvidenceConflict: () => events.push("conflict"),
    emitRemoteEvidenceMetrics: () => undefined,
    emitRemoteEvidenceDisabled: () => events.push("disabled"),
  };

  return { events, telemetry };
};

describe("SimulationRuntimeRemoteEvidenceStore", () => {
  it("enqueues evidence when enabled", async () => {
    const { events, telemetry } = createTelemetryRecorder();
    const queue: SimulationRuntimeRemoteEvidenceQueue = {
      enqueue: vi.fn(),
      waitForIdle: vi.fn(async () => undefined),
    } as unknown as SimulationRuntimeRemoteEvidenceQueue;
    const store = new SimulationRuntimeRemoteEvidenceStore({
      enabled: true,
      queue,
      telemetry,
    });
    const evidence = buildEvidence();

    const saved = await store.save(evidence);

    expect(saved).toEqual(evidence);
    expect(queue.enqueue).toHaveBeenCalledTimes(1);
    expect(events).toEqual([]);
    expect(await store.findByEvidenceId(evidence.evidenceId)).toEqual(evidence);
    expect(await store.list()).toHaveLength(1);
  });

  it("does not enqueue when disabled and emits disabled telemetry", async () => {
    const { events, telemetry } = createTelemetryRecorder();
    const queue: SimulationRuntimeRemoteEvidenceQueue = {
      enqueue: vi.fn(),
      waitForIdle: vi.fn(async () => undefined),
    } as unknown as SimulationRuntimeRemoteEvidenceQueue;
    const store = new SimulationRuntimeRemoteEvidenceStore({
      enabled: false,
      queue,
      telemetry,
    });
    const evidence = buildEvidence("sim-runtime-evidence-00000002");

    const saved = await store.save(evidence);

    expect(saved).toEqual(evidence);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(events).toEqual(["disabled"]);
    expect(await store.findByEvidenceId(evidence.evidenceId)).toEqual(evidence);
    expect(await store.list()).toHaveLength(1);
  });

  it("returns the first cached evidence for duplicate ids", async () => {
    const queue: SimulationRuntimeRemoteEvidenceQueue = {
      enqueue: vi.fn(),
      waitForIdle: vi.fn(async () => undefined),
    } as unknown as SimulationRuntimeRemoteEvidenceQueue;
    const store = new SimulationRuntimeRemoteEvidenceStore({
      enabled: true,
      queue,
    });
    const evidence = buildEvidence("sim-runtime-evidence-00000003");

    const first = await store.save(evidence);
    const second = await store.save({ ...evidence, runtimeDurationMs: 999 });

    expect(first).toEqual(evidence);
    expect(second).toEqual(evidence);
    expect(queue.enqueue).toHaveBeenCalledTimes(1);
  });
});
