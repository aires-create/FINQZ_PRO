import { IntegrationError } from './integration.error.js';

export class ProviderNotFoundError extends IntegrationError {
  constructor(providerKey: string) {
    super({
      code: 'PROVIDER_NOT_FOUND',
      message: `Integration provider not found: ${providerKey}`,
    });
  }
}
