import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    partner: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return { prismaMock };
});

vi.mock('../../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { partnerPrismaRepository } from '../../../modules/partners/repositories/partner.prisma.repository.js';

describe('partnerPrismaRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findById filters by id, tenantId and deletedAt null', async () => {
    prismaMock.partner.findFirst.mockResolvedValueOnce(null);

    await partnerPrismaRepository.findById({
      tenantId: 'tenant-a',
      partnerId: 'partner-1',
    });

    expect(prismaMock.partner.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'partner-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
    });
  });

  it('findByCode filters by tenantId, code and deletedAt null', async () => {
    prismaMock.partner.findFirst.mockResolvedValueOnce(null);

    await partnerPrismaRepository.findByCode({
      tenantId: 'tenant-a',
      code: 'PARTNER-001',
    });

    expect(prismaMock.partner.findFirst).toHaveBeenCalledWith({
      where: {
        code: 'PARTNER-001',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
    });
  });

  it('listByTenant always filters tenantId and deletedAt null', async () => {
    prismaMock.partner.findMany.mockResolvedValueOnce([]);
    prismaMock.partner.count.mockResolvedValueOnce(0);

    await partnerPrismaRepository.listByTenant({
      tenantId: 'tenant-a',
      page: 2,
      limit: 10,
      status: 'active',
    });

    expect(prismaMock.partner.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        status: 'active',
      },
      skip: 10,
      take: 10,
      orderBy: [
        { name: 'asc' },
        { code: 'asc' },
      ],
    });
    expect(prismaMock.partner.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        deletedAt: null,
        status: 'active',
      },
    });
  });

  it('create persists tenantId, parentId and status', async () => {
    prismaMock.partner.create.mockResolvedValueOnce({ id: 'partner-1' });

    await partnerPrismaRepository.create({
      tenantId: 'tenant-a',
      code: 'PARTNER-001',
      name: 'Partner One',
      type: 'franchise',
      parentId: 'partner-parent',
      status: 'active',
      document: '12345678901',
      email: 'partner@example.com',
      phone: '11999999999',
    });

    expect(prismaMock.partner.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        code: 'PARTNER-001',
        name: 'Partner One',
        type: 'franchise',
        parentId: 'partner-parent',
        status: 'active',
        document: '12345678901',
        email: 'partner@example.com',
        phone: '11999999999',
      },
    });
  });

  it('update respects id, tenantId and deletedAt null', async () => {
    prismaMock.partner.updateMany.mockResolvedValueOnce({ count: 1 });

    await partnerPrismaRepository.update({
      tenantId: 'tenant-a',
      partnerId: 'partner-1',
      data: {
        name: 'Partner Updated',
        status: 'inactive',
      },
    });

    expect(prismaMock.partner.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'partner-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        name: 'Partner Updated',
        status: 'inactive',
      },
    });
  });

  it('softDelete writes deletedAt', async () => {
    prismaMock.partner.updateMany.mockResolvedValueOnce({ count: 1 });

    await partnerPrismaRepository.softDelete({
      tenantId: 'tenant-a',
      partnerId: 'partner-1',
    });

    expect(prismaMock.partner.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'partner-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('countActiveChildren ignores soft-deleted records', async () => {
    prismaMock.partner.count.mockResolvedValueOnce(2);

    await partnerPrismaRepository.countActiveChildren({
      tenantId: 'tenant-a',
      parentId: 'partner-parent',
    });

    expect(prismaMock.partner.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        parentId: 'partner-parent',
        deletedAt: null,
      },
    });
  });
});
