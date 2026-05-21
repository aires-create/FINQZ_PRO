import type { SimulationStrategy } from '../domain/contracts/simulation-strategy.contract.js';
import type { SimulationType } from '../domain/contracts/simulation.contract.js';

export class SimulationStrategyResolver {
  private readonly strategiesByType = new Map<SimulationType, SimulationStrategy>();

  constructor(strategies: SimulationStrategy[]) {
    for (const strategy of strategies) {
      this.strategiesByType.set(strategy.simulationType, strategy);
    }
  }

  resolve(simulationType: SimulationType): SimulationStrategy {
    const strategy = this.strategiesByType.get(simulationType);

    if (!strategy) {
      throw new Error(`Simulation strategy not found for type: ${simulationType}`);
    }

    return strategy;
  }
}