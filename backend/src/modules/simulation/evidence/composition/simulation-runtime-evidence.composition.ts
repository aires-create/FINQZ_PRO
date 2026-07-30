import { CollectSimulationRuntimeEvidenceUseCase } from '../application/collect-simulation-runtime-evidence.use-case.js';
import {
  SimulationRuntimeEvidencePrismaRepository,
} from '../infrastructure/prisma/simulation-runtime-evidence.prisma.repository.js';
import {
  createSimulationRuntimeEvidenceController,
  type SimulationRuntimeEvidenceController,
} from '../presentation/http/simulation-runtime-evidence.controller.js';
import type { SimulationRuntimeEvidenceRepository } from '../domain/simulation-runtime-evidence.repository.js';

export interface SimulationRuntimeEvidenceComposition {
  repository: SimulationRuntimeEvidenceRepository;
  useCase: CollectSimulationRuntimeEvidenceUseCase;
  controller: SimulationRuntimeEvidenceController;
}

export const createSimulationRuntimeEvidenceComposition = (): SimulationRuntimeEvidenceComposition => {
  const repository = new SimulationRuntimeEvidencePrismaRepository();
  const useCase = new CollectSimulationRuntimeEvidenceUseCase({
    repository,
  });
  const controller = createSimulationRuntimeEvidenceController({
    repository,
    useCase,
  });

  return {
    repository,
    useCase,
    controller,
  };
};

export const simulationRuntimeEvidenceComposition =
  createSimulationRuntimeEvidenceComposition();
