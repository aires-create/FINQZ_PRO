import type { SimulationProductContext } from './simulation-product.context.js';

export interface SimulationProductPolicy {
  readonly name: string;
  evaluateCommercial(context: SimulationProductContext): boolean;
  evaluateProvider(context: SimulationProductContext): boolean;
  evaluateEligibility(context: SimulationProductContext): boolean;
  evaluateRanking(context: SimulationProductContext): boolean;
}

export const createSimulationProductPolicy = (
  name: string,
  evaluator: (context: SimulationProductContext) => boolean,
): SimulationProductPolicy => ({
  name,
  evaluateCommercial: evaluator,
  evaluateProvider: evaluator,
  evaluateEligibility: evaluator,
  evaluateRanking: evaluator,
});
