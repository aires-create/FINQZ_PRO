import type { SimulationRuntimeEvidence, SimulationRuntimeEvidenceStore } from "../simulation-runtime.evidence.types";
import type {
  SimulationRuntimeRemoteEvidenceQueue,
  SimulationRuntimeRemoteEvidenceTelemetry,
} from "./simulation-runtime-remote-evidence.types";

export interface SimulationRuntimeRemoteEvidenceStoreFactoryOptions {
  enabled?: boolean;
  queue: SimulationRuntimeRemoteEvidenceQueue;
  telemetry?: SimulationRuntimeRemoteEvidenceTelemetry;
}

export class SimulationRuntimeRemoteEvidenceStore implements SimulationRuntimeEvidenceStore {
  private readonly evidenceById = new Map<string, SimulationRuntimeEvidence>();

  constructor(
    private readonly options: SimulationRuntimeRemoteEvidenceStoreFactoryOptions,
  ) {}

  async save(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeEvidence> {
    const existing = this.evidenceById.get(evidence.evidenceId);
    if (existing) {
      return existing;
    }

    this.evidenceById.set(evidence.evidenceId, evidence);

    if (this.options.enabled === false) {
      this.options.telemetry?.emitRemoteEvidenceDisabled({
        requestId: evidence.requestId,
        correlationId: evidence.correlationId,
        reason: "remote-evidence-disabled",
      });
      return evidence;
    }

    this.options.queue.enqueue(evidence);
    return evidence;
  }

  async findByEvidenceId(evidenceId: string): Promise<SimulationRuntimeEvidence | null> {
    return this.evidenceById.get(evidenceId) ?? null;
  }

  async list(): Promise<SimulationRuntimeEvidence[]> {
    return Array.from(this.evidenceById.values());
  }
}

export const createSimulationRuntimeRemoteEvidenceStore = (
  options: SimulationRuntimeRemoteEvidenceStoreFactoryOptions,
): SimulationRuntimeEvidenceStore => new SimulationRuntimeRemoteEvidenceStore(options);
