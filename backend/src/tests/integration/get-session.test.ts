import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

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

const basePayload: Omit<JWTPayload, 'iat' | 'exp'> = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  roleId: 'role-1',
  role: 'ROLE_ADMIN_SISTEMA',
  email: 'admin@finqz.com.br',
  permissions: ['USUARIOS_VIEW', 'PERMISSOES_VIEW'],
};

const buildSessionUser = () => ({
  id: 'user-1',
  email: 'admin@finqz.com.br',
  firstName: 'Admin',
  lastName: 'Sistema',
  tenantId: 'tenant-1',
  tenant: {
    id: 'tenant-1',
    name: 'FINQZ PRO',
    isActive: true,
  },
  userRoles: [
    {
      roleId: 'role-1',
      assignedAt: new Date('2026-05-24T00:00:00.000Z'),
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
        rolePermissions: [
          {
            permission: {
              slug: 'USUARIOS_VIEW',
            },
          },
          {
            permission: {
              slug: 'PERMISSOES_VIEW',
            },
          },
        ],
      },
    },
  ],
});

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

const getValidToken = () => generateAccessToken(basePayload);

const getExpiredToken = () =>
  jwt.sign(
    {
      ...basePayload,
      exp: Math.floor(Date.now() / 1000) - 60,
    },
    process.env.JWT_SECRET ?? '',
    { noTimestamp: true },
  );

beforeEach(() => {
  prismaMock.user.findFirst.mockReset();
  prismaMock.securityEventLog.create.mockReset();
  prismaMock.user.findFirst.mockResolvedValue(buildSessionUser());
  prismaMock.securityEventLog.create.mockResolvedValue(undefined);
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('GET /api/v1/get-session', () => {
  it('returns 200 with a valid JWT token and a safe session payload', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/get-session',
      headers: {
        authorization: `Bearer ${getValidToken()}`,
      },
    });

    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      data: {
        user: {
          id: 'user-1',
          email: 'admin@finqz.com.br',
          tenantId: 'tenant-1',
          roles: [
            {
              id: 'role-1',
              name: 'Admin Sistema',
              slug: 'ROLE_ADMIN_SISTEMA',
              type: 'SYSTEM',
            },
          ],
          permissions: ['USUARIOS_VIEW', 'PERMISSOES_VIEW'],
        },
      },
    });
    expect(payload.data.user).not.toHaveProperty('password');
    expect(payload.data.user).not.toHaveProperty('senha');
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        deletedAt: null,
      },
      select: expect.any(Object),
    });
  });

  it('returns 401 without a token', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/get-session',
    });

    const payload = response.json();

    expect(response.statusCode).toBe(401);
    expect(payload).toMatchObject({
      message: 'Invalid or expired access token',
    });
  });

  it.each([
    ['invalid', 'Bearer invalid.token.value'],
    ['expired', `Bearer ${getExpiredToken()}`],
  ])('returns 401 with a %s token', async (_label, authorization) => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/get-session',
      headers: {
        authorization,
      },
    });

    const payload = response.json();

    expect(response.statusCode).toBe(401);
    expect(payload).toMatchObject({
      message: 'Invalid or expired access token',
    });
  });
});
