import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import type {
  MarginInquiryInput,
  MarginInquiryProvider,
  MarginInquiryResult,
} from '../../domain/contracts/provider-capabilities.contract.js';
import type { ProviderRuntimeOptions } from '../../application/provider-engine.js';
import { ProviderAuthenticationError } from '../../domain/errors/provider-authentication.error.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { createModuleLogger } from '../../../../shared/logger.js';
import {
  inquireSosBolsoMargin,
  testSosBolsoConnection,
} from './sos-bolso.client.js';
import { SOS_BOLSO_PROVIDER_KEY, type SosBolsoConnectionStatus } from './sos-bolso.types.js';

const logger = createModuleLogger('integrations.sos-bolso');

const maskCpf = (value: string): string => {
  const normalized = value.replace(/\D+/g, '');
  if (normalized.length !== 11) {
    return '***';
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
};

export class SosBolsoService
  implements IntegrationProvider, MarginInquiryProvider
{
  constructor(private readonly runtime?: ProviderRuntimeOptions) {}

  bindRuntime(runtime: ProviderRuntimeOptions): IntegrationProvider {
    return new SosBolsoService(runtime);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<SosBolsoConnectionStatus> {
    const result = await testSosBolsoConnection();

    if (!result.success) {
      logger.warn('Provider health check failed', {
        providerKey: result.providerKey,
        status: result.statusCode ?? result.externalStatus,
        durationMs: result.durationMs,
        success: false,
      });

      if (result.error.code === 'SOS_BOLSO_CONFIGURATION_ERROR') {
        throw new ProviderConfigurationError(SOS_BOLSO_PROVIDER_KEY);
      }
      if (result.error.code === 'SOS_BOLSO_AUTHENTICATION_ERROR') {
        throw new ProviderAuthenticationError(SOS_BOLSO_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(SOS_BOLSO_PROVIDER_KEY);
    }

    logger.info('Provider health check completed', {
      providerKey: result.providerKey,
      status: result.statusCode,
      durationMs: result.durationMs,
      success: true,
    });

    return {
      connected: true,
      status: result.statusCode,
    };
  }

  async inquireMargin(input: MarginInquiryInput): Promise<MarginInquiryResult> {
    const requestId = String(input.metadata?.requestId ?? '').trim() || undefined;
    const result = await inquireSosBolsoMargin(input, {
      ...(requestId ? { requestId } : {}),
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
      ...(this.runtime?.providerRetryPolicy
        ? { providerRetryPolicy: this.runtime.providerRetryPolicy }
        : {}),
    });

    if (!result.success) {
      logger.warn('Provider margin inquiry failed', {
        providerKey: SOS_BOLSO_PROVIDER_KEY,
        requestId,
        document: maskCpf(input.document),
        durationMs: result.durationMs,
        errorCode: result.error.code,
      });

      if (result.error.code === 'SOS_BOLSO_CONFIGURATION_ERROR') {
        throw new ProviderConfigurationError(SOS_BOLSO_PROVIDER_KEY);
      }
      if (result.error.code === 'SOS_BOLSO_AUTHENTICATION_ERROR') {
        throw new ProviderAuthenticationError(SOS_BOLSO_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(SOS_BOLSO_PROVIDER_KEY);
    }

    logger.info('Provider margin inquiry completed', {
      providerKey: SOS_BOLSO_PROVIDER_KEY,
      requestId,
      document: maskCpf(input.document),
      durationMs: result.durationMs,
      success: true,
    });

    return result.data;
  }
}
