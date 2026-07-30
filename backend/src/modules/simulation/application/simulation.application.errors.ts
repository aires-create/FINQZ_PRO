export class SimulationApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimulationApplicationError';
  }
}

export class UnsupportedProductError extends SimulationApplicationError {
  readonly productId?: string;
  readonly productCode?: string;

  constructor(productId?: string, productCode?: string) {
    super(`Unsupported simulation product: ${productCode ?? productId ?? 'unknown'}`);
    this.name = 'UnsupportedProductError';
    if (productId) {
      this.productId = productId;
    }
    if (productCode) {
      this.productCode = productCode;
    }
  }
}

export class UnsupportedSubproductError extends SimulationApplicationError {
  readonly subproductId?: string;
  readonly subproductCode?: string;

  constructor(subproductId?: string, subproductCode?: string) {
    super(`Unsupported simulation subproduct: ${subproductCode ?? subproductId ?? 'unknown'}`);
    this.name = 'UnsupportedSubproductError';
    if (subproductId) {
      this.subproductId = subproductId;
    }
    if (subproductCode) {
      this.subproductCode = subproductCode;
    }
  }
}

export class InvalidCollateralError extends SimulationApplicationError {
  readonly collateralKind?: string;

  constructor(collateralKind?: string) {
    super(`Invalid collateral for simulation: ${collateralKind ?? 'unknown'}`);
    this.name = 'InvalidCollateralError';
    if (collateralKind) {
      this.collateralKind = collateralKind;
    }
  }
}

export class InvalidSimulationRequestError extends SimulationApplicationError {
  constructor(message = 'Invalid simulation request') {
    super(message);
    this.name = 'InvalidSimulationRequestError';
  }
}

export class LegacyExecutionError extends SimulationApplicationError {
  constructor(message = 'Legacy simulation execution failed') {
    super(message);
    this.name = 'LegacyExecutionError';
  }
}
