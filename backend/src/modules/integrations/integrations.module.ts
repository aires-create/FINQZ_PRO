import {
  ProviderEngine,
  type IntegrationProviderRegistry,
} from './application/provider-engine.js';
import { ListProviderCapabilitiesUseCase } from './application/list-provider-capabilities.use-case.js';
import { ListIntegrationProviderProposalsUseCase } from './application/list-integration-provider-proposals.use-case.js';
import { ListFinancialProviderProposalsUseCase } from './application/list-financial-provider-proposals.use-case.js';
import { GetProviderPayloadDiagnosticsUseCase } from './application/get-provider-payload-diagnostics.use-case.js';
import { GetProviderRuntimeDiagnosticsUseCase } from './application/get-provider-runtime-diagnostics.use-case.js';
import { GetProviderRuntimeIssuesUseCase } from './application/get-provider-runtime-issues.use-case.js';
import { GetProviderRuntimeSummaryUseCase } from './application/get-provider-runtime-summary.use-case.js';
import { GetProviderOperationsConsoleUseCase } from './application/get-provider-operations-console.use-case.js';
import { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
import { TestIntegrationProviderMarginInquiryUseCase } from './application/test-integration-provider-margin-inquiry.use-case.js';
import { TestIntegrationProviderInitialSimulationUseCase } from './application/test-integration-provider-initial-simulation.use-case.js';
import { ProviderHealthTracker } from './application/provider-health-tracker.js';
import { ProviderRuntimeDiagnosticsService } from './application/provider-runtime-diagnostics.service.js';
import { IntegrationsController } from './presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from './presentation/http/integrations.routes.js';
import { BluepayService } from './providers/bluepay/bluepay.service.js';
import { HandmaisService } from './providers/handmais/handmais.service.js';
import { NovaPromotoraService } from './providers/nova-promotora/nova-promotora.service.js';
import { SosBolsoService } from './providers/sos-bolso/sos-bolso.service.js';

const providerRegistry = {
  'nova-promotora': new NovaPromotoraService(),
  'sos-bolso': new SosBolsoService(),
  handmais: new HandmaisService(),
  bluepay: new BluepayService(),
} satisfies IntegrationProviderRegistry;
const providerEngine = new ProviderEngine(providerRegistry);

const listProposalsUseCase = new ListIntegrationProviderProposalsUseCase(
  providerEngine,
);
const listFinancialProposalsUseCase = new ListFinancialProviderProposalsUseCase(
  providerEngine,
);
const getProviderPayloadDiagnosticsUseCase = new GetProviderPayloadDiagnosticsUseCase(
  providerEngine,
);
const listProviderCapabilitiesUseCase = new ListProviderCapabilitiesUseCase();
const providerHealthTracker = new ProviderHealthTracker();
const testProviderMarginInquiryUseCase = new TestIntegrationProviderMarginInquiryUseCase(
  providerEngine,
);
const testProviderInitialSimulationUseCase = new TestIntegrationProviderInitialSimulationUseCase(
  providerEngine,
  providerHealthTracker,
);
const testConnectionUseCase = new TestIntegrationProviderConnectionUseCase(
  providerEngine,
  providerHealthTracker,
);
const providerRuntimeDiagnosticsService = new ProviderRuntimeDiagnosticsService(
  providerHealthTracker,
);
const getProviderRuntimeSummaryUseCase = new GetProviderRuntimeSummaryUseCase(
  providerRuntimeDiagnosticsService,
);
const getProviderRuntimeIssuesUseCase = new GetProviderRuntimeIssuesUseCase(
  providerRuntimeDiagnosticsService,
);
const getProviderRuntimeDiagnosticsUseCase = new GetProviderRuntimeDiagnosticsUseCase(
  providerRuntimeDiagnosticsService,
);
const getProviderOperationsConsoleUseCase = new GetProviderOperationsConsoleUseCase(
  providerRuntimeDiagnosticsService,
);
const integrationsController = new IntegrationsController(
  testConnectionUseCase,
  listProposalsUseCase,
  listFinancialProposalsUseCase,
  getProviderPayloadDiagnosticsUseCase,
  listProviderCapabilitiesUseCase,
  testProviderMarginInquiryUseCase,
  testProviderInitialSimulationUseCase,
  getProviderRuntimeSummaryUseCase,
  getProviderRuntimeIssuesUseCase,
  getProviderRuntimeDiagnosticsUseCase,
  getProviderOperationsConsoleUseCase,
);

export const integrationsRoutes = createIntegrationsRoutes(
  integrationsController,
);

export { ProviderEngine } from './application/provider-engine.js';
export {
  ListProviderCapabilitiesUseCase,
} from './application/list-provider-capabilities.use-case.js';
export type {
  ProviderCatalogItem,
  ProviderCatalogStatus,
} from './application/list-provider-capabilities.use-case.js';
export {
  ProviderCapabilityRegistry,
  providerCapabilityRegistry,
} from './application/provider-capability-registry.js';
export type {
  CapabilitySupport,
  IntegrationProviderKey,
  ProviderCapabilities,
  ProviderCapabilityRegistryMap,
} from './application/provider-capability-registry.js';
export { ListIntegrationProviderProposalsUseCase } from './application/list-integration-provider-proposals.use-case.js';
export { ListFinancialProviderProposalsUseCase } from './application/list-financial-provider-proposals.use-case.js';
export { GetProviderPayloadDiagnosticsUseCase } from './application/get-provider-payload-diagnostics.use-case.js';
export { TestIntegrationProviderConnectionUseCase } from './application/test-integration-provider-connection.use-case.js';
export { TestIntegrationProviderMarginInquiryUseCase } from './application/test-integration-provider-margin-inquiry.use-case.js';
export { TestIntegrationProviderInitialSimulationUseCase } from './application/test-integration-provider-initial-simulation.use-case.js';
export type {
  IntegrationProposal,
  IntegrationProposalReader,
} from './domain/contracts/integration-proposal.contract.js';
export type {
  MarginInquiryInput,
  MarginInquiryResult,
  MarginInquiryProvider,
  RateTableFilters,
  RateTable,
  CoefficientEntry,
  RateTableProvider,
  ProposalCreateInput,
  ProposalRef,
  ProposalStatusResult,
  ProposalPipelineProvider,
  CommissionListFilters,
  CommissionEntry,
  CommissionSummary,
  CommissionProvider,
  CommissionPayoutInput,
  CommissionPayoutResult,
  CommissionPayoutProvider,
  FinancialExecutionContext,
  FinancialExecutionDecision,
  FinancialExecutionDiagnostics,
  FinancialExecutionPolicy,
  FinancialExecutionRiskLevel,
  FinancialExecutionStatus,
  FinancialExecutionType,
  DataEnrichmentInput,
  DataEnrichmentResult,
  DataEnrichmentProvider,
  MessageSendInput,
  MessageSendResult,
  MessageSenderProvider,
  BulkDispatchInput,
  BulkDispatchResult,
  BulkMessagingProvider,
  WebhookEvent,
  WebhookValidationInput,
  WebhookCapableProvider,
} from './domain/contracts/provider-capabilities.contract.js';
export {
  DefaultFinancialExecutionPolicy,
} from './domain/contracts/financial-execution.contract.js';
export type {
  MarginInquiryInput as MarginInquiryInputContract,
  MarginInquiryProvider as MarginInquiryProviderContract,
  MarginInquiryResult as MarginInquiryResultContract,
} from './domain/contracts/margin-inquiry.contract.js';
export type {
  CommissionPayoutInput as CommissionPayoutInputContract,
  CommissionPayoutProvider as CommissionPayoutProviderContract,
  CommissionPayoutResult as CommissionPayoutResultContract,
} from './domain/contracts/commission-payout.contract.js';
export type {
  WebhookCapableProvider as WebhookCapableProviderContract,
  WebhookEvent as WebhookEventContract,
  WebhookValidationInput as WebhookValidationInputContract,
} from './domain/contracts/webhook-capable.contract.js';
export {
  hasCommissionPayout,
  hasMarginInquiry,
  hasWebhookCapability,
} from './domain/contracts/provider-capability.guards.js';
export type {
  IntegrationConnectionStatus,
  IntegrationProvider,
} from './domain/contracts/provider.contract.js';
export { IntegrationError } from './domain/errors/integration.error.js';
export { ProviderCapabilityNotSupportedError } from './domain/errors/provider-capability-not-supported.error.js';
export { ProviderAuthenticationError } from './domain/errors/provider-authentication.error.js';
export { ProviderConfigurationError } from './domain/errors/provider-configuration.error.js';
export { ProviderConnectionError } from './domain/errors/provider-connection.error.js';
export { ProviderNotFoundError } from './domain/errors/provider-not-found.error.js';
export { ProviderRateLimitError } from './domain/errors/provider-rate-limit.error.js';
export { ProviderHttpClient } from './application/provider-http-client.js';
export type { ProviderExecutionContext } from './application/provider-execution-context.js';
export {
  sanitizeProviderError,
  sanitizeProviderHeaders,
  sanitizeProviderPayload,
  maskBankAccount,
  maskCnpj,
  maskCpf,
  maskPixKey,
} from './application/provider-sanitizer.js';
export { mapProviderError } from './application/provider-error-mapper.js';
export type { ProviderSafeErrorCode } from './application/provider-error-mapper.js';
export { ProviderRetryPolicy } from './application/provider-retry-policy.js';
export type {
  ProviderRetryDecision,
  ProviderRetryPolicyConfig,
} from './application/provider-retry-policy.js';
export { ProviderHealthTracker } from './application/provider-health-tracker.js';
export type {
  ProviderHealthSnapshot,
  ProviderHealthStatus,
} from './application/provider-health-tracker.js';
export {
  DefaultProviderIdempotencyContract,
} from './application/provider-idempotency-contract.js';
export type {
  ProviderIdempotencyContract,
  ProviderIdempotencyInput,
} from './application/provider-idempotency-contract.js';
export { TokenManager } from './application/token-manager.js';
export { GetProviderOperationsConsoleUseCase } from './application/get-provider-operations-console.use-case.js';
