import { describe, expect, it, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tenant: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  role: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  userRole: {
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  permission: {
    findMany: vi.fn(),
  },
  rolePermission: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../../../database/prisma.js', () => ({
  prisma: prismaMock,
}));

import { authRepository } from '../../../modules/auth/repositories/auth.repository.js';
import { authService } from '../../../modules/auth/service.js';
import { rolesRepository } from '../../../modules/roles/repositories/roles.repository.js';
import { usersRepository } from '../../../modules/users/repositories/users.repository.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PRP-FIX-01 identity boundary', () => {
  it('keeps auth repository queries behind the persistence boundary', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    await authRepository.findUserByEmail('admin@finqz.com.br');

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        emailNormalized: 'admin@finqz.com.br',
      },
      include: expect.any(Object),
    });
  });

  it('keeps user listing behind the users repository boundary', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    await usersRepository.listByTenant('tenant-1');

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

  it('keeps role listing behind the roles repository boundary', async () => {
    prismaMock.role.findMany.mockResolvedValueOnce([]);
    prismaMock.role.count.mockResolvedValueOnce(0);

    await rolesRepository.listByTenant('tenant-1', 0, 10);

    expect(prismaMock.role.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
      },
      include: expect.any(Object),
      skip: 0,
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(prismaMock.role.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
      },
    });
  });

  it('builds the session payload through the auth service without direct prisma access', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
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
          role: {
            id: 'role-1',
            name: 'Admin Sistema',
            slug: 'ROLE_ADMIN_SISTEMA',
            type: 'SYSTEM',
            rolePermissions: [
              { permission: { slug: 'USUARIOS_VIEW' } },
            ],
          },
        },
      ],
    });

    const session = await authService.getSession({
      userId: 'user-1',
      tenantId: 'tenant-1',
      roleId: 'role-1',
      role: 'ROLE_ADMIN_SISTEMA',
      email: 'admin@finqz.com.br',
    });

    expect(session).toMatchObject({
      user: {
        id: 'user-1',
        tenantName: 'FINQZ PRO',
        roles: [
          {
            id: 'role-1',
            name: 'Admin Sistema',
            slug: 'ROLE_ADMIN_SISTEMA',
            type: 'SYSTEM',
          },
        ],
        permissions: ['USUARIOS_VIEW'],
      },
    });
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
});
