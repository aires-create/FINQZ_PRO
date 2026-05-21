import Fastify from 'fastify';

import type { IntegrationConnectionStatus } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import type { IntegrationProposal } from '../../../modules/integrations/domain/contracts/integration-proposal.contract.js';
import { ProviderConfigurationError } from '../../../modules/integrations/domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../../modules/integrations/domain/errors/provider-not-found.error.js';
import type { ListIntegrationProviderProposalsUseCase } from '../../../modules/integrations/application/list-integration-provider-proposals.use-case.js';
import type { TestIntegrationProviderConnectionUseCase } from '../../../modules/integrations/application/test-integration-provider-connection.use-case.js';
import { IntegrationsController } from '../../../modules/integrations/presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from '../../../modules/integrations/presentation/http/integrations.routes.js';

type ExecuteResult = Promise<IntegrationConnectionStatus>;
type ExecuteHandler = (providerName: string) => ExecuteResult;
type ListProposalsHandler = (providerName: string) => Promise<IntegrationProposal[]>;

const createApp = async (
  execute: ExecuteHandler,
  listProposals: ListProposalsHandler = async () => [],
) => {
  const app = Fastify({
    logger: false,
  });
  const useCase = {
    execute,
  } as unknown as TestIntegrationProviderConnectionUseCase;
  const listProposalsUseCase = {
    execute: listProposals,
  } as unknown as ListIntegrationProviderProposalsUseCase;
  const controller = new IntegrationsController(useCase, listProposalsUseCase);

  await app.register(createIntegrationsRoutes(controller), {
    prefix: '/api/v1/integrations',
  });

  return app;
};

describe('IntegrationsController', () => {
  it('returns a consistent success payload', async () => {
    const app = await createApp(async (providerName) => {
      expect(providerName).toBe('nova-promotora');

      return {
        connected: true,
        status: 200,
      };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/nova-promotora/test',
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
      url: '/api/v1/integrations/providers/nova-promotora/test',
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_CONNECTION_ERROR',
        message: 'Integration provider connection failed: nova-promotora',
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
      url: '/api/v1/integrations/providers/nova-promotora/test',
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
        providerKey: 'nova-promotora',
        rawStatus: 'Aprovada',
      },
    ];
    const app = await createApp(
      async () => ({
        connected: true,
        status: 200,
      }),
      async (providerName) => {
        expect(providerName).toBe('nova-promotora');

        return proposals;
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/nova-promotora/proposals',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(proposals);

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
      url: '/api/v1/integrations/providers/nova-promotora/proposals',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'PROVIDER_CONFIGURATION_ERROR',
        message: 'Integration provider configuration is incomplete: nova-promotora',
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
      url: '/api/v1/integrations/providers/nova-promotora/proposals',
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
});
