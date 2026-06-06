import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JWTPayload } from '../../types/index.js';
import { generateAccessToken } from '../../utils/jwt.js';
import { createApp } from '../../app.js';

const sosBolsoClientMock = vi.hoisted(() => ({
  inquireSosBolsoMargin: vi.fn(),
  testSosBolsoConnection: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  securityEventLog: {
    create: vi.fn(),
  },
}));

vi.mock('../../modules/integrations/providers/sos-bolso/sos-bolso.client.js', () => ({
  inquireSosBolsoMargin: sosBolsoClientMock.inquireSosBolsoMargin,
  testSosBolsoConnection: sosBolsoClientMock.testSosBolsoConnection,
}));

vi.mock('../../database/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../core/prisma/client.js', () => ({
  // Transitional mock until Prisma runtime entrypoint is unified.
  prisma: prismaMock,
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

beforeEach(() => {
  prismaMock.user.findFirst.mockReset();
  prismaMock.securityEventLog.create.mockReset();
  prismaMock.user.findFirst.mockResolvedValue({
    id: 'user-1',
    tenantId: 'tenant-1',
    organizationId: null,
    partnerId: null,
    userRoles: [
      {
        role: {
          id: 'role-1',
          name: 'Admin',
          slug: 'admin',
          type: 'SYSTEM',
        },
      },
    ],
  });
  prismaMock.securityEventLog.create.mockResolvedValue(undefined);
});

afterEach(async () => {
  sosBolsoClientMock.inquireSosBolsoMargin.mockReset();
  sosBolsoClientMock.testSosBolsoConnection.mockReset();

  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('POST /api/v1/integrations/providers/sos-bolso/margin-inquiry/test', () => {
  it('requires authentication', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/integrations/providers/sos-bolso/margin-inquiry/test',
      payload: {
        cpf: '12345678901',
        metadata: {
          convenioCnpj: '12345678000190',
          enrollmentId: '98765',
        },
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns normalized provider payload for authenticated users with RBAC', async () => {
    sosBolsoClientMock.inquireSosBolsoMargin.mockResolvedValue({
      providerKey: 'sos-bolso',
      success: true,
      durationMs: 12,
      data: {
        providerKey: 'sos-bolso',
        availableMargin: 1250.5,
        currency: 'BRL',
      },
    });

    const server = await getApp();
    const token = generateAccessToken(basePayload);
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/integrations/providers/sos-bolso/margin-inquiry/test',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        document: '123.456.789-01',
        metadata: {
          convenioCnpj: '12.345.678/0001-90',
          enrollmentId: '98765',
          requestId: 'req-integration-1',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      providerKey: 'sos-bolso',
      availableMargin: 1250.5,
      currency: 'BRL',
    });
    expect(sosBolsoClientMock.inquireSosBolsoMargin).toHaveBeenCalledTimes(1);
  });
});
