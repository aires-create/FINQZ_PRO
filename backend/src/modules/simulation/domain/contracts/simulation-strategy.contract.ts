import type {
  SimulationRequest,
  SimulationResult,
  SimulationType,
} from './simulation.contract.js';

export interface SimulationStrategy {
  readonly simulationType: SimulationType;

  simulate(
    request: SimulationRequest,
  ): Promise<SimulationResult>;
}