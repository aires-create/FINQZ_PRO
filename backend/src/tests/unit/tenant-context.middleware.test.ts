import { describe, expect, it, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { tenantContextMiddleware } from '../../core/http/middleware.js';

describe('tenantContextMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enriches tenant context from user lookup without requiring partner claims', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      partnerId: 'partner-1',
      userRoles: [
        {
          role: {
            id: 'role-1',
            name: 'Admin',
            slug: 'admin',
            type: 'ADMIN',
          },
        },
      ],
    });

    const request: any = {
      currentUser: {
        userId: 'user-1',
        tenantId: 'tenant-1',
        roleId: 'role-1',
        role: 'admin',
        permissions: ['opportunity:read'],
      },
      currentTenant: null,
      params: {},
      body: {},
      query: {},
    };

    await tenantContextMiddleware(request, {} as any);

    expect(request.currentTenant).toMatchObject({
      tenantId: 'tenant-1',
      userId: 'user-1',
      organizationId: 'org-1',
      partnerId: 'partner-1',
      scopeRole: 'tenant_admin',
      ownership: {
        userId: 'user-1',
        organizationId: 'org-1',
        partnerId: 'partner-1',
        scopeRole: 'tenant_admin',
      },
    });

    expect(request.currentUser).toMatchObject({
      organizationId: 'org-1',
      partnerId: 'partner-1',
      scopeRole: 'tenant_admin',
    });
  });

  it('fails securely when user cannot be resolved', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const request: any = {
      currentUser: {
        userId: 'user-missing',
        tenantId: 'tenant-1',
        permissions: [],
      },
      currentTenant: null,
      params: {},
      body: {},
      query: {},
    };

    await expect(tenantContextMiddleware(request, {} as any)).rejects.toThrow(
      'User context could not be resolved',
    );
  });
});
