import type { SimulationProductContext } from '../../base/index.js';
import type { SimulationProductValidationResult } from '../../base/index.js';

export type LoanWithCollateralSubflowKind = 'auto-equity' | 'home-equity';

export type LoanWithCollateralCollateralKind = 'vehicle' | 'property';

export interface LoanWithCollateralSubflowCapability {
  readonly names: readonly string[];
  supportsVehicle(): boolean;
  supportsProperty(): boolean;
  supportsBank(): boolean;
  supportsCorban(): boolean;
  supportsProvider(): boolean;
  supportsCollateral(): boolean;
  supportsProposal(): boolean;
}

export interface LoanWithCollateralSubflowMetadata {
  readonly kind: LoanWithCollateralSubflowKind;
  readonly productId: string;
  readonly productCode: string;
  readonly productName: string;
  readonly productAliases: readonly string[];
  readonly subproductId: string;
  readonly subproductCode: string;
  readonly subproductName: string;
  readonly subproductAliases: readonly string[];
  readonly collateralKind: LoanWithCollateralCollateralKind;
}

export interface LoanWithCollateralSubflow {
  readonly metadata: LoanWithCollateralSubflowMetadata;
  readonly capability: LoanWithCollateralSubflowCapability;
  identify(context: SimulationProductContext): boolean;
  supports(context: SimulationProductContext): boolean;
  validate(context: SimulationProductContext): SimulationProductValidationResult;
  prepareContext(context: SimulationProductContext): SimulationProductContext;
}

export interface LoanWithCollateralSubflowRegistry {
  register(subflow: LoanWithCollateralSubflow): void;
  resolve(context: Pick<SimulationProductContext['request']['product'], 'id' | 'code' | 'name' | 'slug'> & {
    subproduct?: Pick<SimulationProductContext['request']['subproduct'], 'id' | 'code' | 'name' | 'slug'>;
  }): LoanWithCollateralSubflow | undefined;
  resolveFromContext(context: SimulationProductContext): LoanWithCollateralSubflow | undefined;
  list(): readonly LoanWithCollateralSubflow[];
}

export interface LoanWithCollateralSubflowCapabilityInput {
  readonly names?: readonly string[];
  readonly supportsVehicle?: boolean;
  readonly supportsProperty?: boolean;
  readonly supportsBank?: boolean;
  readonly supportsCorban?: boolean;
  readonly supportsProvider?: boolean;
  readonly supportsCollateral?: boolean;
  readonly supportsProposal?: boolean;
}

export interface LoanWithCollateralSubflowFactoryInput {
  readonly metadata: LoanWithCollateralSubflowMetadata;
  readonly capability: LoanWithCollateralSubflowCapability;
  readonly validate: (context: SimulationProductContext) => SimulationProductValidationResult;
  readonly prepareContext?: (context: SimulationProductContext) => SimulationProductContext;
}
