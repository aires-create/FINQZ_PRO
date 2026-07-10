import {
  createSimulationRuntimeEvidenceRecord,
} from '../domain/simulation-runtime-evidence.entity.js';
import type {
  SimulationRuntimeEvidenceRepository,
} from '../domain/simulation-runtime-evidence.repository.js';
import type {
  SimulationRuntimeEvidenceContext,
  SimulationRuntimeEvidenceInput,
  SimulationRuntimeEvidenceRecord,
} from '../domain/simulation-runtime-evidence.types.js';

export interface CollectSimulationRuntimeEvidenceDependencies {
  readonly repository: SimulationRuntimeEvidenceRepository;
}

export class CollectSimulationRuntimeEvidenceUseCase {
  constructor(
    private readonly dependencies:
      CollectSimulationRuntimeEvidenceDependencies,
  ) {}

  async execute(
    input: SimulationRuntimeEvidenceInput,
    context: SimulationRuntimeEvidenceContext,
  ): Promise<SimulationRuntimeEvidenceRecord> {
    const evidence = createSimulationRuntimeEvidenceRecord(
      input,
      context,
    );

    return this.dependencies.repository.save(evidence);
  }
}
