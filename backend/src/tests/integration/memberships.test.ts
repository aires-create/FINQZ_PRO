import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  membership: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  organization: {
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
  userId: '11111111-1111-1111-1111-111111111111',
  tenantId: 'tenant-1',
  roleId: 'role-1',
  role: 'ROLE_ADMIN_SISTEMA',
  email: 'admin@finqz.com.br',
  permissions: ['membership:create'],
};

const buildTenantContextUser = (overrides?: Partial<{
  id: string;
  tenantId: string;
  organizationId: string | null;
  partnerId: string | null;
  roleSlug: string;
  roleName: string;
  roleType: string;
}>) => ({
  id: overrides?.id ?? '11111111-1111-1111-1111-111111111111',
  tenantId: overrides?.tenantId ?? 'tenant-1',
  organizationId: overrides?.organizationId ?? null,
  partnerId: overrides?.partnerId ?? null,
  userRoles: [
    {
      role: {
        id: 'role-1',
        name: overrides?.roleName ?? 'Admin Sistema',
        slug: overrides?.roleSlug ?? 'ROLE_ADMIN_SISTEMA',
        type: overrides?.roleType ?? 'SYSTEM',
      },
    },
  ],
});

const buildTargetUser = () => ({
  id: '22222222-2222-2222-2222-222222222222',
  tenantId: 'tenant-1',
  isActive: true,
  deletedAt: null,
  organizationId: null,
});

const buildOrganization = () => ({
  id: '33333333-3333-3333-3333-333333333333',
  tenantId: 'tenant-1',
  isActive: true,
  deletedAt: null,
});

const buildMembership = () => ({
  id: '44444444-4444-4444-4444-444444444444',
  tenantId: 'tenant-1',
  userId: '22222222-2222-2222-2222-222222222222',
  organizationId: '33333333-3333-3333-3333-333333333333',
  role: 'manager',
  permissions: {},
  isActive: true,
  joinedAt: new Date('2026-06-06T12:00:00.000Z'),
  invitedAt: null,
  invitedById: '11111111-1111-1111-1111-111111111111',
  createdAt: new Date('2026-06-06T12:00:00.000Z'),
  updatedAt: new Date('2026-06-06T12:00:00.000Z'),
  user: {
    id: '22222222-2222-2222-2222-222222222222',
    firstName: 'Gestor',
    lastName: 'Comercial',
    email: 'gestor@finqz.com.br',
    phone: null,
    jobTitle: null,
    isActive: true,
  },
  organization: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Sales & Marketing',
    code: 'SALES',
    type: 'department',
    level: 1,
    parent: null,
  },
  invitedBy: {
    id: '11111111-1111-1111-1111-111111111111',
    firstName: 'Admin',
    lastName: 'Sistema',
    email: 'admin@finqz.com.br',
  },
});

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

const getToken = (permissions = ['membership:create']) =>
  generateAccessToken({
    ...basePayload,
    permissions,
  });

beforeEach(() => {
  prismaMock.user.findFirst.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.membership.findUnique.mockReset();
  prismaMock.membership.create.mockReset();
  prismaMock.membership.update.mockReset();
  prismaMock.organization.findFirst.mockReset();
  prismaMock.securityEventLog.create.mockReset();

  prismaMock.user.findFirst.mockImplementation(async (args?: {
    where?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }) => {
    const where = args?.where ?? {};
    const select = args?.select ?? {};

    if (
      where.id === '11111111-1111-1111-1111-111111111111' &&
      where.tenantId === 'tenant-1' &&
      where.deletedAt === null &&
      where.isActive === true &&
      'organizationId' in select
    ) {
      return buildTenantContextUser();
    }

    if (
      where.id === '22222222-2222-2222-2222-222222222222' &&
      where.tenantId === 'tenant-1' &&
      where.isActive === true &&
      where.deletedAt === null
    ) {
      return buildTargetUser();
    }

    return null;
  });

  prismaMock.organization.findFirst.mockResolvedValue(buildOrganization());
  prismaMock.membership.findUnique.mockImplementation(async (args?: {
    where?: {
      userId_organizationId?: {
        userId: string;
        organizationId: string;
      };
    };
  }) => {
    const key = args?.where?.userId_organizationId;

    if (
      key?.userId === '11111111-1111-1111-1111-111111111111' &&
      key?.organizationId === '33333333-3333-3333-3333-333333333333'
    ) {
      return {
        id: 'actor-membership',
        role: 'admin',
        deletedAt: null,
        isActive: true,
      };
    }

    return null;
  });
  prismaMock.membership.create.mockResolvedValue(buildMembership());
  prismaMock.membership.update.mockResolvedValue(buildMembership());
  prismaMock.user.update.mockResolvedValue({
    ...buildTargetUser(),
    organizationId: '33333333-3333-3333-3333-333333333333',
  });
  prismaMock.securityEventLog.create.mockResolvedValue(undefined);
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('POST /api/v1/memberships', () => {
  it('returns 401 without a token', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      payload: {
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('returns 403 without membership:create permission', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      headers: {
        authorization: `Bearer ${getToken(['user:read'])}`,
      },
      payload: {
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it('returns a controlled error when the user does not exist in the authenticated tenant', async () => {
    prismaMock.user.findFirst.mockImplementationOnce(async () =>
      buildTenantContextUser(),
    );
    prismaMock.user.findFirst.mockImplementationOnce(async () => null);

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
      payload: {
        userId: '99999999-9999-9999-9999-999999999999',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User not found',
      },
    });
  });

  it('returns a controlled error when the organization does not exist in the authenticated tenant', async () => {
    prismaMock.organization.findFirst.mockResolvedValueOnce(null);

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
      payload: {
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '99999999-9999-9999-9999-999999999999',
        role: 'manager',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Organization not found',
      },
    });
  });

  it('creates a membership and updates the user organization when missing', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
      payload: {
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
        permissions: {},
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      message: 'Membership created successfully',
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
      },
    });
    expect(prismaMock.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: '22222222-2222-2222-2222-222222222222',
          organizationId: '33333333-3333-3333-3333-333333333333',
          role: 'manager',
          invitedById: '11111111-1111-1111-1111-111111111111',
        }),
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      data: { organizationId: '33333333-3333-3333-3333-333333333333' },
    });
  });

  it('keeps tenant isolation by querying the target user inside the authenticated tenant', async () => {
    const server = await getApp();
    await server.inject({
      method: 'POST',
      url: '/api/v1/memberships',
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
      payload: {
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: '33333333-3333-3333-3333-333333333333',
        role: 'manager',
      },
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: '22222222-2222-2222-2222-222222222222',
          tenantId: 'tenant-1',
          isActive: true,
          deletedAt: null,
        }),
      }),
    );
  });
});
