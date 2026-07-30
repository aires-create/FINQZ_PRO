import type { SimulationProductAdapter } from './simulation-product.adapter.js';
import type { SimulationProductContext } from './simulation-product.context.js';
import type { SimulationProductRegistry } from './simulation-product.registry.js';

export interface SimulationProductResolverContract {
  resolve(context: Pick<SimulationProductContext['request']['product'], 'id' | 'code'> & { subproduct?: Pick<SimulationProductContext['request']['subproduct'], 'id' | 'code'> }): SimulationProductAdapter | undefined;
  resolveFromContext(context: SimulationProductContext): SimulationProductAdapter | undefined;
}

export class SimulationProductResolver implements SimulationProductResolverContract {
  constructor(private readonly registry: SimulationProductRegistry) {}

  resolve(
    context: Pick<SimulationProductContext['request']['product'], 'id' | 'code'> & {
      subproduct?: Pick<SimulationProductContext['request']['subproduct'], 'id' | 'code'>;
    },
  ): SimulationProductAdapter | undefined {
    const productKey = context.id ?? context.code;
    if (!productKey) {
      return undefined;
    }

    const subproductKey = context.subproduct?.id ?? context.subproduct?.code;
    return this.registry.resolve(productKey, subproductKey);
  }

  resolveFromContext(context: SimulationProductContext): SimulationProductAdapter | undefined {
    return this.resolve({
      id: context.request.product.id,
      code: context.request.product.code,
      subproduct: {
        id: context.request.subproduct.id,
        code: context.request.subproduct.code,
      },
    });
  }
}
