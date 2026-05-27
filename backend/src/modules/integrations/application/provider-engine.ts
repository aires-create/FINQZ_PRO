import type { IntegrationProvider } from '../domain/contracts/provider.contract.js';
import { ProviderNotFoundError } from '../domain/errors/provider-not-found.error.js';
import type { ProviderExecutionContext } from './provider-execution-context.js';
import type { ProviderHealthTracker } from './provider-health-tracker.js';
import type { ProviderRetryPolicy } from './provider-retry-policy.js';

export type IntegrationProviderRegistry = Readonly<Record<string, IntegrationProvider>>;

export type ProviderRuntimeOptions = {
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
  providerRetryPolicy?: ProviderRetryPolicy;
};

type RuntimeAwareProvider = IntegrationProvider & {
  bindRuntime?: (runtime: ProviderRuntimeOptions) => IntegrationProvider;
};

export class ProviderEngine {
  constructor(
    private readonly registry: IntegrationProviderRegistry,
  ) {}

  resolve(providerName: string, runtime?: ProviderRuntimeOptions): IntegrationProvider {
    const provider = this.registry[providerName];

    if (!provider) {
      throw new ProviderNotFoundError(providerName);
    }

    const runtimeAwareProvider = provider as RuntimeAwareProvider;
    if (runtime && typeof runtimeAwareProvider.bindRuntime === 'function') {
      return runtimeAwareProvider.bindRuntime(runtime);
    }

    return provider;
  }
}
