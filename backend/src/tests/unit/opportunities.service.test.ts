import { readFileSync } from 'node:fs';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

const repoMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  moveStage: vi.fn(),
  softDelete: vi.fn(),
}));

const customersRepositoryMock = vi.hoisted(() => ({
  findById: vi.fn(),
  findByCpf: vi.fn(),
  findByEmailNormalized: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  pipeline: { findFirst: vi.fn() },
  stage: { findFirst: vi.fn() },
  customer: { findFirst: vi.fn(), create: vi.fn() },
  lead: { findFirst: vi.fn() },
  masterCatalogProduct: { findFirst: vi.fn() },
  masterCatalogSubproduct: { findFirst: vi.fn() },
  masterCatalogModality: { findFirst: vi.fn() },
  opportunity: { findFirst: vi.fn() },
}));

const auditMock = vi.hoisted(() => ({
  registerAuditLog: vi.fn(),
}));

const opportunitiesRepositoryModuleMock = vi.hoisted(() => ({
  opportunitiesRepository: repoMock,
  runOpportunitiesSerializableTransaction: vi.fn(
    async (callback: (tx: Prisma.TransactionClient) => unknown) =>
      prismaMock.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
  ),
  findPipelineById: vi.fn((tenantId: string, pipelineId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).pipeline.findFirst({
      where: {
        id: pipelineId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findPipelineTenantScope: vi.fn((pipelineId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).pipeline.findFirst({
      where: {
        id: pipelineId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findStageById: vi.fn((tenantId: string, stageId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).stage.findFirst({
      where: {
        id: stageId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        pipelineId: true,
        isActive: true,
      },
    }),
  ),
  findStageTenantScope: vi.fn((stageId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).stage.findFirst({
      where: {
        id: stageId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findCustomerById: vi.fn((tenantId: string, customerId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findCustomerTenantScope: vi.fn((customerId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).customer.findFirst({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findLeadById: vi.fn((tenantId: string, leadId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).lead.findFirst({
      where: {
        id: leadId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findLeadTenantScope: vi.fn((leadId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).lead.findFirst({
      where: {
        id: leadId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findProductById: vi.fn((tenantId: string, productId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogProduct.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findProductTenantScope: vi.fn((productId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogProduct.findFirst({
      where: {
        id: productId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  findSubproductById: vi.fn((tenantId: string, subproductId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogSubproduct.findFirst({
      where: {
        id: subproductId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        productId: true,
      },
    }),
  ),
  findSubproductTenantScope: vi.fn((subproductId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogSubproduct.findFirst({
      where: {
        id: subproductId,
      },
      select: {
        id: true,
        tenantId: true,
        productId: true,
      },
    }),
  ),
  findModalityById: vi.fn((tenantId: string, modalityId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogModality.findFirst({
      where: {
        id: modalityId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        subproductId: true,
      },
    }),
  ),
  findModalityTenantScope: vi.fn((modalityId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).masterCatalogModality.findFirst({
      where: {
        id: modalityId,
      },
      select: {
        id: true,
        tenantId: true,
        subproductId: true,
      },
    }),
  ),
  findOpportunityTenantScope: vi.fn((opportunityId: string, client?: Prisma.TransactionClient) =>
    (client ?? prismaMock).opportunity.findFirst({
      where: {
        id: opportunityId,
      },
      select: {
        id: true,
        tenantId: true,
      },
    }),
  ),
  createCustomerInTransaction: vi.fn((data: unknown, client: Prisma.TransactionClient) =>
    client.customer.create({
      data: data as never,
    }),
  ),
}));

vi.mock('../../modules/opportunities/repositories/opportunities.repository.js', () => opportunitiesRepositoryModuleMock);

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../modules/crm/repositories/customers.repository.js', () => ({
  customersRepository: customersRepositoryMock,
}));

vi.mock('../../modules/audit/services/audit.service.js', () => ({
  registerAuditLog: auditMock.registerAuditLog,
}));

import {
  InvalidPipelineError,
  InvalidStageError,
  InvalidCustomerError,
  type OpportunityAccessScope,
  OpportunitiesService,
  OpportunityNotFoundError,
  TenantScopeViolationError,
} from '../../modules/opportunities/services/opportunities.service.js';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';

describe('OpportunitiesService', () => {
  const service = new OpportunitiesService();
  const txMock = {
    pipeline: { findFirst: vi.fn() },
    stage: { findFirst: vi.fn() },
    customer: { create: vi.fn() },
  } as unknown as Prisma.TransactionClient;
  const tenantAdminScope: OpportunityAccessScope = {
    tenantId: 't1',
    userId: 'user-admin',
    scopeRole: 'tenant_admin',
    permissions: [],
  } as OpportunityAccessScope;
  const partnerScope: OpportunityAccessScope = {
    tenantId: 't1',
    userId: 'user-partner',
    partnerId: 'partner-1',
    scopeRole: 'partner_user',
    permissions: [],
  } as OpportunityAccessScope;
  const ownerScope: OpportunityAccessScope = {
    tenantId: 't1',
    userId: 'user-owner',
    scopeRole: 'owner_user',
    permissions: [],
  } as OpportunityAccessScope;

  beforeEach(() => {
    vi.clearAllMocks();
    repoMock.findMany.mockReset();
    repoMock.findById.mockReset();
    repoMock.create.mockReset();
    repoMock.update.mockReset();
    repoMock.moveStage.mockReset();
    repoMock.softDelete.mockReset();
    customersRepositoryMock.findById.mockReset();
    customersRepositoryMock.findByCpf.mockReset();
    customersRepositoryMock.findByEmailNormalized.mockReset();
    prismaMock.pipeline.findFirst.mockReset();
    prismaMock.stage.findFirst.mockReset();
    prismaMock.customer.findFirst.mockReset();
    prismaMock.customer.create.mockReset();
    prismaMock.lead.findFirst.mockReset();
    prismaMock.masterCatalogProduct.findFirst.mockReset();
    prismaMock.masterCatalogSubproduct.findFirst.mockReset();
    prismaMock.masterCatalogModality.findFirst.mockReset();
    prismaMock.opportunity.findFirst.mockReset();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: Prisma.TransactionClient) => unknown) =>
      callback(txMock),
    );
    txMock.pipeline.findFirst.mockReset();
    txMock.stage.findFirst.mockReset();
    txMock.customer.create.mockReset();
  });

  it('create válido', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 'cust-1' });
    prismaMock.lead.findFirst.mockResolvedValueOnce({ id: 'lead-1' });
    repoMock.create.mockResolvedValueOnce({
      id: 'opp-1',
      title: 'Opp',
      amount: 1000,
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      customerId: 'cust-1',
      leadId: 'lead-1',
    });

    const result = await service.create({
      tenantId: 't1',
      actorId: 'user-1',
      title: 'Opp',
      amount: 1000,
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      customerId: 'cust-1',
      leadId: 'lead-1',
    }, tenantAdminScope);

    expect(result.id).toBe('opp-1');
    expect(repoMock.create).toHaveBeenCalledOnce();
    expect(auditMock.registerAuditLog).toHaveBeenCalledOnce();
  });

  it('create stage inválido', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce(null);
    prismaMock.stage.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.create({
        tenantId: 't1',
        title: 'Opp',
        amount: 1000,
        pipelineId: 'pipe-1',
        stageId: 'stage-x',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(InvalidStageError);
  });

  it('create rejeita stage inativo', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce({
      id: 'stage-1',
      tenantId: 't1',
      pipelineId: 'pipe-1',
      isActive: false,
    });
    prismaMock.stage.findFirst.mockResolvedValueOnce({
      id: 'stage-1',
      tenantId: 't1',
      pipelineId: 'pipe-1',
      isActive: false,
    });

    await expect(
      service.create({
        tenantId: 't1',
        title: 'Opp',
        amount: 1000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(InvalidStageError);
    expect(repoMock.create).not.toHaveBeenCalled();
  });

  it('create pipeline inválido', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce(null);
    prismaMock.pipeline.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.create({
        tenantId: 't1',
        title: 'Opp',
        amount: 1000,
        pipelineId: 'pipe-x',
        stageId: 'stage-1',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(InvalidPipelineError);
  });

  it('create tenant inválido (cross-tenant)', async () => {
    prismaMock.pipeline.findFirst.mockResolvedValueOnce(null);
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 'other-tenant' });

    await expect(
      service.create({
        tenantId: 't1',
        title: 'Opp',
        amount: 1000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(TenantScopeViolationError);
  });

  it('moveStage válido', async () => {
    repoMock.findById
      .mockResolvedValueOnce({ id: 'opp-1', pipelineId: 'pipe-1', stageId: 'stage-1', partnerId: 'partner-1', ownerId: 'user-owner' })
      .mockResolvedValueOnce({ id: 'opp-1', pipelineId: 'pipe-1', stageId: 'stage-2', partnerId: 'partner-1', ownerId: 'user-owner' });
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-2', tenantId: 't1', pipelineId: 'pipe-1' });

    const result = await service.moveStage({
      tenantId: 't1',
      actorId: 'user-1',
      opportunityId: 'opp-1',
      stageId: 'stage-2',
    }, tenantAdminScope);

    expect(result.stageId).toBe('stage-2');
    expect(repoMock.moveStage).toHaveBeenCalledOnce();
  });

  it('moveStage rejeita stage inativo', async () => {
    repoMock.findById.mockResolvedValueOnce({ id: 'opp-1', pipelineId: 'pipe-1', stageId: 'stage-1', partnerId: 'partner-1', ownerId: 'user-owner' });
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce({
      id: 'stage-2',
      tenantId: 't1',
      pipelineId: 'pipe-1',
      isActive: false,
    });

    await expect(
      service.moveStage({
        tenantId: 't1',
        opportunityId: 'opp-1',
        stageId: 'stage-2',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(InvalidStageError);

    expect(repoMock.moveStage).not.toHaveBeenCalled();
  });

  it('moveStage inválido (stage fora do pipeline)', async () => {
    repoMock.findById.mockResolvedValueOnce({ id: 'opp-1', pipelineId: 'pipe-1', stageId: 'stage-1', partnerId: 'partner-1', ownerId: 'user-owner' });
    prismaMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    prismaMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-9', tenantId: 't1', pipelineId: 'pipe-9' });

    await expect(
      service.moveStage({
        tenantId: 't1',
        opportunityId: 'opp-1',
        stageId: 'stage-9',
      }, tenantAdminScope),
    ).rejects.toBeInstanceOf(InvalidStageError);
  });

  it('update respeita escopo de partner', async () => {
    repoMock.findById
      .mockResolvedValueOnce({
        id: 'opp-1',
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
        partnerId: 'partner-1',
        ownerId: 'user-partner',
      })
      .mockResolvedValueOnce({
        id: 'opp-1',
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
        partnerId: 'partner-1',
        ownerId: 'user-partner',
        title: 'Updated title',
      });

    const result = await service.update({
      tenantId: 't1',
      actorId: 'user-partner',
      opportunityId: 'opp-1',
      title: 'Updated title',
    }, partnerScope);

    expect(result.title).toBe('Updated title');
    expect(repoMock.update).toHaveBeenCalledOnce();
  });

  it('update bloqueia opportunity fora do escopo', async () => {
    repoMock.findById.mockResolvedValueOnce({
      id: 'opp-1',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      partnerId: null,
      ownerId: 'other-user',
    });

    await expect(
      service.update({
        tenantId: 't1',
        actorId: 'user-owner',
        opportunityId: 'opp-1',
        title: 'Updated title',
      }, ownerScope),
    ).rejects.toBeInstanceOf(TenantScopeViolationError);
  });

  it('archive executa soft delete', async () => {
    repoMock.findById.mockResolvedValueOnce({ id: 'opp-1', partnerId: 'partner-1', ownerId: 'user-owner' });
    repoMock.softDelete.mockResolvedValueOnce({ count: 1 });

    await service.archive({
      tenantId: 't1',
      actorId: 'user-1',
      opportunityId: 'opp-1',
    }, tenantAdminScope);

    expect(repoMock.softDelete).toHaveBeenCalledWith('opp-1', 't1');
    expect(auditMock.registerAuditLog).toHaveBeenCalledOnce();
  });

  it('getById inexistente', async () => {
    repoMock.findById.mockResolvedValueOnce(null);
    prismaMock.opportunity.findFirst.mockResolvedValueOnce(null);

    await expect(service.getById('t1', 'opp-missing', tenantAdminScope)).rejects.toBeInstanceOf(
      OpportunityNotFoundError,
    );
  });

  it('list tenant admin vê tenant inteiro', async () => {
    repoMock.findMany.mockResolvedValueOnce({ data: [], total: 0 });

    await service.list('t1', { page: 1, limit: 20 }, tenantAdminScope);

    expect(repoMock.findMany).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 't1',
      page: 1,
      limit: 20,
    }));
  });

  it('list partner user filtra por partnerId', async () => {
    repoMock.findMany.mockResolvedValueOnce({ data: [], total: 0 });

    await service.list('t1', { page: 1, limit: 20 }, partnerScope);

    expect(repoMock.findMany).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 't1',
      partnerId: 'partner-1',
      page: 1,
      limit: 20,
    }));
  });

  it('list owner user filtra por ownerId', async () => {
    repoMock.findMany.mockResolvedValueOnce({ data: [], total: 0 });

    await service.list('t1', { page: 1, limit: 20 }, ownerScope);

    expect(repoMock.findMany).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 't1',
      ownerId: 'user-owner',
      page: 1,
      limit: 20,
    }));
  });

  it('getById bloqueia opportunity fora do partner', async () => {
    repoMock.findById.mockResolvedValueOnce({
      id: 'opp-1',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      partnerId: 'partner-2',
      ownerId: 'user-owner',
    });

    await expect(service.getById('t1', 'opp-1', partnerScope)).rejects.toBeInstanceOf(
      TenantScopeViolationError,
    );
  });

  it('archive bloqueia owner fora do escopo', async () => {
    repoMock.findById.mockResolvedValueOnce({
      id: 'opp-1',
      partnerId: null,
      ownerId: 'other-user',
    });

    await expect(
      service.archive({
        tenantId: 't1',
        actorId: 'user-owner',
        opportunityId: 'opp-1',
      }, ownerScope),
    ).rejects.toBeInstanceOf(TenantScopeViolationError);
  });

  it('intake cria customer e opportunity na mesma operação', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce(null);
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce(null);
    txMock.customer.create.mockResolvedValueOnce({ id: 'cust-new' });
    repoMock.create.mockResolvedValueOnce({
      id: 'opp-1',
      customerId: 'cust-new',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
    });

    const result = await service.createOpportunityIntake('t1', 'user-1', {
      opportunity: {
        title: 'Opp intake',
        amount: 2000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      },
      customer: {
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@finqz.com.br',
        cpfCnpj: '12345678900',
      },
    });

    expect(result).toEqual({
      customer: {
        id: 'cust-new',
        status: 'created',
      },
      opportunity: {
        id: 'opp-1',
        customerId: 'cust-new',
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      },
    });
    expect(txMock.customer.create).toHaveBeenCalledOnce();
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        customerId: 'cust-new',
        ownerId: 'user-1',
      }),
      txMock,
    );
  });

  it('intake usa customer existente por id', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findById.mockResolvedValueOnce({ id: 'cust-existing' });
    repoMock.create.mockResolvedValueOnce({
      id: 'opp-2',
      customerId: 'cust-existing',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
    });

    const result = await service.createOpportunityIntake('t1', 'user-1', {
      opportunity: {
        title: 'Opp by id',
        amount: 3000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      },
      customer: {
        id: 'cust-existing',
      },
    });

    expect(result.customer).toEqual({
      id: 'cust-existing',
      status: 'linked_existing',
    });
    expect(customersRepositoryMock.findById).toHaveBeenCalledWith('t1', 'cust-existing', txMock);
    expect(txMock.customer.create).not.toHaveBeenCalled();
  });

  it('intake usa customer existente por CPF/CNPJ', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce({ id: 'cust-cpf' });
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce(null);
    repoMock.create.mockResolvedValueOnce({
      id: 'opp-3',
      customerId: 'cust-cpf',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
    });

    const result = await service.createOpportunityIntake('t1', 'user-1', {
      opportunity: {
        title: 'Opp by cpf',
        amount: 3000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      },
      customer: {
        cpfCnpj: '12345678900',
      },
    });

    expect(result.customer).toEqual({
      id: 'cust-cpf',
      status: 'linked_existing',
    });
    expect(customersRepositoryMock.findByCpf).toHaveBeenCalledWith('t1', '12345678900', txMock);
  });

  it('intake usa customer existente por email normalizado', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce(null);
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce({ id: 'cust-email' });
    repoMock.create.mockResolvedValueOnce({
      id: 'opp-4',
      customerId: 'cust-email',
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
    });

    const result = await service.createOpportunityIntake('t1', 'user-1', {
      opportunity: {
        title: 'Opp by email',
        amount: 3000,
        pipelineId: 'pipe-1',
        stageId: 'stage-1',
      },
      customer: {
        email: 'Cliente@FINQZ.com.br',
      },
    });

    expect(result.customer).toEqual({
      id: 'cust-email',
      status: 'linked_existing',
    });
    expect(customersRepositoryMock.findByEmailNormalized).toHaveBeenCalledWith(
      't1',
      'cliente@finqz.com.br',
      txMock,
    );
  });

  it('intake retorna 409 quando CPF/CNPJ e email pertencem a customers diferentes', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce({ id: 'cust-cpf' });
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce({ id: 'cust-email' });

    await expect(
      service.createOpportunityIntake('t1', 'user-1', {
        opportunity: {
          title: 'Conflict',
          amount: 1000,
          pipelineId: 'pipe-1',
          stageId: 'stage-1',
        },
        customer: {
          cpfCnpj: '12345678900',
          email: 'cliente@finqz.com.br',
        },
      }),
    ).rejects.toMatchObject<Partial<ConflictError>>({
      statusCode: 409,
      message: 'Conflito de identidade: CPF/CNPJ e e-mail pertencem a clientes diferentes.',
    });
  });

  it('intake retorna erro quando stage não pertence ao pipeline', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({
      id: 'stage-x',
      tenantId: 't1',
      pipelineId: 'pipe-x',
    });

    await expect(
      service.createOpportunityIntake('t1', 'user-1', {
        opportunity: {
          title: 'Invalid stage',
          amount: 1000,
          pipelineId: 'pipe-1',
          stageId: 'stage-x',
        },
        customer: {
          cpfCnpj: '12345678900',
          email: 'cliente@finqz.com.br',
        },
      }),
    ).rejects.toBeInstanceOf(InvalidStageError);
  });

  it('intake retorna erro quando allowCreateCustomer=false e customer não existe', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce(null);
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce(null);

    await expect(
      service.createOpportunityIntake('t1', 'user-1', {
        opportunity: {
          title: 'No create',
          amount: 1000,
          pipelineId: 'pipe-1',
          stageId: 'stage-1',
        },
        customer: {
          cpfCnpj: '12345678900',
          email: 'cliente@finqz.com.br',
        },
        options: {
          allowCreateCustomer: false,
        },
      }),
    ).rejects.toMatchObject<Partial<NotFoundError>>({
      statusCode: 404,
      message: 'Customer not found and automatic creation is disabled',
    });
  });

  it('intake não deixa operação prosseguir quando create da opportunity falha após criar customer', async () => {
    txMock.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', tenantId: 't1' });
    txMock.stage.findFirst.mockResolvedValueOnce({ id: 'stage-1', tenantId: 't1', pipelineId: 'pipe-1' });
    customersRepositoryMock.findByCpf.mockResolvedValueOnce(null);
    customersRepositoryMock.findByEmailNormalized.mockResolvedValueOnce(null);
    txMock.customer.create.mockResolvedValueOnce({ id: 'cust-new' });
    repoMock.create.mockRejectedValueOnce(new InvalidCustomerError('cust-new'));

    await expect(
      service.createOpportunityIntake('t1', 'user-1', {
        opportunity: {
          title: 'Rollback',
          amount: 1000,
          pipelineId: 'pipe-1',
          stageId: 'stage-1',
        },
        customer: {
          firstName: 'Maria',
          lastName: 'Silva',
          email: 'maria@finqz.com.br',
          cpfCnpj: '12345678900',
        },
      }),
    ).rejects.toBeInstanceOf(InvalidCustomerError);

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(txMock.customer.create).toHaveBeenCalledOnce();
    expect(auditMock.registerAuditLog).not.toHaveBeenCalled();
  });

  it('service não acessa Prisma diretamente no source', () => {
    const serviceSource = readFileSync(
      new URL('../../modules/opportunities/services/opportunities.service.ts', import.meta.url),
      'utf8',
    );

    expect(serviceSource).not.toContain("from '../../../core/prisma/client.js'");
    expect(serviceSource).not.toContain('prisma.$transaction');
    expect(serviceSource).not.toContain('tx.customer.create');
    expect(serviceSource).not.toContain('Prisma.');
  });
});
