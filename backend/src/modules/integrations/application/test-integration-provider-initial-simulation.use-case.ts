import type { ProviderEngine } from './provider-engine.js';
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
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(providerName: string, input: InitialSimulationInput): Promise<unknown> {
    try {
      const provider = this.providerEngine.resolve(providerName) as InitialSimulationCapableProvider;
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

