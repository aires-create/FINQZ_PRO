import type { SimulationProductContext, SimulationProductValidationResult } from '../base/index.js';
import { createSimulationProductValidationResult } from '../base/index.js';

export class LoanWithCollateralValidator {
  readonly name = 'LoanWithCollateralValidator';

  validate(context: SimulationProductContext): SimulationProductValidationResult {
    const issues: SimulationProductValidationResult['issues'] = [];

    if (!context.request.product.id && !context.request.product.code) {
      issues.push({
        code: 'PRODUCT_MISSING',
        message: 'Product identity is required',
        severity: 'error',
      });
    }

    if (!context.request.subproduct.id && !context.request.subproduct.code) {
      issues.push({
        code: 'SUBPRODUCT_MISSING',
        message: 'Subproduct identity is required',
        severity: 'error',
      });
    }

    return createSimulationProductValidationResult(
      issues.every((issue) => issue.severity !== 'error'),
      issues,
    );
  }
}

