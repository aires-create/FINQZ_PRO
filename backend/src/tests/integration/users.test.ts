import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  role: {
    findFirst: vi.fn(),
  },
  securityEventLog: {
    create: vi.fn(),
  },
}));

vi.mock('../../database/prisma.js', () => ({
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

const buildUsers = () => [
  {
    id: 'user-1',
    email: 'admin@finqz.com.br',
    firstName: 'Admin',
    lastName: 'Sistema',
    isActive: true,
    tenantId: 'tenant-1',
    createdAt: new Date('2026-05-24T00:00:00.000Z'),
    updatedAt: new Date('2026-05-24T12:00:00.000Z'),
    userRoles: [
      {
        role: {
          id: 'role-1',
          name: 'Admin Sistema',
          slug: 'ROLE_ADMIN_SISTEMA',
          type: 'SYSTEM',
          rolePermissions: [
            { permission: { slug: 'USUARIOS_VIEW' } },
            { permission: { slug: 'PERMISSOES_VIEW' } },
          ],
        },
      },
    ],
  },
];

const buildRole = () => ({
  id: 'role-1',
  name: 'Admin Sistema',
  slug: 'ROLE_ADMIN_SISTEMA',
  type: 'SYSTEM',
});

const buildCreatedUser = () => buildUsers()[0];

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

const getValidToken = () => generateAccessToken(basePayload);

beforeEach(() => {
  prismaMock.user.findMany.mockReset();
  prismaMock.user.findFirst.mockReset();
  prismaMock.user.create.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.role.findFirst.mockReset();
  prismaMock.securityEventLog.create.mockReset();
  prismaMock.user.findMany.mockResolvedValue(buildUsers());
  prismaMock.user.findFirst.mockResolvedValue(null);
  prismaMock.user.create.mockResolvedValue(buildCreatedUser());
  prismaMock.user.update.mockResolvedValue(buildCreatedUser());
  prismaMock.role.findFirst.mockResolvedValue(buildRole());
  prismaMock.securityEventLog.create.mockResolvedValue(undefined);
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('GET /api/v1/users', () => {
  it('returns 200 with a valid JWT token and safe user payloads', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${getValidToken()}`,
      },
    });

    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      data: [
        {
          id: 'user-1',
          email: 'admin@finqz.com.br',
          firstName: 'Admin',
          lastName: 'Sistema',
          isActive: true,
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
      ],
    });
    expect(payload.data[0]).not.toHaveProperty('password');
    expect(payload.data[0]).not.toHaveProperty('senha');
    expect(payload.data[0]).toHaveProperty('createdAt');
    expect(payload.data[0]).toHaveProperty('updatedAt');
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('returns 401 without a token', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/users',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /api/v1/users', () => {
  it('creates a user with the authenticated tenant and returns a safe payload', async () => {
    const server = await getApp();
    const rawPassword = 'StrongPass123!';
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${getValidToken()}`,
      },
      payload: {
        email: 'new.user@finqz.com.br',
        password: rawPassword,
        firstName: 'Novo',
        lastName: 'Usuário',
        role: 'ROLE_ADMIN_SISTEMA',
      },
    });

    const payload = response.json();
    const createArgs = prismaMock.user.create.mock.calls[0]?.[0];

    expect(response.statusCode).toBe(201);
    expect(payload).toMatchObject({
      success: true,
      data: {
        id: 'user-1',
        email: 'admin@finqz.com.br',
        firstName: 'Admin',
        lastName: 'Sistema',
        isActive: true,
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
    });
    expect(payload.data).not.toHaveProperty('password');
    expect(payload.data).not.toHaveProperty('senha');
    expect(createArgs.data.email).toBe('new.user@finqz.com.br');
    expect(createArgs.data.emailNormalized).toBe('new.user@finqz.com.br');
    expect(createArgs.data.password).not.toBe(rawPassword);
    expect(createArgs.data.tenant.connect.id).toBe('tenant-1');
    expect(createArgs.data.userRoles.create.role.connect.id).toBe('role-1');
    expect(prismaMock.role.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        OR: [
          { slug: 'ROLE_ADMIN_SISTEMA' },
          { name: 'ROLE_ADMIN_SISTEMA' },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });
  });
});

describe('PUT /api/v1/users/:id', () => {
  it('updates firstName, lastName, email and isActive and returns a safe payload', async () => {
    const server = await getApp();
    const updatedUser = {
      ...buildCreatedUser(),
      email: 'updated.user@finqz.com.br',
      firstName: 'Atualizado',
      lastName: 'Usuário',
      isActive: false,
    };

    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      emailNormalized: 'admin@finqz.com.br',
    });
    prismaMock.user.update.mockResolvedValueOnce(updatedUser);

    const response = await server.inject({
      method: 'PUT',
      url: '/api/v1/users/user-1',
      headers: {
        authorization: `Bearer ${getValidToken()}`,
      },
      payload: {
        email: 'updated.user@finqz.com.br',
        firstName: 'Atualizado',
        lastName: 'Usuário',
        isActive: false,
      },
    });

    const payload = response.json();
    const updateArgs = prismaMock.user.update.mock.calls[0]?.[0];

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      message: 'User updated successfully',
      data: {
        id: 'user-1',
        email: 'updated.user@finqz.com.br',
        firstName: 'Atualizado',
        lastName: 'Usuário',
        isActive: false,
        tenantId: 'tenant-1',
      },
    });
    expect(payload.data).not.toHaveProperty('password');
    expect(payload.data).not.toHaveProperty('senha');
    expect(updateArgs.where).toEqual({
      id: 'user-1',
    });
    expect(updateArgs.data).toEqual({
      email: 'updated.user@finqz.com.br',
      emailNormalized: 'updated.user@finqz.com.br',
      firstName: 'Atualizado',
      lastName: 'Usuário',
      isActive: false,
    });
  });

  it('returns 404 when the user does not exist in the authenticated tenant', async () => {
    const server = await getApp();
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const response = await server.inject({
      method: 'PUT',
      url: '/api/v1/users/user-missing',
      headers: {
        authorization: `Bearer ${getValidToken()}`,
      },
      payload: {
        firstName: 'Novo nome',
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
