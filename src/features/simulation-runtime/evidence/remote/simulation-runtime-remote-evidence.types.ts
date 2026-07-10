import type { SimulationRuntimeEvidence } from "../simulation-runtime.evidence.types";

export interface SimulationRuntimeRemoteEvidenceClientResult {
  statusCode: number;
  requestId: string;
}

export interface SimulationRuntimeRemoteEvidenceClient {
  send(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeRemoteEvidenceClientResult>;
}

export interface SimulationRuntimeRemoteEvidenceTelemetry {
  emitRemoteEvidenceEnqueued(payload: {
    requestId: string;
    correlationId: string;
    evidenceId: string;
  }): void;
  emitRemoteEvidenceSuccess(payload: {
    requestId: string;
    correlationId: string;
    evidenceId: string;
    statusCode: number;
  }): void;
  emitRemoteEvidenceRetry(payload: {
    requestId: string;
    correlationId: string;
    evidenceId: string;
    attempt: number;
    reason: string;
  }): void;
  emitRemoteEvidenceFailure(payload: {
    requestId: string;
    correlationId: string;
    evidenceId: string;
    reason: string;
  }): void;
  emitRemoteEvidenceConflict(payload: {
    requestId: string;
    correlationId: string;
    evidenceId: string;
    statusCode: number;
  }): void;
  emitRemoteEvidenceDisabled(payload: {
    requestId?: string | null;
    correlationId?: string | null;
    reason: string;
  }): void;
}

export interface SimulationRuntimeRemoteEvidenceQueueOptions {
  client: SimulationRuntimeRemoteEvidenceClient;
  telemetry?: SimulationRuntimeRemoteEvidenceTelemetry;
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface SimulationRuntimeRemoteEvidenceQueue {
  enqueue(evidence: SimulationRuntimeEvidence): void;
  waitForIdle(): Promise<void>;
}

export interface SimulationRuntimeRemoteEvidenceStoreOptions {
  enabled: boolean;
  queue: SimulationRuntimeRemoteEvidenceQueue;
  telemetry?: SimulationRuntimeRemoteEvidenceTelemetry;
}

export interface SimulationRuntimeRemoteEvidenceRecord {
  evidence: SimulationRuntimeEvidence;
  queuedAt: Date;
}
