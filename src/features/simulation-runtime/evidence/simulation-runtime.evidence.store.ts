import type { SimulationRuntimeEvidence, SimulationRuntimeEvidenceStore } from "./simulation-runtime.evidence.types";

// Local in-memory evidence store used for runtime assessment and tests.
// This implementation is not an official homologation source and must remain scoped to the frontend phase.
export class InMemorySimulationRuntimeEvidenceStore implements SimulationRuntimeEvidenceStore {
  private readonly store = new Map<string, SimulationRuntimeEvidence>();

  async save(evidence: SimulationRuntimeEvidence): Promise<SimulationRuntimeEvidence> {
    const existing = this.store.get(evidence.evidenceId);
    if (existing) {
      return existing;
    }

    this.store.set(evidence.evidenceId, evidence);
    return evidence;
  }

  async findByEvidenceId(evidenceId: string): Promise<SimulationRuntimeEvidence | null> {
    return this.store.get(evidenceId) ?? null;
  }

  async list(): Promise<SimulationRuntimeEvidence[]> {
    return Array.from(this.store.values());
  }
}

export const createInMemorySimulationRuntimeEvidenceStore = (): SimulationRuntimeEvidenceStore =>
  new InMemorySimulationRuntimeEvidenceStore();

export const defaultSimulationRuntimeEvidenceStore: SimulationRuntimeEvidenceStore =
  createInMemorySimulationRuntimeEvidenceStore();
