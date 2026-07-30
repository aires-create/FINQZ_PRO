import { createSimulationProductPolicy } from '../base/index.js';

export const loanWithCollateralPolicy = createSimulationProductPolicy(
  'LoanWithCollateralPolicy',
  () => true,
);
