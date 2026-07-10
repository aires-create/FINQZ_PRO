export * from './loan-with-collateral.subflow.types.js';
export * from './loan-with-collateral.subflow.js';
export * from './auto-equity.subflow.js';
export * from './home-equity.subflow.js';

import { createLoanWithCollateralSubflowRegistry } from './loan-with-collateral.subflow.js';
import { autoEquitySubflow } from './auto-equity.subflow.js';
import { homeEquitySubflow } from './home-equity.subflow.js';

export const loanWithCollateralSubflowRegistry = createLoanWithCollateralSubflowRegistry([
  autoEquitySubflow,
  homeEquitySubflow,
]);
