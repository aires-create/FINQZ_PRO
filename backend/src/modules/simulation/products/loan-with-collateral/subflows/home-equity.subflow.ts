import { createLoanWithCollateralSubflow, createLoanWithCollateralSubflowCapability, buildLoanWithCollateralStructuralValidation } from './loan-with-collateral.subflow.js';
import type { SimulationProductContext } from '../../base/index.js';
import type { LoanWithCollateralSubflow } from './loan-with-collateral.subflow.types.js';
import {
  LOAN_WITH_COLLATERAL_HOME_EQUITY_ID,
  LOAN_WITH_COLLATERAL_PRODUCT_CODE,
  LOAN_WITH_COLLATERAL_PRODUCT_ID,
  LOAN_WITH_COLLATERAL_PRODUCT_NAME,
} from '../loan-with-collateral.metadata.js';

export const homeEquitySubflow: LoanWithCollateralSubflow = createLoanWithCollateralSubflow({
  metadata: {
    kind: 'home-equity',
    productId: LOAN_WITH_COLLATERAL_PRODUCT_ID,
    productCode: LOAN_WITH_COLLATERAL_PRODUCT_CODE,
    productName: LOAN_WITH_COLLATERAL_PRODUCT_NAME,
    productAliases: [
      LOAN_WITH_COLLATERAL_PRODUCT_ID,
      'emprestimo-com-garantia',
      LOAN_WITH_COLLATERAL_PRODUCT_CODE,
      LOAN_WITH_COLLATERAL_PRODUCT_NAME,
    ],
    subproductId: LOAN_WITH_COLLATERAL_HOME_EQUITY_ID,
    subproductCode: 'HOME_EQUITY',
    subproductName: 'Home Equity',
    subproductAliases: ['home-equity', 'HOME_EQUITY', 'Home Equity'],
    collateralKind: 'property',
  },
  capability: createLoanWithCollateralSubflowCapability({
    supportsProperty: true,
    supportsBank: true,
    supportsCorban: true,
    supportsProvider: true,
    supportsCollateral: true,
    supportsProposal: true,
  }),
  validate: (context: SimulationProductContext) => {
    return buildLoanWithCollateralStructuralValidation(context, 'property');
  },
  prepareContext: (context: SimulationProductContext) => ({
    ...context,
    metadata: {
      ...context.metadata,
    },
  }),
});
