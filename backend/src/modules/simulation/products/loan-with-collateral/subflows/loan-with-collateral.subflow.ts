import { createSimulationProductValidationResult } from '../../base/index.js';
import type { SimulationProductContext } from '../../base/index.js';
import type {
  LoanWithCollateralSubflow,
  LoanWithCollateralSubflowCapability,
  LoanWithCollateralSubflowCapabilityInput,
  LoanWithCollateralSubflowFactoryInput,
  LoanWithCollateralSubflowRegistry,
} from './loan-with-collateral.subflow.types.js';

const normalizeToken = (value: string): string => value.trim().toLowerCase();

const hasVehicleCollateral = (context: SimulationProductContext): boolean =>
  Boolean(
    context.request.vehicle ||
      context.request.guarantees.some(
        (guarantee) =>
          guarantee.kind === 'vehicle' ||
          guarantee.asset?.kind === 'vehicle',
      ),
  );

const hasPropertyCollateral = (context: SimulationProductContext): boolean =>
  Boolean(
    context.request.property ||
      context.request.guarantees.some(
        (guarantee) =>
          guarantee.kind === 'property' ||
          guarantee.asset?.kind === 'property',
      ),
  );

export const createLoanWithCollateralSubflowCapability = (
  input: LoanWithCollateralSubflowCapabilityInput = {},
): LoanWithCollateralSubflowCapability => {
  const names = input.names ?? [];

  return {
    names,
    supportsVehicle: () => input.supportsVehicle ?? names.includes('vehicle'),
    supportsProperty: () => input.supportsProperty ?? names.includes('property'),
    supportsBank: () => input.supportsBank ?? names.includes('bank'),
    supportsCorban: () => input.supportsCorban ?? names.includes('corban'),
    supportsProvider: () => input.supportsProvider ?? names.includes('provider'),
    supportsCollateral: () => input.supportsCollateral ?? names.includes('collateral'),
    supportsProposal: () => input.supportsProposal ?? names.includes('proposal'),
  };
};

export const createLoanWithCollateralSubflow = (
  input: LoanWithCollateralSubflowFactoryInput,
): LoanWithCollateralSubflow => ({
  metadata: input.metadata,
  capability: input.capability,
  identify: (context) => {
    const productTokens = [
      context.request.product.id,
      context.request.product.code,
      context.request.product.name,
      context.request.product.slug,
      ...input.metadata.productAliases,
    ].filter(Boolean) as string[];

    const subproductTokens = [
      context.request.subproduct.id,
      context.request.subproduct.code,
      context.request.subproduct.name,
      context.request.subproduct.slug,
      ...input.metadata.subproductAliases,
    ].filter(Boolean) as string[];

    const matchesProduct = productTokens.some((token) =>
      normalizeToken(token) === normalizeToken(input.metadata.productId) ||
      normalizeToken(token) === normalizeToken(input.metadata.productCode) ||
      normalizeToken(token) === normalizeToken(input.metadata.productName) ||
      normalizeToken(token) === normalizeToken(input.metadata.productAliases[0] ?? input.metadata.productId),
    );

    const matchesSubproduct = subproductTokens.some((token) =>
      normalizeToken(token) === normalizeToken(input.metadata.subproductId) ||
      normalizeToken(token) === normalizeToken(input.metadata.subproductCode) ||
      normalizeToken(token) === normalizeToken(input.metadata.subproductName) ||
      input.metadata.subproductAliases.some((alias) => normalizeToken(alias) === normalizeToken(token)),
    );

    return matchesProduct && matchesSubproduct;
  },
  supports: (context) => {
    return input.validate(context).valid;
  },
  validate: input.validate,
  prepareContext: input.prepareContext ?? ((context) => context),
});

export const createLoanWithCollateralSubflowRegistry = (
  subflows: readonly LoanWithCollateralSubflow[] = [],
): LoanWithCollateralSubflowRegistry => {
  const registry = new Map<string, LoanWithCollateralSubflow>();
  const registered: LoanWithCollateralSubflow[] = [];

  const getTokens = (value?: string): string[] =>
    value ? [value, normalizeToken(value)] : [];

  const registerTokens = (subflow: LoanWithCollateralSubflow): void => {
    const productTokens = [
      subflow.metadata.productId,
      subflow.metadata.productCode,
      subflow.metadata.productName,
      ...subflow.metadata.productAliases,
    ].flatMap(getTokens);
    const subproductTokens = [
      subflow.metadata.subproductId,
      subflow.metadata.subproductCode,
      subflow.metadata.subproductName,
      ...subflow.metadata.subproductAliases,
    ].flatMap(getTokens);

    for (const productToken of productTokens) {
      for (const subproductToken of subproductTokens) {
        registry.set(`${normalizeToken(productToken)}::${normalizeToken(subproductToken)}`, subflow);
      }
    }
  };

  for (const subflow of subflows) {
    registered.push(subflow);
    registerTokens(subflow);
  }

  const resolve = (
    context: Pick<SimulationProductContext['request']['product'], 'id' | 'code' | 'name' | 'slug'> & {
      subproduct?: Pick<SimulationProductContext['request']['subproduct'], 'id' | 'code' | 'name' | 'slug'>;
    },
  ): LoanWithCollateralSubflow | undefined => {
    const productTokens = [
      context.id,
      context.code,
      context.name,
      context.slug,
    ].filter(Boolean) as string[];

    const subproductTokens = [
      context.subproduct?.id,
      context.subproduct?.code,
      context.subproduct?.name,
      context.subproduct?.slug,
    ].filter(Boolean) as string[];

    for (const productToken of productTokens) {
      for (const subproductToken of subproductTokens) {
        const subflow = registry.get(`${normalizeToken(productToken)}::${normalizeToken(subproductToken)}`);
        if (subflow) {
          return subflow;
        }
      }
    }

    return undefined;
  };

  return {
    register(subflow: LoanWithCollateralSubflow): void {
      registered.push(subflow);
      registerTokens(subflow);
    },
    resolve,
    resolveFromContext(context: SimulationProductContext): LoanWithCollateralSubflow | undefined {
      const product = {
        id: context.request.product.id,
        code: context.request.product.code,
        name: context.request.product.name,
        ...(context.request.product.slug ? { slug: context.request.product.slug } : {}),
      };
      const subproduct = {
        id: context.request.subproduct.id,
        code: context.request.subproduct.code,
        name: context.request.subproduct.name,
        ...(context.request.subproduct.slug ? { slug: context.request.subproduct.slug } : {}),
      };

      return resolve({
        ...product,
        subproduct,
      });
    },
    list(): readonly LoanWithCollateralSubflow[] {
      return [...registered];
    },
  };
};

export const buildLoanWithCollateralStructuralValidation = (
  context: SimulationProductContext,
  expectedCollateralKind: 'vehicle' | 'property',
) => {
  const hasCollateral = expectedCollateralKind === 'vehicle'
    ? hasVehicleCollateral(context)
    : hasPropertyCollateral(context);

  if (hasCollateral) {
    return createSimulationProductValidationResult(true, []);
  }

  return createSimulationProductValidationResult(false, [
    {
      code: 'COLLATERAL_MISSING',
      message: `Collateral of kind ${expectedCollateralKind} is required`,
      severity: 'error',
    },
  ]);
};
