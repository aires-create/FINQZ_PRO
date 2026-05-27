import { IntegrationError } from './integration.error.js';

export class ProviderAuthenticationError extends IntegrationError {
  constructor(providerKey: string) {
    super({
      code: 'PROVIDER_AUTHENTICATION_ERROR',
      message: `Integration provider authentication failed: ${providerKey}`,
    });
  }
}
