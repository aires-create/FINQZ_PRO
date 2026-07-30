import { providerCatalog } from '../../../modules/integrations/application/provider-catalog.js';
import { providerCapabilityRegistry } from '../../../modules/integrations/application/provider-capability-registry.js';
import { runtimeProviderKeys } from '../../../modules/integrations/provider-runtime-registry.js';

describe('Provider catalog alignment', () => {
  it('ensures every runtime provider exists in the catalog', () => {
    const catalogKeys = new Set(providerCatalog.map((entry) => entry.providerKey));

    for (const runtimeKey of runtimeProviderKeys) {
      expect(catalogKeys.has(runtimeKey)).toBe(true);
    }
  });

  it('ensures every capability registry provider exists in the catalog', () => {
    const catalogKeys = new Set(providerCatalog.map((entry) => entry.providerKey));

    for (const capabilityKey of Object.keys(providerCapabilityRegistry)) {
      expect(catalogKeys.has(capabilityKey as (typeof providerCatalog)[number]['providerKey'])).toBe(true);
    }
  });

  it('ensures forbidden legacy providers are absent', () => {
    const allKeys = [
      ...providerCatalog.map((entry) => entry.providerKey),
      ...Object.keys(providerCapabilityRegistry),
      ...runtimeProviderKeys,
    ].map((value) => String(value).toLowerCase());

    for (const key of allKeys) {
      expect(key).not.toContain('nova-promotora');
      expect(key).not.toContain('storm');
    }
  });
});
