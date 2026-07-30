import { Prisma, type Operation as PrismaOperation } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { tenantFilter } from '../../../core/prisma/filters.js';
import type { OperationStatus } from '../domain/operation-status.js';
import type {
  OperationFinancialSummaryDTO,
  OperationDTO,
  OperationSummaryDTO,
  OperationTimelineDTO,
} from '../dto/operation.dto.js';
import type {
  OperationRepositoryContract,
  OperationRepositoryCreateInput,
  OperationRepositoryListInput,
  OperationRepositoryListResult,
  OperationRepositoryUpdateStatusInput,
} from './operation.repository.contract.js';
import type { OperationPersistenceContract as OperationPersistenceContractModel } from '../contracts/operation.contracts.js';

type OperationPrismaClient = typeof prisma | Prisma.TransactionClient;
type OperationCreateInput =
  | OperationPersistenceContractModel
  | OperationRepositoryCreateInput;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const toIsoString = (value?: Date | null) => value?.toISOString() ?? null;

const toDate = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  return new Date(value);
};

const normalizeMetadata = (
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const requireNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(label);
  }

  return value;
};

const toOperationDTO = (operation: PrismaOperation): OperationDTO => ({
  id: operation.id,
  tenantId: operation.tenantId,
  operationNumber: operation.operationNumber,
  year: operation.year,
  sequence: operation.sequence,
  opportunityId: operation.opportunityId,
  bankProposalId: operation.bankProposalId,
  createdById: operation.createdById,
  amount: operation.amount,
  currency: operation.currency,
  status: operation.status,
  executedAt: toIsoString(operation.executedAt),
  referenceDate: toIsoString(operation.referenceDate),
  providerOperationId: operation.providerOperationId,
  externalReference: operation.externalReference,
  metadata: normalizeMetadata(operation.metadata),
  notes: operation.notes,
  correlationId: operation.correlationId,
  deletedAt: toIsoString(operation.deletedAt),
  createdAt: operation.createdAt.toISOString(),
  updatedAt: operation.updatedAt.toISOString(),
});

const toOperationSummaryDTO = (
  operation: PrismaOperation,
): OperationSummaryDTO => ({
  id: operation.id,
  operationNumber: operation.operationNumber,
  status: operation.status,
  amount: operation.amount,
  currency: operation.currency,
  opportunityId: operation.opportunityId,
});

const buildListWhere = (
  input: OperationRepositoryListInput,
): Prisma.OperationWhereInput => {
  const where: Prisma.OperationWhereInput = {
    ...tenantFilter(input.tenantId),
    deletedAt: null,
  };

  if (input.status) {
    where.status = input.status;
  }

  if (input.opportunityId) {
    where.opportunityId = input.opportunityId;
  }

  if (input.bankProposalId) {
    where.bankProposalId = input.bankProposalId;
  }

  if (input.createdById) {
    where.createdById = input.createdById;
  }

  const search = input.search?.trim();
  if (search) {
    where.OR = [
      {
        operationNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        providerOperationId: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        externalReference: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        notes: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        correlationId: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

const notImplemented = (method: string): never => {
  throw new Error(`OperationPrismaRepository.${method} is not implemented yet`);
};

const buildCreateData = (
  input: OperationCreateInput,
): Prisma.OperationUncheckedCreateInput => {
  const persistenceInput = input as Partial<OperationPersistenceContractModel>;
  const operationNumber = requireNonEmptyString(
    persistenceInput.operationNumber,
    'Missing operation number',
  );
  const tenantId = requireNonEmptyString(input.tenantId, 'Missing tenant context');

  return {
    tenantId,
    operationNumber,
    year: input.year,
    sequence: input.sequence,
    opportunityId: input.opportunityId,
    bankProposalId: input.bankProposalId ?? null,
    createdById: input.createdById,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    providerOperationId: persistenceInput.providerOperationId ?? null,
    externalReference: persistenceInput.externalReference ?? null,
    notes: input.notes ?? null,
    correlationId: input.correlationId ?? null,
    ...(input.metadata === undefined
      ? {}
      : input.metadata === null
        ? { metadata: Prisma.DbNull }
        : { metadata: input.metadata as Prisma.InputJsonValue }),
    ...(input.executedAt ? { executedAt: new Date(input.executedAt) } : {}),
    ...(input.referenceDate ? { referenceDate: new Date(input.referenceDate) } : {}),
    ...(persistenceInput.deletedAt ? { deletedAt: new Date(persistenceInput.deletedAt) } : {}),
    ...(persistenceInput.createdAt ? { createdAt: new Date(persistenceInput.createdAt) } : {}),
    ...(persistenceInput.updatedAt ? { updatedAt: new Date(persistenceInput.updatedAt) } : {}),
  };
};

export class OperationPrismaRepository implements OperationRepositoryContract {
  constructor(private readonly client: OperationPrismaClient = prisma) {}

  async create(
    input: OperationCreateInput,
  ): Promise<OperationDTO> {
    const operation = await this.client.operation.create({
      data: buildCreateData(input),
    });

    return toOperationDTO(operation);
  }

  async findById(
    tenantId: string,
    operationId: string,
  ): Promise<OperationDTO | null> {
    const operation = await this.client.operation.findFirst({
      where: {
        id: operationId,
        ...tenantFilter(tenantId),
        deletedAt: null,
      },
    });

    return operation ? toOperationDTO(operation) : null;
  }

  async findByOperationNumber(
    tenantId: string,
    operationNumber: string,
  ): Promise<OperationDTO | null> {
    const operation = await this.client.operation.findFirst({
      where: {
        operationNumber,
        ...tenantFilter(tenantId),
        deletedAt: null,
      },
    });

    return operation ? toOperationDTO(operation) : null;
  }

  async listByTenant(
    input: OperationRepositoryListInput,
  ): Promise<OperationRepositoryListResult> {
    const page = input.page ?? DEFAULT_PAGE;
    const limit = input.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = buildListWhere(input);

    const [data, total] = await Promise.all([
      this.client.operation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.client.operation.count({
        where,
      }),
    ]);

    return {
      data: data.map(toOperationSummaryDTO),
      total,
      page,
      limit,
    };
  }

  async listByOpportunity(
    _tenantId: string,
    _opportunityId: string,
  ): Promise<OperationSummaryDTO[]> {
    return notImplemented('listByOpportunity');
  }

  async listByStatus(
    _tenantId: string,
    _status: OperationStatus,
  ): Promise<OperationSummaryDTO[]> {
    return notImplemented('listByStatus');
  }

  async updateStatus(
    _input: OperationRepositoryUpdateStatusInput,
  ): Promise<OperationDTO> {
    return notImplemented('updateStatus');
  }

  async appendMetadata(
    _tenantId: string,
    _operationId: string,
    _metadata: Record<string, unknown>,
    _correlationId?: string | null,
  ): Promise<OperationDTO> {
    return notImplemented('appendMetadata');
  }

  async getTimeline(
    _tenantId: string,
    _operationId: string,
  ): Promise<OperationTimelineDTO> {
    return notImplemented('getTimeline');
  }

  async getFinancialSummary(
    _tenantId: string,
    _operationId: string,
  ): Promise<OperationFinancialSummaryDTO> {
    return notImplemented('getFinancialSummary');
  }
}

export const operationPrismaRepository = new OperationPrismaRepository();
