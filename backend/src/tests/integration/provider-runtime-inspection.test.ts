import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JWTPayload } from '../../types/index.js';
import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  securityEventLog: {
    create: vi.fn(),
  },
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
