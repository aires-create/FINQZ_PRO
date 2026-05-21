import {
  ProviderEngine,
  type IntegrationProviderRegistry,
} from './application/provider-engine.js';
import { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
import { IntegrationsController } from './presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from './presentation/http/integrations.routes.js';
import { NovaPromotoraService } from './providers/nova-promotora/nova-promotora.service.js';

const providerRegistry = {
  'nova-promotora': new NovaPromotoraService(),
} satisfies IntegrationProviderRegistry;

const testConnectionUseCase = new TestIntegrationProviderConnectionUseCase(
  new ProviderEngine(providerRegistry),
);
const integrationsController = new IntegrationsController(
  testConnectionUseCase,
);

export const integrationsRoutes = createIntegrationsRoutes(
  integrationsController,
);

export { ProviderEngine } from './application/provider-engine.js';
export { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
export type {
  IntegrationConnectionStatus,
  IntegrationProvider,
} from './domain/contracts/provider.contract.js';
