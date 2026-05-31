import Fastify from 'fastify';

import type { IntegrationConnectionStatus } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import type { IntegrationProposal } from '../../../modules/integrations/domain/contracts/integration-proposal.contract.js';
import { ProviderConfigurationError } from '../../../modules/integrations/domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../../modules/integrations/domain/errors/provider-not-found.error.js';
import type { ListIntegrationProviderProposalsUseCase } from '../../../modules/integrations/application/list-integration-provider-proposals.use-case.js';
import type { ListFinancialProviderProposalsUseCase } from '../../../modules/integrations/application/list-financial-provider-proposals.use-case.js';
import type { GetProviderPayloadDiagnosticsUseCase } from '../../../modules/integrations/application/get-provider-payload-diagnostics.use-case.js';
import type { GetProviderRuntimeDiagnosticsUseCase } from '../../../modules/integrations/application/get-provider-runtime-diagnostics.use-case.js';
import type { GetProviderRuntimeIssuesUseCase } from '../../../modules/integrations/application/get-provider-runtime-issues.use-case.js';
import type { GetProviderRuntimeSummaryUseCase } from '../../../modules/integrations/application/get-provider-runtime-summary.use-case.js';
import type { TestIntegrationProviderConnectionUseCase } from '../../../modules/integrations/application/test-integration-provider-connection.use-case.js';
import type { TestIntegrationProviderMarginInquiryUseCase } from '../../../modules/integrations/application/test-integration-provider-margin-inquiry.use-case.js';
import { IntegrationsController } from '../../../modules/integrations/presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from '../../../modules/integrations/presentation/http/integrations.routes.js';
import type { FinancialProposal } from '../../../modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.js';

type ExecuteResult = Promise<IntegrationConnectionStatus>;
type ExecuteHandler = (providerName: string) => ExecuteResult;
type ListProposalsHandler = (providerName: string) => Promise<IntegrationProposal[]>;
type ListFinancialProposalsHandler = (providerName: string) => Promise<FinancialProposal[]>;

const createApp = async (
  execute: ExecuteHandler,
  listProposals: ListProposalsHandler = async () => [],
  testMarginInquiry: (providerName: string, input: { document: string; metadata: { convenioCnpj: string; enrollmentId: string; requestId?: string } }) => Promise<any> = async () => ({
    providerKey: 'sos-bolso',
    availableMargin: 0,
  }),
  runtimeSummary: () => any = () => ({
    generatedAt: new Date('2026-05-27T00:00:00.000Z'),
    totalProviders: 0,
    healthy: 0,
    degraded: 0,
    down: 0,
    disabled: 0,
  }),
  runtimeIssues: () => any = () => [],
  runtimeDiagnostics: (providerKey?: string) => any = (_providerKey?: string) => [],
  listFinancialProposals: ListFinancialProposalsHandler = async () => [],
  payloadDiagnostics: (providerKey: string) => Promise<unknown> = async () => ({}),
  listCapabilities: (scope?: 'all' | 'runtime' | 'planned') => any[] = () => [],
) => {
  const app = Fastify({
    logger: false,
  });
  app.decorateRequest('currentUser', null);
  app.decorateRequest('currentTenant', null);
  app.decorateRequest('jwtVerify', async () => ({
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'admin',
    permissions: ['tenant:read'],
  }));
  const useCase = {
    execute,
  } as unknown as TestIntegrationProviderConnectionUseCase;
  const listProposalsUseCase = {
    execute: listProposals,
  } as unknown as ListIntegrationProviderProposalsUseCase;
  const listFinancialProposalsUseCase = {
    execute: listFinancialProposals,
  } as unknown as ListFinancialProviderProposalsUseCase;
  const payloadDiagnosticsUseCase = {
    execute: payloadDiagnostics,
  } as unknown as GetProviderPayloadDiagnosticsUseCase;
  const marginInquiryUseCase = {
    execute: testMarginInquiry,
  } as unknown as TestIntegrationProviderMarginInquiryUseCase;
  const runtimeSummaryUseCase = {
    execute: runtimeSummary,
  } as unknown as GetProviderRuntimeSummaryUseCase;
  const runtimeIssuesUseCase = {
    execute: runtimeIssues,
  } as unknown as GetProviderRuntimeIssuesUseCase;
  const runtimeDiagnosticsUseCase = {
    execute: runtimeDiagnostics,
  } as unknown as GetProviderRuntimeDiagnosticsUseCase;
  const controller = new IntegrationsController(
  useCase,
  listProposalsUseCase,
  listFinancialProposalsUseCase,
  payloadDiagnosticsUseCase,
  { execute: listCapabilities } as any,
  marginInquiryUseCase,
  { execute: async () => ({}) } as any,
  runtimeSummaryUseCase,
  runtimeIssuesUseCase,
  runtimeDiagnosticsUseCase,
  { execute: () => ({}) } as any,
);

  await app.register(createIntegrationsRoutes(controller), {
    prefix: '/api/v1/integrations',
  });

  return app;
};

describe('IntegrationsController', () => {
  it('returns catalog with optional runtime scope', async () => {
    const listCapabilitiesSpy = vi.fn((scope?: 'all' | 'runtime' | 'planned') => {
      expect(scope).toBe('runtime');
      return [
        {
          providerKey: 'sos-bolso',
          displayName: 'SOS BOLSO',
          category: 'credito',
          status: 'active',
          capabilities: {
            initialSimulation: false,
            marginInquiry: 'planned',
            rateTables: 'planned',
            proposalPipeline: 'planned',
            commissions: 'planned',
            commissionPayout: false,
            dataEnrichment: 'planned',
            messageSender: false,
            bulkMessaging: false,
            webhooks: 'planned',
          },
        },
      ];
    });
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      () => [],
      async () => [],
      async () => ({}),
      listCapabilitiesSpy,
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/capabilities?scope=runtime',
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
    expect(listCapabilitiesSpy).toHaveBeenCalledWith('runtime');

    await app.close();
  });

  it('returns a consistent success payload', async () => {
    const app = await createApp(async (providerName) => {
      expect(providerName).toBe('sos-bolso');

      return {
        connected: true,
        status: 200,
      };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      connected: true,
      status: 200,
    });

    await app.close();
  });

  it('maps provider not found errors to a controlled 404 payload', async () => {
    const app = await createApp(async (providerName) => {
      throw new ProviderNotFoundError(providerName);
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/missing-provider/test',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_NOT_FOUND',
        message: 'Integration provider not found: missing-provider',
      },
    });

    await app.close();
  });

  it('maps provider connection errors to a controlled 502 payload', async () => {
    const app = await createApp(async (providerName) => {
      throw new ProviderConnectionError(providerName);
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/test',
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_CONNECTION_ERROR',
        message: 'Integration provider connection failed: sos-bolso',
      },
    });

    await app.close();
  });

  it('maps unexpected errors to a controlled 500 payload without stack trace', async () => {
    const app = await createApp(async () => {
      throw new Error('raw provider stack detail');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/test',
    });
    const payload = response.json();

    expect(response.statusCode).toBe(500);
    expect(payload).toEqual({
      success: false,
      error: {
        code: 'INTEGRATION_UNEXPECTED_ERROR',
        message: 'Unexpected integration error',
      },
    });
    expect(JSON.stringify(payload)).not.toContain('stack');
    expect(JSON.stringify(payload)).not.toContain('raw provider stack detail');

    await app.close();
  });

  it('returns normalized proposals from the proposal endpoint', async () => {
    const proposals: IntegrationProposal[] = [
      {
        externalId: 'PROP-1',
        customerName: 'Maria Silva',
        document: '12345678900',
        status: 'approved',
        amount: 1500,
        createdAt: '2026-05-21T00:00:00.000Z',
        providerKey: 'sos-bolso',
        rawStatus: 'Aprovada',
      },
    ];
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async (providerName) => {
        expect(providerName).toBe('sos-bolso');

        return proposals;
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/proposals',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(proposals);

    await app.close();
  });

  it('returns canonical financial proposals from the parallel endpoint', async () => {
    const financialProposals: FinancialProposal[] = [
      {
        proposalId: 'proposal-1',
        providerKey: 'sos-bolso',
        externalProposalId: 'PROP-1',
        customerDocument: '12345678900',
        bank: 'BANCO PAN',
        product: 'CONSIGNADO',
        status: 'APPROVED',
      },
    ];
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      () => [],
      async (providerName) => {
        expect(providerName).toBe('sos-bolso');
        return financialProposals;
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/financial-proposals',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: financialProposals,
    });

    await app.close();
  });

  it('maps financial proposal endpoint unexpected errors without leaking stack', async () => {
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      () => [],
      async () => {
        throw new Error('raw stack secret');
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/financial-proposals',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTEGRATION_UNEXPECTED_ERROR',
        message: 'Unexpected integration error',
      },
    });

    await app.close();
  });

  it('returns payload diagnostics from parallel endpoint', async () => {
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      () => [],
      async () => [],
      async (providerKey: string) => {
        expect(providerKey).toBe('sos-bolso');
        return {
          providerKey: 'sos-bolso',
          totalRecords: 1,
          validRecords: 1,
          invalidRecords: 0,
          issues: [],
          unknownStatuses: [],
        };
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/payload-diagnostics',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: {
        providerKey: 'sos-bolso',
        totalRecords: 1,
        validRecords: 1,
        invalidRecords: 0,
        issues: [],
        unknownStatuses: [],
      },
    });

    await app.close();
  });

  it('maps payload diagnostics endpoint unexpected errors without leaking stack', async () => {
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      () => [],
      async () => [],
      async () => {
        throw new Error('raw payload token=secret stack detail');
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/payload-diagnostics',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTEGRATION_UNEXPECTED_ERROR',
        message: 'Unexpected integration error',
      },
    });
    expect(JSON.stringify(response.json())).not.toContain('secret');
    expect(JSON.stringify(response.json())).not.toContain('stack detail');

    await app.close();
  });

  it('maps unknown providers on the proposal endpoint to 404', async () => {
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async (providerName) => {
        throw new ProviderNotFoundError(providerName);
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/missing-provider/proposals',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_NOT_FOUND',
        message: 'Integration provider not found: missing-provider',
      },
    });

    await app.close();
  });

  it('maps proposal provider configuration errors to a controlled payload', async () => {
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async (providerName) => {
        throw new ProviderConfigurationError(providerName);
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/proposals',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_CONFIGURATION_ERROR',
        message: 'Integration provider configuration is incomplete: sos-bolso',
      },
    });

    await app.close();
  });

  it('does not leak raw proposal errors through the proposal endpoint', async () => {
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async () => {
        throw new Error('raw token=secret body={sensitive} stack detail');
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/sos-bolso/proposals',
    });
    const payload = response.json();

    expect(response.statusCode).toBe(500);
    expect(payload).toEqual({
      success: false,
      error: {
        code: 'INTEGRATION_UNEXPECTED_ERROR',
        message: 'Unexpected integration error',
      },
    });
    expect(JSON.stringify(payload)).not.toContain('secret');
    expect(JSON.stringify(payload)).not.toContain('sensitive');
    expect(JSON.stringify(payload)).not.toContain('stack detail');

    await app.close();
  });

  it('returns normalized margin inquiry payload from test endpoint', async () => {
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async () => [],
      async (providerName, input) => {
        expect(providerName).toBe('sos-bolso');
        expect(input).toEqual({
          document: '12345678901',
          metadata: {
            convenioCnpj: '12345678000190',
            enrollmentId: '98765',
          },
        });

        return {
          providerKey: 'sos-bolso',
          availableMargin: 1250.5,
          currency: 'BRL',
        };
      },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/integrations/providers/sos-bolso/margin-inquiry/test',
      payload: {
        cpf: '123.456.789-01',
        metadata: {
          convenioCnpj: '12.345.678/0001-90',
          enrollmentId: '98765',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      providerKey: 'sos-bolso',
      availableMargin: 1250.5,
      currency: 'BRL',
    });

    await app.close();
  });

  it('returns 400 when margin inquiry payload is invalid', async () => {
    const app = await createApp(async () => ({
      connected: true,
      status: 200,
    }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/integrations/providers/sos-bolso/margin-inquiry/test',
      payload: {
        cpf: '123',
        metadata: {
          convenioCnpj: '456',
          enrollmentId: '',
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTEGRATION_VALIDATION_ERROR',
        message: 'Invalid margin inquiry payload',
      },
    });

    await app.close();
  });

  it('returns runtime summary payload', async () => {
    const app = await createApp(
  async () => ({ connected: true, status: 200 }),
  async () => [],
  async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
  () => ({
    generatedAt: new Date('2026-05-27T00:00:00.000Z'),
    totalProviders: 3,
    healthy: 2,
    degraded: 1,
    down: 0,
    disabled: 0,
  }),
);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/summary',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      totalProviders: 3,
      healthy: 2,
      degraded: 1,
    });

    await app.close();
  });

  it('returns runtime issues payload', async () => {
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => ([
        {
          providerKey: 'sos-bolso',
          capability: 'marginInquiry',
          status: 'degraded',
        },
      ]),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/issues',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        providerKey: 'sos-bolso',
        capability: 'marginInquiry',
        status: 'degraded',
      },
    ]);

    await app.close();
  });

  it('returns runtime diagnostics for a specific provider', async () => {
    const diagnosticsSpy = vi.fn((providerKey?: string) => {
      expect(providerKey).toBe('sos-bolso');
      return [
        {
          providerKey: 'sos-bolso',
          capability: 'marginInquiry',
          health: { status: 'ok' },
        },
      ];
    });
    const app = await createApp(
      async () => ({ connected: true, status: 200 }),
      async () => [],
      async () => ({ providerKey: 'sos-bolso', availableMargin: 0 }),
      () => ({
        generatedAt: new Date('2026-05-27T00:00:00.000Z'),
        totalProviders: 0,
        healthy: 0,
        degraded: 0,
        down: 0,
        disabled: 0,
      }),
      () => [],
      diagnosticsSpy,
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/providers/sos-bolso',
    });

    expect(response.statusCode).toBe(200);
    expect(diagnosticsSpy).toHaveBeenCalledWith('sos-bolso');
    expect(response.json()).toEqual([
      {
        providerKey: 'sos-bolso',
        capability: 'marginInquiry',
        health: { status: 'ok' },
      },
    ]);

    await app.close();
  });
});
