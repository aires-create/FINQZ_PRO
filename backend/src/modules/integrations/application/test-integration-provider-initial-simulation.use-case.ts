import type { ProviderEngine } from './provider-engine.js';
import type { ProviderHealthTracker } from './provider-health-tracker.js';
import type { ProviderRetryPolicy } from './provider-retry-policy.js';
import type { ProviderExecutionContext } from './provider-execution-context.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';

type InitialSimulationInput = {
  cpf: string;
  matricula: string;
};

type InitialSimulationCapableProvider = {
  runInitialSimulation?: (input: InitialSimulationInput) => Promise<unknown>;
};

const hasInitialSimulation = (
  provider: InitialSimulationCapableProvider,
): provider is Required<Pick<InitialSimulationCapableProvider, 'runInitialSimulation'>> =>
  typeof provider.runInitialSimulation === 'function';

export class TestIntegrationProviderInitialSimulationUseCase {
  constructor(
    private readonly providerEngine: ProviderEngine,
    private readonly healthTracker?: ProviderHealthTracker,
    private readonly providerRetryPolicy?: ProviderRetryPolicy,
  ) {}

  async execute(providerName: string, input: InitialSimulationInput): Promise<unknown> {
    try {
      const context: ProviderExecutionContext = {
        requestId: `initial-sim-${Date.now()}`,
        tenantId: 'integration-test',
        providerKey: providerName,
        capability: 'initialSimulation',
        operation: 'test_initial_simulation',
        startedAt: new Date(),
        attempt: 1,
      };

      const provider = this.providerEngine.resolve(providerName, {
        context,
        ...(this.healthTracker ? { healthTracker: this.healthTracker } : {}),
        ...(this.providerRetryPolicy ? { providerRetryPolicy: this.providerRetryPolicy } : {}),
      }) as InitialSimulationCapableProvider;
      if (!hasInitialSimulation(provider)) {
        throw new ProviderCapabilityNotSupportedError(providerName, 'initialSimulation');
      }

      return await provider.runInitialSimulation(input);
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}
