import { describe, expect, it, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  organization: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  membership: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../../database/prisma.js', () => ({
  prisma: prismaMock,
}));

import { organizationsService } from '../../../modules/organizations/service.js';
import { membershipsService } from '../../../modules/memberships/service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PRP-FIX-02 tenant boundary', () => {
  it('creates organizations through the repository boundary', async () => {
    prismaMock.organization.findUnique.mockResolvedValueOnce(null);
    prismaMock.organization.create.mockResolvedValueOnce({
      id: 'org-1',
      tenantId: 'tenant-1',
      code: 'SALES',
      name: 'Sales',
      type: 'department',
    });

    const organization = await organizationsService.createOrganization('tenant-1', {
      name: 'Sales',
      code: 'SALES',
      type: 'department',
    });

    expect(organization.id).toBe('org-1');
    expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_code: {
          tenantId: 'tenant-1',
          code: 'SALES',
        },
      },
    });
    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          name: 'Sales',
          code: 'SALES',
          type: 'department',
          level: 1,
        }),
      }),
    );
  });

  it('creates memberships without exposing direct prisma access in the service', async () => {
    prismaMock.user.findFirst.mockImplementation(async (args?: { where?: Record<string, unknown> }) => {
      const where = args?.where ?? {};

      if (where.id === 'user-2') {
        return {
          id: 'user-2',
          tenantId: 'tenant-1',
          organizationId: null,
        };
      }

      return null;
    });
    prismaMock.organization.findFirst.mockResolvedValueOnce({
      id: 'org-1',
      tenantId: 'tenant-1',
      isActive: true,
      deletedAt: null,
    });
    prismaMock.membership.findUnique.mockImplementation(async (args?: {
      where?: { userId_organizationId?: { userId: string; organizationId: string } };
    }) => {
      const key = args?.where?.userId_organizationId;

      if (key?.userId === 'actor-1' && key?.organizationId === 'org-1') {
        return {
          id: 'actor-membership',
          role: 'admin',
          deletedAt: null,
          isActive: true,
        };
      }

      return null;
    });
    prismaMock.membership.create.mockResolvedValueOnce({
      id: 'membership-1',
      tenantId: 'tenant-1',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'manager',
    });
    prismaMock.user.update.mockResolvedValueOnce({
      id: 'user-2',
      organizationId: 'org-1',
    });

    const membership = await membershipsService.createMembership('tenant-1', 'actor-1', {
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'manager',
    });

    expect(membership.id).toBe('membership-1');
    expect(prismaMock.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-2',
          organizationId: 'org-1',
          role: 'manager',
          invitedById: 'actor-1',
        }),
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { organizationId: 'org-1' },
    });
  });
});
