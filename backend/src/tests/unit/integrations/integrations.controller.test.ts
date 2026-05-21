import Fastify from 'fastify';

import type { IntegrationConnectionStatus } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../../modules/integrations/domain/errors/provider-not-found.error.js';
import type { TestIntegrationProviderConnectionUseCase } from '../../../modules/integrations/application/test-integration-provider-connection.use-case.js';
import { IntegrationsController } from '../../../modules/integrations/presentation/http/integrations.controller.js';
import { createIntegrationsRoutes } from '../../../modules/integrations/presentation/http/integrations.routes.js';

type ExecuteResult = Promise<IntegrationConnectionStatus>;
type ExecuteHandler = (providerName: string) => ExecuteResult;

const createApp = async (execute: ExecuteHandler) => {
  const app = Fastify({
    logger: false,
  });
  const useCase = {
    execute,
  } as unknown as TestIntegrationProviderConnectionUseCase;
  const controller = new IntegrationsController(useCase);

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
});
