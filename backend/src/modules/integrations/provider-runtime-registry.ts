import type { IntegrationProviderRegistry } from './application/provider-engine.js';
import {
  getProviderCatalogByScope,
  type IntegrationProviderKey,
} from './application/provider-catalog.js';
import { BluepayService } from './providers/bluepay/bluepay.service.js';
import { HandmaisService } from './providers/handmais/handmais.service.js';
import { SosBolsoService } from './providers/sos-bolso/sos-bolso.service.js';

export type RuntimeProviderKey = 'sos-bolso' | 'handmais' | 'bluepay';

const isRuntimeProviderKey = (
  providerKey: IntegrationProviderKey,
): providerKey is RuntimeProviderKey => {
  return providerKey === 'sos-bolso' || providerKey === 'handmais' || providerKey === 'bluepay';
};

export const runtimeProviderKeys: RuntimeProviderKey[] = getProviderCatalogByScope('runtime')
  .map((entry) => entry.providerKey)
  .filter(isRuntimeProviderKey);

const runtimeProviderFactoryMap = {
  'sos-bolso': () => new SosBolsoService(),
  handmais: () => new HandmaisService(),
  bluepay: () => new BluepayService(),
} as const;

export const buildProviderRuntimeRegistry = (): IntegrationProviderRegistry => {
  return Object.fromEntries(
    runtimeProviderKeys.map((providerKey) => [
      providerKey,
      runtimeProviderFactoryMap[providerKey](),
    ]),
  );
};
