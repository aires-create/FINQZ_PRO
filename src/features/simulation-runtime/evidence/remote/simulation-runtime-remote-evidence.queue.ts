import { isNetworkError } from "../../../../api/http";
import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";
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

    this.telemetry?.emitRemoteEvidenceEnqueued({
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
      try {
        const result = await this.client.send(evidence);

        if (result.statusCode === 409) {
          this.telemetry?.emitRemoteEvidenceConflict({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            statusCode: result.statusCode,
          });
          return;
        }

        if (result.statusCode >= 200 && result.statusCode < 300) {
          this.telemetry?.emitRemoteEvidenceSuccess({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            statusCode: result.statusCode,
          });
          return;
        }

        if (isTerminalFailureStatusCode(result.statusCode) || item.attempts === this.maxRetries) {
          this.telemetry?.emitRemoteEvidenceFailure({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            reason: `http_${result.statusCode}`,
          });
          return;
        }

        item.attempts += 1;
        this.telemetry?.emitRemoteEvidenceRetry({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
          attempt: item.attempts,
          reason: `http_${result.statusCode}`,
        });
        await delay(this.baseDelayMs * 2 ** (item.attempts - 1));
      } catch (error) {
        if (!isRetryableError(error) || item.attempts === this.maxRetries) {
          this.telemetry?.emitRemoteEvidenceFailure({
            requestId: evidence.requestId,
            correlationId: evidence.correlationId,
            evidenceId: evidence.evidenceId,
            reason: error instanceof Error ? error.message : "remote_evidence_failed",
          });
          return;
        }

        item.attempts += 1;
        this.telemetry?.emitRemoteEvidenceRetry({
          requestId: evidence.requestId,
          correlationId: evidence.correlationId,
          evidenceId: evidence.evidenceId,
          attempt: item.attempts,
          reason: error instanceof Error ? error.message : "remote_evidence_retry",
        });
        await delay(this.baseDelayMs * 2 ** (item.attempts - 1));
      }
    }
  }
}

export const createSimulationRuntimeRemoteEvidenceQueue = (
  client: SimulationRuntimeRemoteEvidenceClient,
  telemetry?: SimulationRuntimeRemoteEvidenceTelemetry,
  options: Pick<SimulationRuntimeRemoteEvidenceQueueOptions, "maxRetries" | "baseDelayMs"> = {},
): SimulationRuntimeRemoteEvidenceQueue => new SimulationRuntimeRemoteEvidenceQueue(client, telemetry, options);
