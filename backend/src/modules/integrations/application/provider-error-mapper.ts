import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderAuthenticationError } from '../domain/errors/provider-authentication.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConfigurationError } from '../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import { ProviderRateLimitError } from '../domain/errors/provider-rate-limit.error.js';

export type ProviderSafeErrorCode =
  | 'PROVIDER_CONFIGURATION_ERROR'
  | 'PROVIDER_AUTHENTICATION_ERROR'
  | 'PROVIDER_CONNECTION_ERROR'
  | 'PROVIDER_RATE_LIMIT_ERROR'
  | 'PROVIDER_TIMEOUT_ERROR'
  | 'PROVIDER_CAPABILITY_NOT_SUPPORTED'
  | 'PROVIDER_UNKNOWN_ERROR';

const hasStatus = (error: unknown): error is { status: number } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number';

const isTimeoutError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

export const mapProviderError = (error: unknown): ProviderSafeErrorCode => {
  if (error instanceof ProviderConfigurationError) {
    return 'PROVIDER_CONFIGURATION_ERROR';
  }

  if (error instanceof ProviderAuthenticationError) {
    return 'PROVIDER_AUTHENTICATION_ERROR';
  }

  if (error instanceof ProviderConnectionError) {
    return 'PROVIDER_CONNECTION_ERROR';
  }

  if (error instanceof ProviderRateLimitError) {
    return 'PROVIDER_RATE_LIMIT_ERROR';
  }

  if (error instanceof ProviderCapabilityNotSupportedError) {
    return 'PROVIDER_CAPABILITY_NOT_SUPPORTED';
  }

  if (isTimeoutError(error)) {
    return 'PROVIDER_TIMEOUT_ERROR';
  }

  if (hasStatus(error)) {
    if (error.status === 401 || error.status === 403) {
      return 'PROVIDER_AUTHENTICATION_ERROR';
    }
    if (error.status === 429) {
      return 'PROVIDER_RATE_LIMIT_ERROR';
    }
    if (error.status >= 500) {
      return 'PROVIDER_CONNECTION_ERROR';
    }
  }

  if (error instanceof IntegrationError) {
    return 'PROVIDER_UNKNOWN_ERROR';
  }

  return 'PROVIDER_UNKNOWN_ERROR';
};
