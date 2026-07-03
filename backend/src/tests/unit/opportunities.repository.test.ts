import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  pipeline: {
    findFirst: vi.fn(),
  },
  stage: {
    findFirst: vi.fn(),
  },
  customer: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  lead: {
    findFirst: vi.fn(),
  },
  masterCatalogProduct: {
    findFirst: vi.fn(),
  },
  masterCatalogSubproduct: {
    findFirst: vi.fn(),
  },
  masterCatalogModality: {
    findFirst: vi.fn(),
  },
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
import {
  createCustomerInTransaction,
  findCustomerById,
  findLeadById,
  findModalityById,
  findOpportunityTenantScope,
  findPipelineById,
  findProductById,
  findStageById,
  findSubproductById,
  runOpportunitiesSerializableTransaction,
} from '../../modules/opportunities/repositories/opportunities.repository.js';

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

  it('runOpportunitiesSerializableTransaction uses serializable isolation', async () => {
    await runOpportunitiesSerializableTransaction(async (transaction) => {
      expect(transaction).toBeDefined();
      return 'ok';
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );
  });

  it('findPipelineById scopes by tenant', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 'tenant-a' });

    await findPipelineById('tenant-a', 'pipe-1');

    expect(prismaMock.pipeline.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'pipe-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });
  });

  it('findStageById scopes by tenant and includes pipeline relation', async () => {
    prismaMock.stage.findFirst.mockResolvedValueOnce({
      id: 'stage-1',
      tenantId: 'tenant-a',
    });

    await findStageById('tenant-a', 'stage-1');

    expect(prismaMock.stage.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'stage-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        pipelineId: true,
        isActive: true,
      },
    });
  });

  it('findOpportunityTenantScope reads cross-tenant identity only', async () => {
    prismaMock.opportunity.findFirst.mockResolvedValueOnce({
      id: 'opp-1',
      tenantId: 'tenant-a',
    });

    await findOpportunityTenantScope('opp-1');

    expect(prismaMock.opportunity.findFirst).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      select: {
        id: true,
        tenantId: true,
      },
    });
  });

  it('findCustomerById scopes by tenant', async () => {
    prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 'cust-1', tenantId: 'tenant-a' });

    await findCustomerById('tenant-a', 'cust-1');

    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'cust-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });
  });

  it('findLeadById scopes by tenant', async () => {
    prismaMock.lead.findFirst.mockResolvedValueOnce({ id: 'lead-1', tenantId: 'tenant-a' });

    await findLeadById('tenant-a', 'lead-1');

    expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'lead-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });
  });

  it('findProductById scopes by tenant', async () => {
    prismaMock.masterCatalogProduct.findFirst.mockResolvedValueOnce({
      id: 'product-1',
      tenantId: 'tenant-a',
    });

    await findProductById('tenant-a', 'product-1');

    expect(prismaMock.masterCatalogProduct.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });
  });

  it('findSubproductById scopes by tenant and returns product relation', async () => {
    prismaMock.masterCatalogSubproduct.findFirst.mockResolvedValueOnce({
      id: 'subproduct-1',
      tenantId: 'tenant-a',
    });

    await findSubproductById('tenant-a', 'subproduct-1');

    expect(prismaMock.masterCatalogSubproduct.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'subproduct-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        productId: true,
      },
    });
  });

  it('findModalityById scopes by tenant and returns subproduct relation', async () => {
    prismaMock.masterCatalogModality.findFirst.mockResolvedValueOnce({
      id: 'modality-1',
      tenantId: 'tenant-a',
    });

    await findModalityById('tenant-a', 'modality-1');

    expect(prismaMock.masterCatalogModality.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'modality-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        subproductId: true,
      },
    });
  });

  it('createCustomerInTransaction normalizes JSON null values', async () => {
    const tx = {
      customer: {
        create: vi.fn().mockResolvedValueOnce({ id: 'cust-1' }),
      },
    };

    await createCustomerInTransaction(
      {
        tenantId: 'tenant-a',
        customerCode: 'CUST-1',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@finqz.com.br',
        emailNormalized: 'maria@finqz.com.br',
        cpf: '12345678900',
        address: null,
        bankData: null,
      },
      tx as never,
    );

    expect(tx.customer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        address: expect.any(Object),
        bankData: expect.any(Object),
      }),
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
