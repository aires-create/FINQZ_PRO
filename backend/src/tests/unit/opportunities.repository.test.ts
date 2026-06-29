import { describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  opportunity: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { opportunitiesRepository } from '../../modules/opportunities/repositories/opportunities.repository.js';

describe('opportunitiesRepository', () => {
  it('findById respects tenant isolation', async () => {
    prismaMock.opportunity.findFirst.mockResolvedValueOnce({ id: 'opp-1' });

    await opportunitiesRepository.findById('opp-1', 'tenant-a');

    expect(prismaMock.opportunity.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'opp-1',
        tenantId: 'tenant-a',
        deletedAt: null,
        pipeline: {
          is: {
            tenantId: 'tenant-a',
            deletedAt: null,
          },
        },
        stage: {
          is: {
            tenantId: 'tenant-a',
            deletedAt: null,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        subproduct: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        modality: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
            isWon: true,
            isLost: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  });

  it('findMany respects tenant isolation', async () => {
    prismaMock.opportunity.findMany.mockResolvedValueOnce([]);
    prismaMock.opportunity.count.mockResolvedValueOnce(0);

    await opportunitiesRepository.findMany({
      tenantId: 'tenant-a',
      page: 1,
      limit: 20,
      status: 'open',
    });

    expect(prismaMock.opportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          deletedAt: null,
          status: 'open',
          pipeline: {
            is: {
              tenantId: 'tenant-a',
              deletedAt: null,
            },
          },
          stage: {
            is: {
              tenantId: 'tenant-a',
              deletedAt: null,
            },
          },
        }),
        include: expect.objectContaining({
          product: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          subproduct: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          modality: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          pipeline: {
            select: {
              id: true,
              name: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
              order: true,
              isWon: true,
              isLost: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        }),
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 20,
      }),
    );
    expect(prismaMock.opportunity.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 'tenant-a',
        deletedAt: null,
        status: 'open',
      }),
    });
  });

  it('softDelete does not remove physically and sets deletedAt', async () => {
    prismaMock.opportunity.updateMany.mockResolvedValueOnce({ count: 1 });

    await opportunitiesRepository.softDelete('opp-1', 'tenant-a');

    expect(prismaMock.opportunity.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'opp-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it('update does not alter records from another tenant', async () => {
    prismaMock.opportunity.updateMany.mockResolvedValueOnce({ count: 0 });

    await opportunitiesRepository.update(
      'opp-1',
      'tenant-a',
      { title: 'Updated title' },
    );

    expect(prismaMock.opportunity.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'opp-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        title: 'Updated title',
      },
    });
  });

  it('moveStage respects tenant isolation', async () => {
    prismaMock.opportunity.updateMany.mockResolvedValueOnce({ count: 1 });

    await opportunitiesRepository.moveStage(
      'opp-1',
      'tenant-a',
      { stageId: 'stage-2' },
    );

    expect(prismaMock.opportunity.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'opp-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      data: {
        stageId: 'stage-2',
      },
    });
  });
});
