import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JWTPayload } from '../../types/index.js';
import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';

const novaPromotoraClientMock = vi.hoisted(() => ({
  listNovaPromotoraProposals: vi.fn(),
  testNovaPromotoraConnection: vi.fn(),
}));

vi.mock('../../modules/integrations/providers/nova-promotora/nova-promotora.client.js', () => ({
  listNovaPromotoraProposals: novaPromotoraClientMock.listNovaPromotoraProposals,
  testNovaPromotoraConnection: novaPromotoraClientMock.testNovaPromotoraConnection,
}));

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
  novaPromotoraClientMock.listNovaPromotoraProposals.mockReset();
  novaPromotoraClientMock.testNovaPromotoraConnection.mockReset();
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('GET /api/v1/integrations/providers/:providerKey/payload-diagnostics', () => {
  it('returns 401 without authentication', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/nova-promotora/payload-diagnostics',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 without tenant:read permission', async () => {
    const server = await getApp();
    const token = generateAccessToken({
      ...basePayload,
      permissions: [],
    });
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/nova-promotora/payload-diagnostics',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('returns 200 for authenticated users with tenant:read', async () => {
    novaPromotoraClientMock.listNovaPromotoraProposals.mockResolvedValue({
      providerKey: 'nova-promotora',
      success: true,
      externalStatus: 'available',
      statusCode: 200,
      durationMs: 10,
      data: {
        propostas: [
          {
            id: 'PROP-1',
            cpf: '12345678900',
            status: 'LIBERADA',
          },
        ],
      },
    });

    const server = await getApp();
    const token = generateAccessToken(basePayload);
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/integrations/providers/nova-promotora/payload-diagnostics',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        providerKey: 'nova-promotora',
      },
    });
  });
});
