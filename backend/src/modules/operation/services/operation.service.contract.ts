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

// ARCH-023 to ARCH-026: service contract only, no implementation or side effects.
export interface OperationListResult {
  items: OperationSummaryDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface OperationServiceContract {
  createOperation(command: CreateOperationCommand): Promise<OperationDTO>;

  getOperationById(query: GetOperationByIdQuery): Promise<OperationDTO | null>;

  getOperationByNumber(
    query: GetOperationByNumberQuery,
  ): Promise<OperationDTO | null>;

  listOperations(query: ListOperationsQuery): Promise<OperationListResult>;

  listOperationsByOpportunity(
    query: Pick<ListOperationsQuery, 'tenantId' | 'opportunityId'>,
  ): Promise<OperationSummaryDTO[]>;

  transitionOperationStatus(
    command: TransitionOperationStatusCommand,
  ): Promise<OperationDTO>;

  getOperationTimeline(
    query: GetOperationTimelineQuery,
  ): Promise<OperationTimelineDTO>;

  getOperationFinancialSummary(
    query: GetOperationFinancialSummaryQuery,
  ): Promise<OperationFinancialSummaryDTO>;
}
