import { Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../shared/errors/AppError.js';
import type { TenantContext } from '../../../shared/types/index.js';
import { registerAuditLog } from '../../audit/services/audit.service.js';
import {
  customersRepository,
  type CreateCustomerRepositoryInput,
} from '../../crm/repositories/customers.repository.js';
import type {
  CreateOpportunityIntakeBodyDto,
  CreateOpportunityIntakeCustomerDto,
  CreateOpportunityIntakeResponseDto,
} from '../dto/opportunities.dto.js';
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
  productId?: string | null;
  subproductId?: string | null;
  modalityId?: string | null;
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
  productId?: string | null;
  subproductId?: string | null;
  modalityId?: string | null;
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

type OpportunitiesPrismaClient = typeof prisma | Prisma.TransactionClient;

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

const normalizeEmail = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
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
  if (input.productId !== undefined) data.productId = normalizeText(input.productId);
  if (input.subproductId !== undefined) data.subproductId = normalizeText(input.subproductId);
  if (input.modalityId !== undefined) data.modalityId = normalizeText(input.modalityId);
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

    await this.assertOpportunityProductHierarchyConsistency(
      {
        tenantId,
        productId: scopedInput.productId ?? null,
        subproductId: scopedInput.subproductId ?? null,
        modalityId: scopedInput.modalityId ?? null,
      },
      prisma,
    );

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
      productId: normalizeText(scopedInput.productId),
      subproductId: normalizeText(scopedInput.subproductId),
      modalityId: normalizeText(scopedInput.modalityId),
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
        productId: created.productId,
        subproductId: created.subproductId,
        modalityId: created.modalityId,
        customerId: created.customerId,
        leadId: created.leadId,
      },
    });

    return created;
  }

  async createOpportunityIntake(
    tenantId: string,
    userId: string,
    body: CreateOpportunityIntakeBodyDto,
  ): Promise<CreateOpportunityIntakeResponseDto> {
    if (!tenantId) throw new TenantScopeViolationError('tenant', 'missing');

    return prisma.$transaction(async (tx) => {
      await this.assertPipelineAndStageConsistency(
        {
          tenantId,
          pipelineId: body.opportunity.pipelineId,
          stageId: body.opportunity.stageId,
        },
        tx,
      );

      await this.assertOpportunityProductHierarchyConsistency(
        {
          tenantId,
          productId: body.opportunity.productId ?? null,
          subproductId: body.opportunity.subproductId ?? null,
          modalityId: body.opportunity.modalityId ?? null,
        },
        tx,
      );

      const resolvedCustomer = await this.resolveCustomerForIntake(
        tenantId,
        body.customer,
        body.options?.allowCreateCustomer !== false,
        tx,
      );
      const customerId = resolvedCustomer.customer.id;

      const createdOpportunity = await opportunitiesRepository.create(
        {
          tenantId,
          title: body.opportunity.title.trim(),
          description: normalizeText(body.opportunity.description),
          amount: body.opportunity.amount,
          currency: body.opportunity.currency?.trim() ?? 'BRL',
          probability: body.opportunity.probability ?? 50,
          status: 'open',
          expectedCloseDate: parseOptionalDate(body.opportunity.expectedCloseDate),
          actualCloseDate: null,
          partnerId: null,
          leadId: null,
          customerId,
          productId: normalizeText(body.opportunity.productId),
          subproductId: normalizeText(body.opportunity.subproductId),
          modalityId: normalizeText(body.opportunity.modalityId),
          pipelineId: body.opportunity.pipelineId,
          stageId: body.opportunity.stageId,
          ownerId: normalizeText(body.opportunity.ownerId) ?? userId,
        },
        tx,
      );

      return {
        customer: {
          id: customerId,
          status: resolvedCustomer.status,
        },
        opportunity: {
          id: createdOpportunity.id,
          customerId: createdOpportunity.customerId ?? customerId,
          pipelineId: createdOpportunity.pipelineId,
          stageId: createdOpportunity.stageId,
          productId: createdOpportunity.productId,
          subproductId: createdOpportunity.subproductId,
          modalityId: createdOpportunity.modalityId,
        },
      };
    });
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
    const nextProductId = scopedInput.productId ?? current!.productId ?? null;
    const nextSubproductId = scopedInput.subproductId ?? current!.subproductId ?? null;
    const nextModalityId = scopedInput.modalityId ?? current!.modalityId ?? null;

    if (scopedInput.pipelineId !== undefined || scopedInput.stageId !== undefined) {
      await this.assertPipelineAndStageConsistency({
        tenantId,
        pipelineId: nextPipelineId,
        stageId: nextStageId,
      });
    }

    await this.assertOpportunityProductHierarchyConsistency(
      {
        tenantId,
        productId: nextProductId,
        subproductId: nextSubproductId,
        modalityId: nextModalityId,
      },
      prisma,
    );

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
        productId: updated.productId,
        subproductId: updated.subproductId,
        modalityId: updated.modalityId,
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

  private async assertPipelineAndStageConsistency(
    input: {
      tenantId: string;
      pipelineId: string;
      stageId: string;
    },
    client: OpportunitiesPrismaClient = prisma,
  ) {
    const pipeline = await client.pipeline.findFirst({
      where: {
        id: input.pipelineId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });

    if (!pipeline) {
      await this.throwInvalidOrTenantScope('pipeline', input.pipelineId, input.tenantId);
    }

    const stage = await client.stage.findFirst({
      where: {
        id: input.stageId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });

    if (!stage) {
      await this.throwInvalidOrTenantScope('stage', input.stageId, input.tenantId);
    }

    if (stage!.isActive === false) {
      await this.throwInvalidOrTenantScope('stage', input.stageId, input.tenantId);
    }

    if (stage!.pipelineId !== input.pipelineId) {
      throw new InvalidStageError(input.stageId);
    }
  }

  private async assertOpportunityProductHierarchyConsistency(
    input: {
      tenantId: string;
      productId?: string | null;
      subproductId?: string | null;
      modalityId?: string | null;
    },
    client: OpportunitiesPrismaClient = prisma,
  ) {
    const productId = normalizeText(input.productId);
    const subproductId = normalizeText(input.subproductId);
    const modalityId = normalizeText(input.modalityId);

    if (!productId && !subproductId && !modalityId) {
      return;
    }

    if (subproductId && !productId) {
      throw new BadRequestError('subproductId requires productId');
    }

    if (modalityId && !subproductId) {
      throw new BadRequestError('modalityId requires subproductId');
    }

    if (productId) {
      const product = await client.masterCatalogProduct.findFirst({
        where: {
          id: productId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!product) {
        await this.throwInvalidOrTenantScope('product', productId, input.tenantId);
      }
    }

    if (subproductId) {
      const subproduct = await client.masterCatalogSubproduct.findFirst({
        where: {
          id: subproductId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          productId: true,
        },
      });

      if (!subproduct) {
        await this.throwInvalidOrTenantScope('subproduct', subproductId, input.tenantId);
      }

      if (productId && subproduct!.productId !== productId) {
        throw new BadRequestError('subproductId does not belong to productId');
      }
    }

    if (modalityId) {
      const modality = await client.masterCatalogModality.findFirst({
        where: {
          id: modalityId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          subproductId: true,
        },
      });

      if (!modality) {
        await this.throwInvalidOrTenantScope('modality', modalityId, input.tenantId);
      }

      if (subproductId && modality!.subproductId !== subproductId) {
        throw new BadRequestError('modalityId does not belong to subproductId');
      }
    }
  }

  private async resolveCustomerForIntake(
    tenantId: string,
    customer: CreateOpportunityIntakeCustomerDto,
    allowCreateCustomer: boolean,
    tx: Prisma.TransactionClient,
  ) {
    if (customer.id) {
      const existingById = await customersRepository.findById(tenantId, customer.id, tx);

      if (!existingById) {
        await this.throwInvalidOrTenantScope('customer', customer.id, tenantId);
      }
      const customerById = existingById!;

      return {
        customer: customerById,
        status: 'linked_existing' as const,
      };
    }

    const cpfCnpj = normalizeText(customer.cpfCnpj);
    const email = normalizeText(customer.email);
    const emailNormalized = normalizeEmail(customer.email);

    const [existingByCpfCnpj, existingByEmail] = await Promise.all([
      cpfCnpj ? customersRepository.findByCpf(tenantId, cpfCnpj, tx) : Promise.resolve(null),
      emailNormalized
        ? customersRepository.findByEmailNormalized(tenantId, emailNormalized, tx)
        : Promise.resolve(null),
    ]);

    if (
      existingByCpfCnpj &&
      existingByEmail &&
      existingByCpfCnpj.id !== existingByEmail.id
    ) {
      throw new ConflictError(
        'Conflito de identidade: CPF/CNPJ e e-mail pertencem a clientes diferentes.',
      );
    }

    const existingCustomer = existingByCpfCnpj ?? existingByEmail;
    if (existingCustomer) {
      return {
        customer: existingCustomer,
        status: 'linked_existing' as const,
      };
    }

    if (!allowCreateCustomer) {
      throw new NotFoundError('Customer not found and automatic creation is disabled');
    }

    const firstName = normalizeText(customer.firstName);
    const lastName = normalizeText(customer.lastName);

    if (!firstName) {
      throw new BadRequestError('Customer firstName is required when customer creation is allowed');
    }

    if (!lastName) {
      throw new BadRequestError('Customer lastName is required when customer creation is allowed');
    }

    if (!email) {
      throw new BadRequestError('Customer email is required when customer creation is allowed');
    }

    if (!emailNormalized) {
      throw new BadRequestError('Customer email is required when customer creation is allowed');
    }

    if (!cpfCnpj) {
      throw new BadRequestError('Customer CPF/CNPJ is required when customer creation is allowed');
    }

    const createdCustomer = await tx.customer.create({
      data: this.buildCustomerCreateDataForIntake(tenantId, customer, {
        firstName,
        lastName,
        email,
        emailNormalized,
        cpfCnpj,
      }),
    });

    return {
      customer: createdCustomer,
      status: 'created' as const,
    };
  }

  private buildCustomerCreateDataForIntake(
    tenantId: string,
    customer: CreateOpportunityIntakeCustomerDto,
    required: {
      firstName: string;
      lastName: string;
      email: string;
      emailNormalized: string;
      cpfCnpj: string;
    },
  ): CreateCustomerRepositoryInput {
    return {
      tenantId,
      customerCode: `CUST-${Date.now()}`,
      firstName: required.firstName,
      lastName: required.lastName,
      email: required.email,
      emailNormalized: required.emailNormalized,
      cpf: required.cpfCnpj,
      phone: normalizeText(customer.phone),
      birthDate: parseOptionalDate(customer.birthDate),
      profession: normalizeText(customer.profession),
      maritalStatus: normalizeText(customer.maritalStatus),
      gender: normalizeText(customer.gender),
      documentType: normalizeText(customer.documentType),
      address: (customer.address as Prisma.InputJsonValue | null | undefined) ?? Prisma.JsonNull,
      bankData: (customer.bankData as Prisma.InputJsonValue | null | undefined) ?? Prisma.JsonNull,
      notes: normalizeText(customer.notes),
      isActive: true,
      partnerId: null,
      leadId: null,
      parentCustomerId: null,
    };
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
    entity: 'pipeline' | 'stage' | 'customer' | 'lead' | 'product' | 'subproduct' | 'modality',
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
      product: () => prisma.masterCatalogProduct.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
      subproduct: () => prisma.masterCatalogSubproduct.findFirst({
        where: { id: entityId },
        select: { id: true, tenantId: true },
      }),
      modality: () => prisma.masterCatalogModality.findFirst({
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
