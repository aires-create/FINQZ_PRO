import { IntegrationError } from './integration.error.js';

export class ProviderCapabilityNotSupportedError extends IntegrationError {
  constructor(providerKey: string, capability: string) {
    super({
      code: 'PROVIDER_CAPABILITY_NOT_SUPPORTED',
      message: `Integration provider capability not supported: ${providerKey}/${capability}`,
    });
  }
}
