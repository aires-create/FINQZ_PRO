import { IntegrationError } from './integration.error.js';

export class ProviderConnectionError extends IntegrationError {
  constructor(providerKey: string) {
    super({
      code: 'PROVIDER_CONNECTION_ERROR',
      message: `Integration provider connection failed: ${providerKey}`,
    });
  }
}
