import type {
  CreateOperationCommand,
  TransitionOperationStatusCommand,
} from '../application/operation.commands.js';
import type {
  GetOperationByIdQuery,
  GetOperationByNumberQuery,
  GetOperationFinancialSummaryQuery,
  GetOperationTimelineQuery,
  ListOperationsQuery,
} from '../application/operation.queries.js';
import type {
  OperationDTO,
  OperationFinancialSummaryDTO,
  OperationSummaryDTO,
  OperationTimelineDTO,
} from '../dto/operation.dto.js';
import type {
  OperationRepositoryContract,
  OperationRepositoryListInput,
} from '../repositories/operation.repository.contract.js';
import { operationPrismaRepository } from '../repositories/operation.prisma.repository.js';
import type { OperationStatus } from '../domain/operation-status.js';
import {
  operationNumberGenerator,
  type OperationNumberGenerator,
} from './operation-number.generator.js';
import type { OperationListResult, OperationServiceContract } from './operation.service.contract.js';

const requireTenantContext = (tenantId?: string | null) => {
  if (!tenantId || !tenantId.trim()) {
    throw new Error('Missing tenant context');
  }

  return tenantId;
};

const MAX_CREATE_ATTEMPTS = 5;
const UNIQUE_CONSTRAINT_CODE = 'P2002';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isOperationNumberUniqueConstraintError = (error: unknown): boolean => {
  if (!isRecord(error) || error.code !== UNIQUE_CONSTRAINT_CODE) {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const target = meta?.target;

  if (typeof target === 'string') {
    return target.includes('operationNumber') || target.includes('year_sequence');
  }

  if (!isStringArray(target)) {
    return false;
  }

  const targetFields = new Set(target);

  return (
    (targetFields.has('tenantId') && targetFields.has('operationNumber')) ||
    (targetFields.has('tenantId') &&
      targetFields.has('year') &&
      targetFields.has('sequence'))
  );
};

const notImplemented = (method: string): never => {
  throw new Error(`OperationService.${method} is not implemented yet`);
};

export class OperationService implements OperationServiceContract {
  constructor(
    private readonly repository: OperationRepositoryContract = operationPrismaRepository,
    private readonly numberGenerator: OperationNumberGenerator = operationNumberGenerator,
  ) {}

  async createOperation(command: CreateOperationCommand): Promise<OperationDTO> {
    const tenantId = requireTenantContext(command.tenantId);
    const requestedAt = new Date();

    for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
      const generatedOperationNumber = await this.numberGenerator.next({
        tenantId,
        requestedAt,
      });

      try {
        return await this.repository.create({
          ...command,
          tenantId,
          operationNumber: generatedOperationNumber.operationNumber,
          year: generatedOperationNumber.year,
          sequence: generatedOperationNumber.sequence,
        } as never);
      } catch (error) {
        if (!isOperationNumberUniqueConstraintError(error) || attempt === MAX_CREATE_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Unable to generate operation number');
  }

  async getOperationById(query: GetOperationByIdQuery): Promise<OperationDTO | null> {
    const tenantId = requireTenantContext(query.tenantId);

    return this.repository.findById(tenantId, query.operationId);
  }

  async getOperationByNumber(
    query: GetOperationByNumberQuery,
  ): Promise<OperationDTO | null> {
    const tenantId = requireTenantContext(query.tenantId);

    return this.repository.findByOperationNumber(tenantId, query.operationNumber);
  }

  async listOperations(query: ListOperationsQuery): Promise<OperationListResult> {
    const tenantId = requireTenantContext(query.tenantId);
    const repositoryInput: OperationRepositoryListInput = {
      tenantId,
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.status !== undefined
        ? { status: query.status as OperationStatus }
        : {}),
      ...(query.opportunityId !== undefined ? { opportunityId: query.opportunityId } : {}),
      ...(query.bankProposalId !== undefined ? { bankProposalId: query.bankProposalId } : {}),
      ...(query.createdById !== undefined ? { createdById: query.createdById } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
    };

    const result = await this.repository.listByTenant(repositoryInput);

    return {
      items: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  listOperationsByOpportunity(
    _query: Pick<ListOperationsQuery, 'tenantId' | 'opportunityId'>,
  ): Promise<OperationSummaryDTO[]> {
    return Promise.reject(new Error('OperationService.listOperationsByOpportunity is not implemented yet'));
  }

  transitionOperationStatus(
    _command: TransitionOperationStatusCommand,
  ): Promise<OperationDTO> {
    return Promise.reject(new Error('OperationService.transitionOperationStatus is not implemented yet'));
  }

  getOperationTimeline(
    _query: GetOperationTimelineQuery,
  ): Promise<OperationTimelineDTO> {
    return Promise.reject(new Error('OperationService.getOperationTimeline is not implemented yet'));
  }

  getOperationFinancialSummary(
    _query: GetOperationFinancialSummaryQuery,
  ): Promise<OperationFinancialSummaryDTO> {
    return Promise.reject(new Error('OperationService.getOperationFinancialSummary is not implemented yet'));
  }
}

export const operationService = new OperationService();
