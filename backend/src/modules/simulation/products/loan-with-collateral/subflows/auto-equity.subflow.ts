import { createLoanWithCollateralSubflow, createLoanWithCollateralSubflowCapability, buildLoanWithCollateralStructuralValidation } from './loan-with-collateral.subflow.js';
import type { SimulationProductContext } from '../../base/index.js';
import { createSimulationProductValidationResult } from '../../base/index.js';
import type { LoanWithCollateralSubflow } from './loan-with-collateral.subflow.types.js';
import {
  LOAN_WITH_COLLATERAL_AUTO_EQUITY_ID,
  LOAN_WITH_COLLATERAL_PRODUCT_CODE,
  LOAN_WITH_COLLATERAL_PRODUCT_ID,
  LOAN_WITH_COLLATERAL_PRODUCT_NAME,
} from '../loan-with-collateral.metadata.js';

export const autoEquitySubflow: LoanWithCollateralSubflow = createLoanWithCollateralSubflow({
  metadata: {
    kind: 'auto-equity',
    productId: LOAN_WITH_COLLATERAL_PRODUCT_ID,
    productCode: LOAN_WITH_COLLATERAL_PRODUCT_CODE,
    productName: LOAN_WITH_COLLATERAL_PRODUCT_NAME,
    productAliases: [
      LOAN_WITH_COLLATERAL_PRODUCT_ID,
      'emprestimo-com-garantia',
      LOAN_WITH_COLLATERAL_PRODUCT_CODE,
      LOAN_WITH_COLLATERAL_PRODUCT_NAME,
    ],
    subproductId: LOAN_WITH_COLLATERAL_AUTO_EQUITY_ID,
    subproductCode: 'AUTO_EQUITY',
    subproductName: 'Auto Equity',
    subproductAliases: ['auto-equity', 'AUTO_EQUITY', 'Auto Equity'],
    collateralKind: 'vehicle',
  },
  capability: createLoanWithCollateralSubflowCapability({
    supportsVehicle: true,
    supportsBank: true,
    supportsCorban: true,
    supportsProvider: true,
    supportsCollateral: true,
    supportsProposal: true,
  }),
  validate: (context: SimulationProductContext) => {
    return buildLoanWithCollateralStructuralValidation(context, 'vehicle');
  },
  prepareContext: (context: SimulationProductContext) => {
    if (!context.request.product.name || !context.request.subproduct.name) {
      return {
        ...context,
      };
    }

    return {
      ...context,
      metadata: {
        ...context.metadata,
      },
    };
  },
});

export const createAutoEquityValidationResult = (context: SimulationProductContext) =>
  autoEquitySubflow.validate(context);

export const createAutoEquityValidationOk = () =>
  createSimulationProductValidationResult(true, []);
