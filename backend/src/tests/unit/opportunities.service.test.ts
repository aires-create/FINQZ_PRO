import { describe, expect, it, vi, beforeEach } from 'vitest';

const repoMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  moveStage: vi.fn(),
  softDelete: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  pipeline: { findFirst: vi.fn() },
  stage: { findFirst: vi.fn() },
  customer: { findFirst: vi.fn() },
  lead: { findFirst: vi.fn() },
  opportunity: { findFirst: vi.fn() },
}));

const auditMock = vi.hoisted(() => ({
  registerAuditLog: vi.fn(),
}));

vi.mock('../../modules/opportunities/repositories/opportunities.repository.js', () => ({
  opportunitiesRepository: repoMock,
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../modules/audit/services/audit.service.js', () => ({
  registerAuditLog: auditMock.registerAuditLog,
}));

import {
  InvalidPipelineError,
  InvalidStageError,
  type OpportunityAccessScope,
  OpportunitiesService,
  OpportunityNotFoundError,
  TenantScopeViolationError,
} from '../../modules/opportunities/services/opportunities.service.js';

describe('OpportunitiesService', () => {
  const service = new OpportunitiesService();
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
});
