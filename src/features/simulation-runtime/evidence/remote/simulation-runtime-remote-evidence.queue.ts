import { isNetworkError } from "../../../../api/http";
import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
import {
  buildSimulationRuntimeRemoteEvidenceMetricsSnapshot,
  createSimulationRuntimeRemoteEvidenceMetricsState,
  type SimulationRuntimeRemoteEvidenceMetricsSnapshot,
} from "./simulation-runtime-remote-evidence.metrics";
import type {
  SimulationRuntimeRemoteEvidenceClient,
  SimulationRuntimeRemoteEvidenceQueueOptions,
  SimulationRuntimeRemoteEvidenceQueue as SimulationRuntimeRemoteEvidenceQueueContract,
  SimulationRuntimeRemoteEvidenceTelemetry,
} from "./simulation-runtime-remote-evidence.types";

type QueueItem = {
  evidence: SimulationRuntimeEvidence;
  attempts: number;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 50;

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const isRetryableError = (error: unknown): boolean =>
  isNetworkError(error) || isAbortError(error);

const isRetryableStatusCode = (statusCode: number): boolean =>
  statusCode >= 500 && statusCode < 600;

const isTerminalFailureStatusCode = (statusCode: number): boolean =>
  (statusCode >= 300 && statusCode < 400) ||
  [400, 401, 403, 404].includes(statusCode);

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class SimulationRuntimeRemoteEvidenceQueue implements SimulationRuntimeRemoteEvidenceQueueContract {
  private readonly items: QueueItem[] = [];

  private processing = false;

  private readonly idleWaiters = new Set<() => void>();

  private readonly metricsState = createSimulationRuntimeRemoteEvidenceMetricsState();

  constructor(
    private readonly client: SimulationRuntimeRemoteEvidenceClient,
    private readonly telemetry?: SimulationRuntimeRemoteEvidenceTelemetry,
    private readonly options: Pick<SimulationRuntimeRemoteEvidenceQueueOptions, "maxRetries" | "baseDelayMs"> = {},
  ) {}

  enqueue(evidence: SimulationRuntimeEvidence): void {
    this.items.push({
      evidence,
      attempts: 0,
    });

    this.metricsState.enqueuedCount += 1;
    this.metricsState.currentQueueSize = this.items.length;

    this.telemetry?.emitRemoteEvidenceEnqueued({
      requestId: evidence.requestId,
      correlationId: evidence.correlationId,
      evidenceId: evidence.evidenceId,
    });

    this.emitMetricsSnapshot({
      requestId: evidence.requestId,
      correlationId: evidence.correlationId,
      evidenceId: evidence.evidenceId,
    });

    void this.process().catch(() => undefined);
  }

  async waitForIdle(): Promise<void> {
    if (!this.processing && this.items.length === 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.idleWaiters.add(resolve);
    });
  }

  private get maxRetries(): number {
    return this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  private get baseDelayMs(): number {
    return this.options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  }

  getMetricsSnapshot(): SimulationRuntimeRemoteEvidenceMetricsSnapshot {
    this.metricsState.currentQueueSize = this.items.length;
    return buildSimulationRuntimeRemoteEvidenceMetricsSnapshot(this.metricsState);
  }

  private resolveIdleWaiters(): void {
    if (this.processing || this.items.length > 0) {
      return;
    }

    const waiters = Array.from(this.idleWaiters);
    this.idleWaiters.clear();
    waiters.forEach((resolve) => resolve());
  }

  private async process(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.items.length > 0) {
        const item = this.items.shift();
        if (!item) {
          continue;
        }

        await this.processItem(item);
      }
    } finally {
      this.processing = false;
      this.resolveIdleWaiters();
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    const { evidence } = item;

    while (item.attempts <= this.maxRetries) {
      const startedAt = Date.now();

      try {
        const result = await this.client.send(evidence);
        this.recordSendDuration(startedAt);

        if (result.statusCode === 409) {
          this.metricsState.conflictCount += 1;
          this.telemetry?.emitRemoteEvidenceConflict({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            statusCode: result.statusCode,
          });
          this.emitMetricsSnapshot({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
          });
          return;
        }

        if (result.statusCode >= 200 && result.statusCode < 300) {
          this.metricsState.successCount += 1;
          this.telemetry?.emitRemoteEvidenceSuccess({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            statusCode: result.statusCode,
          });
          this.emitMetricsSnapshot({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
          });
          return;
        }

        if (isTerminalFailureStatusCode(result.statusCode) || item.attempts === this.maxRetries) {
          this.metricsState.failureCount += 1;
          this.telemetry?.emitRemoteEvidenceFailure({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            reason: `http_${result.statusCode}`,
          });
          this.emitMetricsSnapshot({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
          });
          return;
        }

        item.attempts += 1;
        this.metricsState.retryCount += 1;
        this.telemetry?.emitRemoteEvidenceRetry({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
          attempt: item.attempts,
          reason: `http_${result.statusCode}`,
        });
        this.emitMetricsSnapshot({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
        });
        await delay(this.baseDelayMs * 2 ** (item.attempts - 1));
      } catch (error) {
        this.recordSendDuration(startedAt);
        if (!isRetryableError(error) || item.attempts === this.maxRetries) {
          this.metricsState.failureCount += 1;
          this.telemetry?.emitRemoteEvidenceFailure({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            reason: error instanceof Error ? error.message : "remote_evidence_failed",
          });
          this.emitMetricsSnapshot({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
          });
          return;
        }

        item.attempts += 1;
        this.metricsState.retryCount += 1;
        this.telemetry?.emitRemoteEvidenceRetry({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
          attempt: item.attempts,
          reason: error instanceof Error ? error.message : "remote_evidence_retry",
        });
        this.emitMetricsSnapshot({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
        });
        await delay(this.baseDelayMs * 2 ** (item.attempts - 1));
      }
    }
  }

  private recordSendDuration(startedAtMs: number): void {
    this.metricsState.sendCount += 1;
    this.metricsState.totalSendTimeMs += Math.max(0, Date.now() - startedAtMs);
  }

  private emitMetricsSnapshot(payload: {
    requestId?: string | null;
    correlationId?: string | null;
    evidenceId?: string | null;
  }): void {
    this.metricsState.currentQueueSize = this.items.length;

    this.telemetry?.emitRemoteEvidenceMetrics({
      requestId: payload.requestId ?? null,
      correlationId: payload.correlationId ?? null,
      evidenceId: payload.evidenceId ?? null,
      metrics: this.getMetricsSnapshot(),
    });
  }
}

export const createSimulationRuntimeRemoteEvidenceQueue = (
  client: SimulationRuntimeRemoteEvidenceClient,
  telemetry?: SimulationRuntimeRemoteEvidenceTelemetry,
  options: Pick<SimulationRuntimeRemoteEvidenceQueueOptions, "maxRetries" | "baseDelayMs"> = {},
): SimulationRuntimeRemoteEvidenceQueue => new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, options);
