import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import { hashPassword } from '../../utils/password.js';
import type { JWTPayload } from '../../types/index.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userRole: {
    findFirst: vi.fn(),
  },
  role: {
    findFirst: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
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

const buildTenantContextUser = () => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  organizationId: null,
  partnerId: null,
  userRoles: [
    {
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
      },
    },
  ],
});

const buildAuthLoginUser = (passwordHash: string) => ({
  id: 'reset-user-1',
  email: 'reset.user@finqz.com.br',
  emailNormalized: 'reset.user@finqz.com.br',
  password: passwordHash,
  firstName: 'Reset',
  lastName: 'User',
  isActive: true,
  tenantId: 'tenant-1',
  tenant: {
    id: 'tenant-1',
    name: 'FINQZ PRO',
    isActive: true,
  },
  userRoles: [
    {
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
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

beforeEach(() => {
  prismaMock.user.findMany.mockReset();
  prismaMock.user.findFirst.mockReset();
  prismaMock.user.create.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.userRole.findFirst.mockReset();
  prismaMock.role.findFirst.mockReset();
  prismaMock.refreshToken.create.mockReset();
  prismaMock.refreshToken.findUnique.mockReset();
  prismaMock.refreshToken.update.mockReset();
  prismaMock.refreshToken.updateMany.mockReset();
  prismaMock.auditLog.create.mockReset();
  prismaMock.securityEventLog.create.mockReset();
  prismaMock.user.findMany.mockResolvedValue(buildUsers());
  prismaMock.user.findFirst.mockImplementation(async (args?: {
    where?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }) => {
    const where = args?.where ?? {};
    const select = args?.select ?? {};

    if (
      where.id === 'user-1' &&
      where.tenantId === 'tenant-1' &&
      where.deletedAt === null &&
      where.isActive === true &&
      'organizationId' in select
    ) {
      return buildTenantContextUser();
    }

    if (
      where.id === 'user-1' &&
      where.tenantId === 'tenant-1' &&
      where.deletedAt === null &&
      'emailNormalized' in select
    ) {
      return {
        id: 'user-1',
        emailNormalized: 'admin@finqz.com.br',
      };
    }

    return null;
  });
  prismaMock.user.create.mockResolvedValue(buildCreatedUser());
  prismaMock.user.update.mockResolvedValue(buildCreatedUser());
  prismaMock.userRole.findFirst.mockResolvedValue({
    roleId: 'role-1',
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
  });
  prismaMock.role.findFirst.mockResolvedValue(buildRole());
  prismaMock.refreshToken.create.mockResolvedValue(undefined);
  prismaMock.refreshToken.findUnique.mockResolvedValue(null);
  prismaMock.refreshToken.update.mockResolvedValue(undefined);
  prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  prismaMock.auditLog.create.mockResolvedValue(undefined);
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

describe('PATCH /api/v1/users/:id/reset-password', () => {
  const resetUserId = 'reset-user-1';
  const resetUserEmail = 'reset.user@finqz.com.br';
  const actorPermissions = ['user:reset-password'];

  it('returns 401 without a token', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'PATCH',
      url: `/api/v1/users/${resetUserId}/reset-password`,
      payload: {
        newPassword: 'NewStrong123!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 without user:reset-password permission', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'PATCH',
      url: `/api/v1/users/${resetUserId}/reset-password`,
      headers: {
        authorization: `Bearer ${generateAccessToken({ ...basePayload, permissions: ['user:read'] })}`,
      },
      payload: {
        newPassword: 'NewStrong123!',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('returns 404 when the target user does not exist in the authenticated tenant', async () => {
    prismaMock.user.findFirst.mockImplementationOnce(async (args?: {
      where?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) => {
      const where = args?.where ?? {};
      const select = args?.select ?? {};

      if (
        where.id === 'user-1' &&
        where.tenantId === 'tenant-1' &&
        where.deletedAt === null &&
        where.isActive === true &&
        'organizationId' in select
      ) {
        return buildTenantContextUser();
      }

      return null;
    });

    const server = await getApp();
    const response = await server.inject({
      method: 'PATCH',
      url: `/api/v1/users/${resetUserId}/reset-password`,
      headers: {
        authorization: `Bearer ${generateAccessToken({ ...basePayload, permissions: actorPermissions })}`,
      },
      payload: {
        newPassword: 'NewStrong123!',
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('returns 400 when the new password is weak', async () => {
    prismaMock.user.findFirst.mockImplementation(async (args?: {
      where?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) => {
      const where = args?.where ?? {};
      const select = args?.select ?? {};

      if (
        where.id === 'user-1' &&
        where.tenantId === 'tenant-1' &&
        where.deletedAt === null &&
        where.isActive === true &&
        'organizationId' in select
      ) {
        return buildTenantContextUser();
      }

      if (where.id === resetUserId && where.tenantId === 'tenant-1' && where.deletedAt === null) {
        return {
          id: resetUserId,
          email: resetUserEmail,
        };
      }

      return null;
    });

    const server = await getApp();
    const response = await server.inject({
      method: 'PATCH',
      url: `/api/v1/users/${resetUserId}/reset-password`,
      headers: {
        authorization: `Bearer ${generateAccessToken({ ...basePayload, permissions: actorPermissions })}`,
      },
      payload: {
        newPassword: 'weakpass',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'New password does not meet requirements',
    });
  });

  it('resets the password, revokes refresh tokens, and allows login only with the new password', async () => {
    let activePasswordHash = await hashPassword('OldStrong123!');
    const refreshTokenStore = new Map<string, {
      token: string;
      userId: string;
      expiresAt: Date;
      revokedAt: Date | null;
      revokedReason: string | null;
    }>();

    prismaMock.user.findFirst.mockImplementation(async (args?: {
      where?: Record<string, unknown>;
      select?: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => {
      const where = args?.where ?? {};
      const select = args?.select ?? {};
      const include = args?.include ?? {};

      if (
        where.id === 'user-1' &&
        where.tenantId === 'tenant-1' &&
        where.deletedAt === null &&
        where.isActive === true &&
        'organizationId' in select
      ) {
        return buildTenantContextUser();
      }

      if (where.id === resetUserId && where.tenantId === 'tenant-1' && where.deletedAt === null) {
        return {
          id: resetUserId,
          email: resetUserEmail,
        };
      }

      if (where.emailNormalized === resetUserEmail && 'tenant' in include && 'userRoles' in include) {
        return buildAuthLoginUser(activePasswordHash);
      }

      return null;
    });

    prismaMock.user.update.mockImplementation(async (args?: {
      where?: Record<string, unknown>;
      data?: Record<string, unknown>;
    }) => {
      const nextPassword = args?.data?.password;
      if (typeof nextPassword === 'string') {
        activePasswordHash = nextPassword;
        return { id: resetUserId };
      }

      return buildCreatedUser();
    });

    prismaMock.userRole.findFirst.mockResolvedValue({
      roleId: 'role-1',
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
        rolePermissions: [
          { permission: { slug: 'user:reset-password' } },
          { permission: { slug: 'customer:read' } },
        ],
      },
    });

    prismaMock.refreshToken.create.mockImplementation(async (args?: {
      data?: {
        token: string;
        userId: string;
        expiresAt: Date;
      };
    }) => {
      const data = args?.data;
      if (data) {
        refreshTokenStore.set(data.token, {
          token: data.token,
          userId: data.userId,
          expiresAt: data.expiresAt,
          revokedAt: null,
          revokedReason: null,
        });
      }
      return undefined;
    });

    prismaMock.refreshToken.updateMany.mockImplementation(async (args?: {
      where?: { userId?: string; revokedAt?: null };
      data?: { revokedAt?: Date; revokedReason?: string };
    }) => {
      let count = 0;
      for (const token of refreshTokenStore.values()) {
        if (token.userId === args?.where?.userId && token.revokedAt === null) {
          token.revokedAt = args?.data?.revokedAt ?? new Date();
          token.revokedReason = args?.data?.revokedReason ?? null;
          count += 1;
        }
      }
      return { count };
    });

    prismaMock.refreshToken.findUnique.mockImplementation(async (args?: {
      where?: { token?: string };
    }) => {
      const token = args?.where?.token;
      return token ? refreshTokenStore.get(token) ?? null : null;
    });

    prismaMock.refreshToken.update.mockImplementation(async (args?: {
      where?: { token?: string };
      data?: { revokedAt?: Date; revokedReason?: string };
    }) => {
      const tokenKey = args?.where?.token;
      if (!tokenKey) {
        return undefined;
      }

      const token = refreshTokenStore.get(tokenKey);
      if (token) {
        token.revokedAt = args?.data?.revokedAt ?? new Date();
        token.revokedReason = args?.data?.revokedReason ?? null;
      }

      return undefined;
    });

    const server = await getApp();

    const oldLogin = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: resetUserEmail,
        password: 'OldStrong123!',
      },
    });

    expect(oldLogin.statusCode).toBe(200);
    const oldRefreshToken = oldLogin.json().data.tokens.refreshToken as string;

    const resetResponse = await server.inject({
      method: 'PATCH',
      url: `/api/v1/users/${resetUserId}/reset-password`,
      headers: {
        authorization: `Bearer ${generateAccessToken({ ...basePayload, permissions: actorPermissions })}`,
      },
      payload: {
        newPassword: 'NewStrong123!',
      },
    });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.json()).toEqual({
      success: true,
      message: 'Password reset successfully',
    });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: resetUserId,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
        revokedReason: 'Password reset by administrator',
      },
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalled();

    const oldPasswordLogin = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: resetUserEmail,
        password: 'OldStrong123!',
      },
    });

    expect(oldPasswordLogin.statusCode).toBe(401);

    const newPasswordLogin = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: resetUserEmail,
        password: 'NewStrong123!',
      },
    });

    expect(newPasswordLogin.statusCode).toBe(200);

    const refreshResponse = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: oldRefreshToken,
      },
    });

    expect(refreshResponse.statusCode).toBe(401);
  });
});
