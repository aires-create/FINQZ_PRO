import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
import type { SimulationRuntimeRemoteEvidenceMetricsSnapshot } from "./simulation-runtime-remote-evidence.metrics";
import type {
  SimulationRuntimeRemoteEvidenceClient,
  SimulationRuntimeRemoteEvidenceTelemetry,
} from "./simulation-runtime-remote-evidence.types";
import { SimulationRuntimeRemoteEvidenceQueue } from "./simulation-runtime-remote-evidence.queue";

const buildEvidence = (): SimulationRuntimeEvidence => ({
  evidenceId: "sim-runtime-evidence-00000001",
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
  const metrics: SimulationRuntimeRemoteEvidenceMetricsSnapshot[] = [];
  const telemetry: SimulationRuntimeRemoteEvidenceTelemetry = {
    emitRemoteEvidenceEnqueued: () => events.push("enqueued"),
    emitRemoteEvidenceSuccess: () => events.push("success"),
    emitRemoteEvidenceRetry: () => events.push("retry"),
    emitRemoteEvidenceFailure: () => events.push("failure"),
    emitRemoteEvidenceConflict: () => events.push("conflict"),
    emitRemoteEvidenceMetrics: (payload) => metrics.push(payload.metrics),
    emitRemoteEvidenceDisabled: () => events.push("disabled"),
  };

  return { events, metrics, telemetry };
};

describe("SimulationRuntimeRemoteEvidenceQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { statusCode: 200 },
    { statusCode: 201 },
    { statusCode: 204 },
  ])("treats $statusCode as operational success", async ({ statusCode }) => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn().mockResolvedValueOnce({ statusCode, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, {
      maxRetries: 3,
      baseDelayMs: 1,
    });

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["enqueued", "success"]);
    expect(metrics.at(-1)).toMatchObject({
      enqueuedCount: 1,
      successCount: 1,
      conflictCount: 0,
      retryCount: 0,
      failureCount: 0,
      currentQueueSize: 0,
    });
    expect(metrics.at(-1)?.averageSendTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("retries network errors before succeeding", async () => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({ statusCode: 201, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, {
      maxRetries: 3,
      baseDelayMs: 1,
    });

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(events).toEqual(["enqueued", "retry", "success"]);
    expect(metrics.at(-1)).toMatchObject({
      enqueuedCount: 1,
      successCount: 1,
      conflictCount: 0,
      retryCount: 1,
      failureCount: 0,
      currentQueueSize: 0,
    });
  });

  it("retries timeout aborts before succeeding", async () => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
        .mockResolvedValueOnce({ statusCode: 200, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, {
      maxRetries: 3,
      baseDelayMs: 1,
    });

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(events).toEqual(["enqueued", "retry", "success"]);
    expect(metrics.at(-1)?.retryCount).toBe(1);
    expect(metrics.at(-1)?.successCount).toBe(1);
  });

  it("treats 409 as conflict telemetry and does not retry", async () => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn().mockResolvedValueOnce({ statusCode: 409, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry);

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["enqueued", "conflict"]);
    expect(metrics.at(-1)).toMatchObject({
      enqueuedCount: 1,
      successCount: 0,
      conflictCount: 1,
      retryCount: 0,
      failureCount: 0,
      currentQueueSize: 0,
    });
  });

  it.each([400, 401, 403, 404, 307])("treats %s as terminal failure without retry", async (statusCode) => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn().mockResolvedValueOnce({ statusCode, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry);

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["enqueued", "failure"]);
    expect(metrics.at(-1)).toMatchObject({
      enqueuedCount: 1,
      successCount: 0,
      conflictCount: 0,
      retryCount: 0,
      failureCount: 1,
      currentQueueSize: 0,
    });
  });

  it("fails after exhausting retries on 500 responses", async () => {
    const { events, metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn().mockResolvedValue({ statusCode: 500, requestId: "req-1" }),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, {
      maxRetries: 3,
      baseDelayMs: 1,
    });

    queue.enqueue(buildEvidence());
    await vi.runAllTimersAsync();
    await queue.waitForIdle();

    expect(client.send).toHaveBeenCalledTimes(4);
    expect(events).toEqual(["enqueued", "retry", "retry", "retry", "failure"]);
    expect(metrics.at(-1)).toMatchObject({
      enqueuedCount: 1,
      successCount: 0,
      conflictCount: 0,
      retryCount: 3,
      failureCount: 1,
      currentQueueSize: 0,
    });
  });

  it("returns a zeroed snapshot for an empty queue", () => {
    const { telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn(),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry);

    expect(queue.getMetricsSnapshot()).toEqual({
      enqueuedCount: 0,
      successCount: 0,
      conflictCount: 0,
      retryCount: 0,
      failureCount: 0,
      averageSendTimeMs: 0,
      currentQueueSize: 0,
    });
  });

  it("calculates the average send time from the observed attempts", async () => {
    const { metrics, telemetry } = createTelemetryRecorder();
    const client: SimulationRuntimeRemoteEvidenceClient = {
      send: vi.fn(
        () =>
          new Promise<{ statusCode: number; requestId: string }>((resolve) => {
            setTimeout(() => resolve({ statusCode: 200, requestId: "req-1" }), 25);
          }),
      ),
    };
    const queue = new SimulationRuntimeRemoteEvidenceQueue(client, telemetry);

    queue.enqueue(buildEvidence());
    await vi.advanceTimersByTimeAsync(25);
    await queue.waitForIdle();

    expect(metrics.at(-1)?.averageSendTimeMs).toBeGreaterThanOrEqual(25);
    expect(metrics.at(-1)?.currentQueueSize).toBe(0);
  });
});
