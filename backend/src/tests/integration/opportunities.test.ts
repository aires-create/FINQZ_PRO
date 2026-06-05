import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

let app: FastifyInstance | undefined;

const basePayload: Omit<JWTPayload, 'iat' | 'exp'> = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  roleId: 'role-1',
  role: 'ROLE_ADMIN_SISTEMA',
  email: 'admin@finqz.com.br',
  permissions: [],
};

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

const getToken = (permissions: string[]) =>
  generateAccessToken({
    ...basePayload,
    permissions,
  });

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Opportunities routes registration and RBAC', () => {
  it('GET /api/v1/opportunities sem auth retorna 401 (e endpoint registrado)', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/opportunities',
    });

    expect(response.statusCode).toBe(401);
    expect(response.statusCode).not.toBe(404);
  });

  it('GET /api/v1/opportunities com auth mas sem opportunity:read retorna 403', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/opportunities',
      headers: {
        authorization: `Bearer ${getToken(['customer:read'])}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST /api/v1/opportunities sem opportunity:create retorna 403', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/opportunities',
      headers: {
        authorization: `Bearer ${getToken(['opportunity:read'])}`,
      },
      payload: {
        title: 'Opportunity Test',
        amount: 1000,
        pipelineId: '11111111-1111-1111-1111-111111111111',
        stageId: '22222222-2222-2222-2222-222222222222',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('PATCH /api/v1/opportunities/:id/stage sem opportunity:move_stage retorna 403', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'PATCH',
      url: '/api/v1/opportunities/11111111-1111-1111-1111-111111111111/stage',
      headers: {
        authorization: `Bearer ${getToken(['opportunity:update'])}`,
      },
      payload: {
        stageId: '22222222-2222-2222-2222-222222222222',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('DELETE /api/v1/opportunities/:id sem opportunity:delete retorna 403', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'DELETE',
      url: '/api/v1/opportunities/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: `Bearer ${getToken(['opportunity:read'])}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
