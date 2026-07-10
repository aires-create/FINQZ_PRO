import type { SimulationProductAdapter } from './simulation-product.adapter.js';
import type { SimulationProductMetadata } from './simulation-product.metadata.js';

const normalizeKey = (value: string): string => value.trim().toLowerCase();

export class SimulationProductRegistry {
  private readonly adaptersByProductKey = new Map<string, SimulationProductAdapter>();

  private readonly adaptersByProductSubproductKey = new Map<string, SimulationProductAdapter>();

  private readonly adapters: SimulationProductAdapter[] = [];

  register(adapter: SimulationProductAdapter): void {
    const metadata = adapter.metadata;

    this.adapters.push(adapter);

    for (const key of this.getProductKeys(metadata)) {
      this.adaptersByProductKey.set(key, adapter);
    }

    const productKeys = this.getProductKeys(metadata);

    for (const subproduct of metadata.subproducts) {
      for (const productKey of productKeys) {
        for (const subproductKey of this.getSubproductKeys(subproduct.id, subproduct.code, subproduct.aliases)) {
          this.adaptersByProductSubproductKey.set(this.toPairKey(productKey, subproductKey), adapter);
        }
      }
    }
  }

  resolve(productId: string, subproductId?: string): SimulationProductAdapter | undefined {
    const productKey = normalizeKey(productId);
    const subproductKey = subproductId ? normalizeKey(subproductId) : undefined;

    if (subproductKey) {
      const pairKey = this.toPairKey(productKey, subproductKey);
      const pairAdapter = this.adaptersByProductSubproductKey.get(pairKey);
      if (pairAdapter) {
        return pairAdapter;
      }
    }

    return this.adaptersByProductKey.get(productKey);
  }

  list(): readonly SimulationProductAdapter[] {
    return [...this.adapters];
  }

  private getProductKeys(metadata: SimulationProductMetadata): string[] {
    return [
      metadata.productId,
      metadata.productCode,
      metadata.productName,
      ...metadata.productAliases,
    ].map(normalizeKey);
  }

  private getSubproductKeys(
    subproductId: string,
    subproductCode: string,
    aliases: readonly string[] = [],
  ): string[] {
    return [
      subproductId,
      subproductCode,
      ...aliases,
    ].map(normalizeKey);
  }

  private toPairKey(productKey: string, subproductKey: string): string {
    return `${productKey}::${subproductKey}`;
  }
}

export const createSimulationProductRegistry = (
  adapters: readonly SimulationProductAdapter[] = [],
): SimulationProductRegistry => {
  const registry = new SimulationProductRegistry();

  for (const adapter of adapters) {
    registry.register(adapter);
  }

  return registry;
};
