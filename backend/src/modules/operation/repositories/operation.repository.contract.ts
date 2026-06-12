import type {
  OperationFinancialContract,
  OperationIdentityContract,
  OperationOwnershipContract,
  OperationPersistenceContract,
  OperationTraceContract,
} from '../contracts/operation.contracts.js';
import type { OperationStatus } from '../domain/operation-status.js';
import type { OperationStatusTransition } from '../domain/operation-transition.contract.js';
import type {
  OperationDTO,
  OperationFinancialSummaryDTO,
  OperationSummaryDTO,
  OperationTimelineDTO,
} from '../dto/operation.dto.js';

// ARCH-021 to ARCH-026: repository contract only, no Prisma implementation.
export interface OperationRepositoryCreateInput
  extends OperationIdentityContract,
    OperationOwnershipContract,
    OperationFinancialContract,
    OperationTraceContract {
  year: number;
  sequence: number;
  bankProposalId?: string | null;
}

export interface OperationRepositoryUpdateStatusInput
  extends OperationStatusTransition {
  tenantId: string;
  operationId: string;
  actorId: string;
  correlationId?: string | null;
}

export interface OperationRepositoryListInput {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: OperationStatus;
  opportunityId?: string;
  bankProposalId?: string;
  createdById?: string;
  search?: string;
}

export interface OperationRepositoryListResult {
  data: OperationSummaryDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface OperationRepositoryContract {
  create(input: OperationPersistenceContract | OperationRepositoryCreateInput): Promise<OperationDTO>;
  findById(tenantId: string, operationId: string): Promise<OperationDTO | null>;
  findByOperationNumber(
    tenantId: string,
    operationNumber: string,
  ): Promise<OperationDTO | null>;
  listByTenant(input: OperationRepositoryListInput): Promise<OperationRepositoryListResult>;
  listByOpportunity(
    tenantId: string,
    opportunityId: string,
  ): Promise<OperationSummaryDTO[]>;
  listByStatus(
    tenantId: string,
    status: OperationStatus,
  ): Promise<OperationSummaryDTO[]>;
  updateStatus(input: OperationRepositoryUpdateStatusInput): Promise<OperationDTO>;
  appendMetadata(
    tenantId: string,
    operationId: string,
    metadata: Record<string, unknown>,
    correlationId?: string | null,
  ): Promise<OperationDTO>;
  getTimeline(tenantId: string, operationId: string): Promise<OperationTimelineDTO>;
  getFinancialSummary(
    tenantId: string,
    operationId: string,
  ): Promise<OperationFinancialSummaryDTO>;
}
