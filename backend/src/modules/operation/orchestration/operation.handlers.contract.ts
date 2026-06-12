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
import type { OperationListResult } from '../services/operation.service.contract.js';

// ARCH-024 to ARCH-026: orchestration contracts only, no handlers or runtime flow.
export type OperationExecutionContext = {
  tenantId: string;
  actorId?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
};

export interface OperationCommandHandler<TCommand, TResult> {
  handle(command: TCommand, context: OperationExecutionContext): Promise<TResult>;
}

export interface OperationQueryHandler<TQuery, TResult> {
  handle(query: TQuery, context: OperationExecutionContext): Promise<TResult>;
}

// ARCH-024 to ARCH-026: concrete handler contracts only, no implementation.
export interface CreateOperationHandlerContract
  extends OperationCommandHandler<CreateOperationCommand, OperationDTO> {}

export interface GetOperationByIdHandlerContract
  extends OperationQueryHandler<GetOperationByIdQuery, OperationDTO | null> {}

export interface GetOperationByNumberHandlerContract
  extends OperationQueryHandler<GetOperationByNumberQuery, OperationDTO | null> {}

export interface ListOperationsHandlerContract
  extends OperationQueryHandler<ListOperationsQuery, OperationListResult> {}

export interface ListOperationsByOpportunityHandlerContract
  extends OperationQueryHandler<
    Pick<ListOperationsQuery, 'tenantId' | 'opportunityId'>,
    OperationSummaryDTO[]
  > {}

export interface TransitionOperationStatusHandlerContract
  extends OperationCommandHandler<TransitionOperationStatusCommand, OperationDTO> {}

export interface GetOperationTimelineHandlerContract
  extends OperationQueryHandler<GetOperationTimelineQuery, OperationTimelineDTO> {}

export interface GetOperationFinancialSummaryHandlerContract
  extends OperationQueryHandler<
    GetOperationFinancialSummaryQuery,
    OperationFinancialSummaryDTO
  > {}
