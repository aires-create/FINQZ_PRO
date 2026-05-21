import {
  ProviderEngine,
  type IntegrationProviderRegistry,
} from './application/provider-engine.js';
import { ListIntegrationProviderProposalsUseCase } from './application/list-integration-provider-proposals.use-case.js';
import { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
import { IntegrationsController } from './presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from './presentation/http/integrations.routes.js';
import { NovaPromotoraService } from './providers/nova-promotora/nova-promotora.service.js';

const providerRegistry = {
  'nova-promotora': new NovaPromotoraService(),
} satisfies IntegrationProviderRegistry;
const providerEngine = new ProviderEngine(providerRegistry);

const testConnectionUseCase = new TestIntegrationProviderConnectionUseCase(
  providerEngine,
);
const listProposalsUseCase = new ListIntegrationProviderProposalsUseCase(
  providerEngine,
);
const integrationsController = new IntegrationsController(
  testConnectionUseCase,
  listProposalsUseCase,
);

export const integrationsRoutes = createIntegrationsRoutes(
  integrationsController,
);

export { ProviderEngine } from './application/provider-engine.js';
export { ListIntegrationProviderProposalsUseCase } from './application/list-integration-provider-proposals.use-case.js';
export { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
export type {
  IntegrationProposal,
  IntegrationProposalReader,
} from './domain/contracts/integration-proposal.contract.js';
export type {
  IntegrationConnectionStatus,
  IntegrationProvider,
} from './domain/contracts/provider.contract.js';
export { IntegrationError } from './domain/errors/integration.error.js';
export { ProviderCapabilityNotSupportedError } from './domain/errors/provider-capability-not-supported.error.js';
export { ProviderConfigurationError } from './domain/errors/provider-configuration.error.js';
export { ProviderConnectionError } from './domain/errors/provider-connection.error.js';
export { ProviderNotFoundError } from './domain/errors/provider-not-found.error.js';
