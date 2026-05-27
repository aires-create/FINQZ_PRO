import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import type { JWTPayload } from '../../types/index.js';
import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';

let app: FastifyInstance | undefined;

const getApp = async () => {
  app = await createApp();
  await app.ready();
  return app;
};

const basePayload: Omit<JWTPayload, 'iat' | 'exp'> = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  roleId: 'role-1',
  role: 'admin',
  email: 'admin@finqz.com.br',
  permissions: ['tenant:read'],
};

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Provider Runtime Inspection API', () => {
  it('requires authentication on runtime summary endpoint', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/summary',
    });

    expect(response.statusCode).toBe(401);
  });

  it('enforces RBAC permission on runtime issues endpoint', async () => {
    const server = await getApp();
    const token = generateAccessToken({
      ...basePayload,
      permissions: [],
    });
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/issues',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('returns provider diagnostics for authenticated users with tenant:read', async () => {
    const server = await getApp();
    const token = generateAccessToken(basePayload);
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/runtime/providers/sos-bolso',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });
});
