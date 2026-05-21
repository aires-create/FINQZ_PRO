import { IntegrationError } from './integration.error.js';

export class ProviderConfigurationError extends IntegrationError {
  constructor(providerKey: string) {
    super({
      code: 'PROVIDER_CONFIGURATION_ERROR',
      message: `Integration provider configuration is incomplete: ${providerKey}`,
    });
  }
}
