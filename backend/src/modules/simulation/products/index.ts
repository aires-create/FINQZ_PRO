export * from './base/index.js';
export * from './loan-with-collateral/index.js';

import { createSimulationProductRegistry, SimulationProductResolver } from './base/index.js';
import { LoanWithCollateralAdapter } from './loan-with-collateral/index.js';

export const loanWithCollateralAdapter = new LoanWithCollateralAdapter();

export const simulationProductRegistry = createSimulationProductRegistry([
  loanWithCollateralAdapter,
]);

export const simulationProductResolver = new SimulationProductResolver(
  simulationProductRegistry,
);
