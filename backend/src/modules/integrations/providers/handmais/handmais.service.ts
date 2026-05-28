import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import type { ProviderRuntimeOptions } from '../../application/provider-engine.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { createModuleLogger } from '../../../../shared/logger.js';
import {
  runHandmaisInitialSimulation,
  testHandmaisConnection,
} from './handmais.client.js';
import { HANDMAIS_PROVIDER_KEY } from './handmais.types.js';
import type {
  HandmaisInitialSimulationRequest,
  HandmaisNormalizedInitialSimulationResult,
} from './handmais.types.js';

const logger = createModuleLogger('integrations.handmais');

export class HandmaisService implements IntegrationProvider {
  constructor(private readonly runtime?: ProviderRuntimeOptions) {}

  bindRuntime(runtime: ProviderRuntimeOptions): IntegrationProvider {
    return new HandmaisService(runtime);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  }

  async testConnection() {
    const result = await testHandmaisConnection({
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
    });

    if (!result.success) {
      logger.warn('Provider health check failed', {
        providerKey: result.providerKey,
        requestId: result.diagnostics.requestId,
        errorCode: result.error.code,
      });

      if (
        result.error.code === 'HANDMAIS_CONFIGURATION_ERROR' ||
        result.error.code === 'HANDMAIS_TIMEOUT_INVALID' ||
        result.error.code === 'HANDMAIS_AUTH_INVALID'
      ) {
        throw new ProviderConfigurationError(HANDMAIS_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(HANDMAIS_PROVIDER_KEY);
    }

    logger.info('Provider connectivity skeleton is healthy', {
      providerKey: result.providerKey,
      requestId: result.diagnostics.requestId,
      timeoutMs: result.diagnostics.timeoutMs,
      authConfigured: result.diagnostics.authConfigured,
      environment: result.diagnostics.environment,
      externalCall: result.diagnostics.externalCall,
    });

    return {
      connected: true,
      status: result.statusCode,
      message: result.message,
    };
  }

  async runInitialSimulation(
    input: HandmaisInitialSimulationRequest,
  ): Promise<HandmaisNormalizedInitialSimulationResult> {
    const result = await runHandmaisInitialSimulation(input, {
      ...(this.runtime?.context ? { context: this.runtime.context } : {}),
      ...(this.runtime?.healthTracker ? { healthTracker: this.runtime.healthTracker } : {}),
    });

    if (!result.success) {
      logger.warn('Provider initial simulation failed', {
        providerKey: result.providerKey,
        requestId: result.diagnostics.requestId,
        endpoint: result.diagnostics.endpoint,
        latencyMs: result.diagnostics.latencyMs,
        errorCode: result.error.code,
        normalizedProviderError: result.diagnostics.normalizedProviderError,
      });

      if (
        result.error.code === 'HANDMAIS_INVALID_CPF' ||
        result.error.code === 'HANDMAIS_INVALID_MATRICULA' ||
        result.error.code === 'HANDMAIS_AUTH_INVALID'
      ) {
        throw new ProviderConfigurationError(HANDMAIS_PROVIDER_KEY);
      }

      throw new ProviderConnectionError(HANDMAIS_PROVIDER_KEY);
    }

    logger.info('Provider initial simulation completed', {
      providerKey: result.providerKey,
      requestId: result.diagnostics.requestId,
      endpoint: result.diagnostics.endpoint,
      latencyMs: result.diagnostics.latencyMs,
      providerStatusCode: result.diagnostics.providerStatusCode,
      connectivityStatus: result.diagnostics.connectivityStatus,
      cpfMasked: result.data.cpfMasked,
    });

    return result.data;
  }
}
