import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';

let app: FastifyInstance | undefined;

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('GET /health', () => {
  it('returns the API health contract without requiring database connectivity', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'http://localhost:5173',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(response.json()).toMatchObject({
      success: true,
      status: 'ok',
      service: 'FINQZ PRO API',
      environment: 'test',
    });
  });

  it('echoes a valid inbound request id', async () => {
    const server = await getApp();
    const requestId = 'test-request-123';
    const response = await server.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': requestId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe(requestId);
  });

  it('replaces an unsafe inbound request id', async () => {
    const server = await getApp();
    const unsafeRequestId = ' invalid request id ';
    const response = await server.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': unsafeRequestId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).not.toBe(unsafeRequestId);
  });
});
