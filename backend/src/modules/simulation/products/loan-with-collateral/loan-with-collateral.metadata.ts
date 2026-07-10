import type { SimulationProductMetadata } from '../base/index.js';

export const LOAN_WITH_COLLATERAL_PRODUCT_ID = 'product-emprestimo-com-garantia';
export const LOAN_WITH_COLLATERAL_PRODUCT_CODE = 'EMPRESTIMO_COM_GARANTIA';
export const LOAN_WITH_COLLATERAL_PRODUCT_NAME = 'Empréstimo com Garantia';

export const LOAN_WITH_COLLATERAL_AUTO_EQUITY_ID = 'subproduct-auto-equity';
export const LOAN_WITH_COLLATERAL_HOME_EQUITY_ID = 'subproduct-home-equity';

export const loanWithCollateralMetadata: SimulationProductMetadata = {
  productId: LOAN_WITH_COLLATERAL_PRODUCT_ID,
  productCode: LOAN_WITH_COLLATERAL_PRODUCT_CODE,
  productName: LOAN_WITH_COLLATERAL_PRODUCT_NAME,
  productAliases: [
    LOAN_WITH_COLLATERAL_PRODUCT_ID,
    'emprestimo-com-garantia',
    LOAN_WITH_COLLATERAL_PRODUCT_CODE,
    LOAN_WITH_COLLATERAL_PRODUCT_NAME,
  ],
  subproducts: [
    {
      id: LOAN_WITH_COLLATERAL_HOME_EQUITY_ID,
      code: 'HOME_EQUITY',
      name: 'Home Equity',
      aliases: ['home-equity', 'HOME_EQUITY', 'Home Equity'],
    },
    {
      id: LOAN_WITH_COLLATERAL_AUTO_EQUITY_ID,
      code: 'AUTO_EQUITY',
      name: 'Auto Equity',
      aliases: ['auto-equity', 'AUTO_EQUITY', 'Auto Equity'],
    },
  ],
  version: '1.0.0',
  engineVersion: '3.2.0',
  catalogVersion: '3.1.0',
  capabilities: ['vehicle', 'property', 'provider', 'guarantor'],
  supportedProviders: ['DEFAULT'],
  supportedChannels: ['DIGITAL', 'HYBRID'],
  supportedCollateral: ['VEHICLE', 'REAL_ESTATE'],
  featureFlags: ['loan-with-collateral'],
};

