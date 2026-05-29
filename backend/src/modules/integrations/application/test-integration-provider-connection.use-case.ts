import type { IntegrationConnectionStatus } from '../domain/contracts/provider.contract.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';
import type { ProviderHealthTracker } from './provider-health-tracker.js';
import type { ProviderRetryPolicy } from './provider-retry-policy.js';
import type { ProviderExecutionContext } from './provider-execution-context.js';

export class TestIntegrationProviderConnectionUseCase {
  constructor(
    private readonly providerEngine: ProviderEngine,
    private readonly healthTracker?: ProviderHealthTracker,
    private readonly providerRetryPolicy?: ProviderRetryPolicy,
  ) {}

  async execute(providerName: string): Promise<IntegrationConnectionStatus> {
    try {
      const context: ProviderExecutionContext = {
        requestId: `provider-test-${Date.now()}`,
        tenantId: 'integration-test',
        providerKey: providerName,
        capability: 'healthCheck',
        operation: 'test_provider_connection',
        startedAt: new Date(),
        attempt: 1,
      };

      const provider = this.providerEngine.resolve(providerName, {
        context,
        ...(this.healthTracker ? { healthTracker: this.healthTracker } : {}),
        ...(this.providerRetryPolicy ? { providerRetryPolicy: this.providerRetryPolicy } : {}),
      });
      const result = await provider.testConnection();

      if (!result.connected) {
        throw new ProviderConnectionError(providerName);
      }

      return result;
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
