import { mapProviderError } from '../../../modules/integrations/application/provider-error-mapper.js';
import { ProviderAuthenticationError } from '../../../modules/integrations/domain/errors/provider-authentication.error.js';
import { ProviderCapabilityNotSupportedError } from '../../../modules/integrations/domain/errors/provider-capability-not-supported.error.js';
import { ProviderConfigurationError } from '../../../modules/integrations/domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderRateLimitError } from '../../../modules/integrations/domain/errors/provider-rate-limit.error.js';

describe('mapProviderError', () => {
  it('maps known provider errors to safe codes', () => {
    expect(mapProviderError(new ProviderConfigurationError('p'))).toBe(
      'PROVIDER_CONFIGURATION_ERROR',
    );
    expect(mapProviderError(new ProviderAuthenticationError('p'))).toBe(
      'PROVIDER_AUTHENTICATION_ERROR',
    );
    expect(mapProviderError(new ProviderConnectionError('p'))).toBe('PROVIDER_CONNECTION_ERROR');
    expect(mapProviderError(new ProviderRateLimitError('p'))).toBe('PROVIDER_RATE_LIMIT_ERROR');
    expect(mapProviderError(new ProviderCapabilityNotSupportedError('p', 'c'))).toBe(
      'PROVIDER_CAPABILITY_NOT_SUPPORTED',
    );
  });

  it('maps timeout and fallback errors', () => {
    expect(mapProviderError(new DOMException('Timeout', 'AbortError'))).toBe(
      'PROVIDER_TIMEOUT_ERROR',
    );
    expect(mapProviderError(new Error('unknown'))).toBe('PROVIDER_UNKNOWN_ERROR');
  });
});
