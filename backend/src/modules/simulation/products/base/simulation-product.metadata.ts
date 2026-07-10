import type { SimulationProductCapabilityName } from './simulation-product.types.js';

export interface SimulationProductSubproductMetadata {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly aliases?: readonly string[];
}

export interface SimulationProductMetadata {
  readonly productId: string;
  readonly productCode: string;
  readonly productName: string;
  readonly productAliases: readonly string[];
  readonly subproducts: readonly SimulationProductSubproductMetadata[];
  readonly version: string;
  readonly engineVersion: string;
  readonly catalogVersion: string;
  readonly capabilities: readonly SimulationProductCapabilityName[];
  readonly supportedProviders: readonly string[];
  readonly supportedChannels: readonly string[];
  readonly supportedCollateral: readonly string[];
  readonly featureFlags: readonly string[];
}

