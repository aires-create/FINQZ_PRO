import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import type { TenantContext } from '../../../shared/types/index.js';
import { registerAuditLog } from '../../audit/services/audit.service.js';
import {
  opportunitiesRepository,
  type FindManyOpportunitiesParams,
} from '../repositories/opportunities.repository.js';

export class OpportunityNotFoundError extends Error {
  constructor(opportunityId: string) {
    super(`Opportunity not found: ${opportunityId}`);
    this.name = 'OpportunityNotFoundError';
  }
}

export class InvalidPipelineError extends Error {
  constructor(pipelineId: string) {
    super(`Invalid pipeline: ${pipelineId}`);
    this.name = 'InvalidPipelineError';
  }
}

export class InvalidStageError extends Error {
  constructor(stageId: string) {
    super(`Invalid stage: ${stageId}`);
    this.name = 'InvalidStageError';
  }
}

export class InvalidCustomerError extends Error {
  constructor(customerId: string) {
    super(`Invalid customer: ${customerId}`);
    this.name = 'InvalidCustomerError';
  }
}

export class InvalidLeadError extends Error {
  constructor(leadId: string) {
    super(`Invalid lead: ${leadId}`);
    this.name = 'InvalidLeadError';
  }
}

export class TenantScopeViolationError extends Error {
  constructor(entity: string, entityId: string) {
    super(`Tenant scope violation for ${entity}: ${entityId}`);
    this.name = 'TenantScopeViolationError';
  }
}

export type ListOpportunitiesParams = Omit<FindManyOpportunitiesParams, 'tenantId'>;

export type OpportunityAccessScope = Pick<
  TenantContext,
  'tenantId' | 'userId' | 'organizationId' | 'partnerId' | 'scopeRole' | 'ownership'
>;

export type CreateOpportunityInput = {
  tenantId: string;
  actorId?: string | null;
  title: string;
  description?: string | null;
  amount: number;
  currency?: string;
  probability?: number;
  status?: string;
  expectedCloseDate?: Date | string | null;
  actualCloseDate?: Date | string | null;
  partnerId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  pipelineId: string;
  stageId: string;
  ownerId?: string | null;
};

export type UpdateOpportunityInput = {
  tenantId: string;
  actorId?: string | null;
  opportunityId: string;
  title?: string;
  description?: string | null;
  amount?: number;
  currency?: string;
  probability?: number;
  status?: string;
  expectedCloseDate?: Date | string | null;
  actualCloseDate?: Date | string | null;
  partnerId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string | null;
};

export type MoveOpportunityStageInput = {
  tenantId: string;
  actorId?: string | null;
  opportunityId: string;
  stageId: string;
  pipelineId?: string;
};

export type ArchiveOpportunityInput = {
  tenantId: string;
  actorId?: string | null;
  opportunityId: string;
};

const AuditActions = {
  OPPORTUNITY_CREATED: 'OPPORTUNITY_CREATED',
  OPPORTUNITY_UPDATED: 'OPPORTUNITY_UPDATED',
  OPPORTUNITY_MOVED: 'OPPORTUNITY_MOVED',
  OPPORTUNITY_ARCHIVED: 'OPPORTUNITY_ARCHIVED',
} as const;

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizePositiveInteger = (value: number | undefined, fallback: number) => {
  if (!value || Number.isNaN(value) || value < 1) return fallback;
  return Math.floor(value);
};

const isTenantAdminScope = (scope: OpportunityAccessScope) => {
  return scope.scopeRole === 'tenant_admin';
};

const resolveScopedListParams = (
  params: ListOpportunitiesParams,
  scope: OpportunityAccessScope,
): FindManyOpportunitiesParams => {
  if (isTenantAdminScope(scope)) {
    return {
      ...params,
      tenantId: scope.tenantId,
    };
  }

  if (scope.partnerId) {
    return {
      ...params,
      tenantId: scope.tenantId,
      partnerId: scope.partnerId,
    };
  }

  return {
    ...params,
    tenantId: scope.tenantId,
    ownerId: scope.userId,
  };
};

const canAccessOpportunity = (
  opportunity: { partnerId?: string | null; ownerId?: string | null } | null,
  scope: OpportunityAccessScope,
) => {
  if (!opportunity) {
    return false;
  }

  if (isTenantAdminScope(scope)) {
    return true;
  }

  if (scope.partnerId) {
    return opportunity.partnerId === scope.partnerId;
  }

  return opportunity.ownerId === scope.userId;
};

const scopeCreateInput = (
  input: CreateOpportunityInput,
  scope: OpportunityAccessScope,
): CreateOpportunityInput => {
  if (isTenantAdminScope(scope)) {
    return input;
  }

  return {
    ...input,
    partnerId: scope.partnerId ?? null,
    ownerId: scope.partnerId ? input.ownerId ?? scope.userId : scope.userId,
  };
};

const scopeUpdateInput = (
  input: UpdateOpportunityInput,
  scope: OpportunityAccessScope,
): UpdateOpportunityInput => {
  if (isTenantAdminScope(scope)) {
    return input;
  }

  if (scope.partnerId) {
    return {
      ...input,
      partnerId: scope.partnerId,
    };
  }

  const { ownerId: _ownerId, ...scopedInput } = input;
  return scopedInput;
};

const parseOptionalDate = (value?: string | Date | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const buildOpportunityUpdateData = (
  input: UpdateOpportunityInput,
): Prisma.OpportunityUncheckedUpdateInput => {
  const data: Prisma.OpportunityUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = normalizeText(input.description);
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.currency !== undefined) data.currency = input.currency.trim();
  if (input.probability !== undefined) data.probability = input.probability;
  if (input.status !== undefined) data.status = input.status.trim();
  if (input.expectedCloseDate !== undefined) {
    data.expectedCloseDate = parseOptionalDate(input.expectedCloseDate);
  }
  if (input.actualCloseDate !== undefined) {
    data.actualCloseDate = parseOptionalDate(input.actualCloseDate);
  }
  if (input.partnerId !== undefined) data.partnerId = normalizeText(input.partnerId);
  if (input.leadId !== undefined) data.leadId = normalizeText(input.leadId);
  if (input.customerId !== undefined) data.customerId = normalizeText(input.customerId);
  if (input.pipelineId !== undefined) data.pipelineId = input.pipelineId;
  if (input.stageId !== undefined) data.stageId = input.stageId;
  if (input.ownerId !== undefined) data.ownerId = normalizeText(input.ownerId);

  return data;
};

export class OpportunitiesService {
  async list(
    tenantId: string,
    params: ListOpportunitiesParams,
    scope: OpportunityAccessScope,
  ) {
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    const page = normalizePositiveInteger(params.page, 1);
    const limit = Math.min(normalizePositiveInteger(params.limit, 20), 100);

    return opportunitiesRepository.findMany({
      ...resolveScopedListParams(params, scope),
      tenantId,
      page,
      limit,
    });
  }

  async getById(
    tenantId: string,
    opportunityId: string,
    scope: OpportunityAccessScope,
  ) {
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    const opportunity = await opportunitiesRepository.findById(opportunityId, tenantId);
    if (!opportunity) {
      await this.throwNotFoundOrTenantScope('opportunity', opportunityId, tenantId);
    }

    if (!canAccessOpportunity(opportunity, scope)) {
      throw new TenantScopeViolationError('opportunity', opportunityId);
    }

    return opportunity;
  }

  async create(input: CreateOpportunityInput, scope: OpportunityAccessScope) {
    const scopedInput = scopeCreateInput(input, scope);
    const tenantId = scopedInput.tenantId;
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    await this.assertPipelineAndStageConsistency({
      tenantId,
      pipelineId: scopedInput.pipelineId,
      stageId: scopedInput.stageId,
    });

    if (scopedInput.customerId) {
      await this.assertCustomerBelongsToTenant(tenantId, scopedInput.customerId);
    }

    if (scopedInput.leadId) {
      await this.assertLeadBelongsToTenant(tenantId, scopedInput.leadId);
    }

    const created = await opportunitiesRepository.create({
      tenantId,
      title: scopedInput.title.trim(),
      description: normalizeText(scopedInput.description),
      amount: scopedInput.amount,
      currency: scopedInput.currency?.trim() ?? 'BRL',
      probability: scopedInput.probability ?? 50,
      status: scopedInput.status?.trim() ?? 'open',
      expectedCloseDate: parseOptionalDate(scopedInput.expectedCloseDate),
      actualCloseDate: parseOptionalDate(scopedInput.actualCloseDate),
      partnerId: normalizeText(scopedInput.partnerId),
      leadId: normalizeText(scopedInput.leadId),
      customerId: normalizeText(scopedInput.customerId),
      pipelineId: scopedInput.pipelineId,
      stageId: scopedInput.stageId,
      ownerId: normalizeText(scopedInput.ownerId),
    });

    await registerAuditLog({
      tenantId,
      userId: input.actorId ?? null,
      action: AuditActions.OPPORTUNITY_CREATED,
      entity: 'Opportunity',
      entityId: created.id,
      metadata: {
        title: created.title,
        amount: created.amount,
        pipelineId: created.pipelineId,
        stageId: created.stageId,
        customerId: created.customerId,
        leadId: created.leadId,
      },
    });

    return created;
  }

  async update(input: UpdateOpportunityInput, scope: OpportunityAccessScope) {
    const scopedInput = scopeUpdateInput(input, scope);
    const tenantId = scopedInput.tenantId;
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    const current = await opportunitiesRepository.findById(scopedInput.opportunityId, tenantId);
    if (!current) {
      await this.throwNotFoundOrTenantScope('opportunity', scopedInput.opportunityId, tenantId);
    }

    if (!canAccessOpportunity(current, scope)) {
      throw new TenantScopeViolationError('opportunity', scopedInput.opportunityId);
    }

    const nextPipelineId = scopedInput.pipelineId ?? current!.pipelineId;
    const nextStageId = scopedInput.stageId ?? current!.stageId;

    if (scopedInput.pipelineId !== undefined || scopedInput.stageId !== undefined) {
      await this.assertPipelineAndStageConsistency({
        tenantId,
        pipelineId: nextPipelineId,
        stageId: nextStageId,
      });
    }

    if (scopedInput.customerId !== undefined && scopedInput.customerId !== null) {
      await this.assertCustomerBelongsToTenant(tenantId, scopedInput.customerId);
    }

    if (scopedInput.leadId !== undefined && scopedInput.leadId !== null) {
      await this.assertLeadBelongsToTenant(tenantId, scopedInput.leadId);
    }

    const data = buildOpportunityUpdateData(scopedInput);
    await opportunitiesRepository.update(scopedInput.opportunityId, tenantId, data);

    const updated = await opportunitiesRepository.findById(scopedInput.opportunityId, tenantId);
    if (!updated) {
      throw new OpportunityNotFoundError(scopedInput.opportunityId);
    }

    await registerAuditLog({
      tenantId,
      userId: input.actorId ?? null,
      action: AuditActions.OPPORTUNITY_UPDATED,
      entity: 'Opportunity',
      entityId: updated.id,
      metadata: {
        pipelineId: updated.pipelineId,
        stageId: updated.stageId,
        customerId: updated.customerId,
        leadId: updated.leadId,
        status: updated.status,
      },
    });

    return updated;
  }

  async moveStage(input: MoveOpportunityStageInput, scope: OpportunityAccessScope) {
    const tenantId = input.tenantId;
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    const current = await opportunitiesRepository.findById(input.opportunityId, tenantId);
    if (!current) {
      await this.throwNotFoundOrTenantScope('opportunity', input.opportunityId, tenantId);
    }

    if (!canAccessOpportunity(current, scope)) {
      throw new TenantScopeViolationError('opportunity', input.opportunityId);
    }

    const targetPipelineId = input.pipelineId ?? current!.pipelineId;
    await this.assertPipelineAndStageConsistency({
      tenantId,
      pipelineId: targetPipelineId,
      stageId: input.stageId,
    });

    await opportunitiesRepository.moveStage(input.opportunityId, tenantId, {
      stageId: input.stageId,
      ...(input.pipelineId ? { pipelineId: input.pipelineId } : {}),
    });

    const updated = await opportunitiesRepository.findById(input.opportunityId, tenantId);
    if (!updated) {
      throw new OpportunityNotFoundError(input.opportunityId);
    }

    await registerAuditLog({
      tenantId,
      userId: input.actorId ?? null,
      action: AuditActions.OPPORTUNITY_MOVED,
      entity: 'Opportunity',
      entityId: updated.id,
      metadata: {
        previousPipelineId: current!.pipelineId,
        previousStageId: current!.stageId,
        pipelineId: updated.pipelineId,
        stageId: updated.stageId,
      },
    });

    return updated;
  }

  async archive(input: ArchiveOpportunityInput, scope: OpportunityAccessScope) {
    const tenantId = input.tenantId;
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    const current = await opportunitiesRepository.findById(input.opportunityId, tenantId);
    if (!current) {
      await this.throwNotFoundOrTenantScope('opportunity', input.opportunityId, tenantId);
    }

    if (!canAccessOpportunity(current, scope)) {
      throw new TenantScopeViolationError('opportunity', input.opportunityId);
    }

    await opportunitiesRepository.softDelete(input.opportunityId, tenantId);

    await registerAuditLog({
      tenantId,
      userId: input.actorId ?? null,
      action: AuditActions.OPPORTUNITY_ARCHIVED,
      entity: 'Opportunity',
      entityId: input.opportunityId,
      metadata: {
        archivedAt: new Date().toISOString(),
      },
    });
  }

  private async assertPipelineAndStageConsistency(input: {
    tenantId: string;
    pipelineId: string;
    stageId: string;
  }) {
    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id: input.pipelineId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });

    if (!pipeline) {
      await this.throwInvalidOrTenantScope('pipeline', input.pipelineId, input.tenantId);
    }

    const stage = await prisma.stage.findFirst({
      where: {
        id: input.stageId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });

    if (!stage) {
      await this.throwInvalidOrTenantScope('stage', input.stageId, input.tenantId);
    }

    if (stage!.pipelineId !== input.pipelineId) {
      throw new InvalidStageError(input.stageId);
    }
  }

  private async assertCustomerBelongsToTenant(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!customer) {
      await this.throwInvalidOrTenantScope('customer', customerId, tenantId);
    }
  }

  private async assertLeadBelongsToTenant(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!lead) {
      await this.throwInvalidOrTenantScope('lead', leadId, tenantId);
    }
  }

  private async throwNotFoundOrTenantScope(
    entity: 'opportunity',
    entityId: string,
    tenantId: string,
  ): Promise<never> {
    const existsAnyTenant = await prisma.opportunity.findFirst({
      where: { id: entityId },
      select: { id: true, tenantId: true },
    });

    if (existsAnyTenant && existsAnyTenant.tenantId !== tenantId) {
      throw new TenantScopeViolationError(entity, entityId);
    }

    throw new OpportunityNotFoundError(entityId);
  }

  private async throwInvalidOrTenantScope(
    entity: 'pipeline' | 'stage' | 'customer' | 'lead',
    entityId: string,
    tenantId: string,
  ): Promise<never> {
    const entityFinders = {
      pipeline: () => prisma.pipeline.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
      stage: () => prisma.stage.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
      customer: () => prisma.customer.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
      lead: () => prisma.lead.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
    };

    const existing = await entityFinders[entity]();
    if (existing && existing.tenantId !== tenantId) {
      throw new TenantScopeViolationError(entity, entityId);
    }

    if (entity === 'pipeline') throw new InvalidPipelineError(entityId);
    if (entity === 'stage') throw new InvalidStageError(entityId);
    if (entity === 'customer') throw new InvalidCustomerError(entityId);
    throw new InvalidLeadError(entityId);
  }
}

export const opportunitiesService = new OpportunitiesService();
