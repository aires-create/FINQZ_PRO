import type { SimulationProductContext } from './simulation-product.context.js';
import type { SimulationProductValidationResult } from './simulation-product.types.js';

export interface SimulationProductValidator {
  readonly name: string;
  validate(context: SimulationProductContext): Promise<SimulationProductValidationResult> | SimulationProductValidationResult;
}

export const createSimulationProductValidationResult = (
  valid: boolean,
  issues: SimulationProductValidationResult['issues'] = [],
): SimulationProductValidationResult => ({
  valid,
  issues,
});
