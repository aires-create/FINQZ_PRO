import { IntegrationError } from './integration.error.js';

export class ProviderRateLimitError extends IntegrationError {
  constructor(providerKey: string) {
    super({
      code: 'PROVIDER_RATE_LIMIT_ERROR',
      message: `Integration provider rate limit reached: ${providerKey}`,
    });
  }
}
