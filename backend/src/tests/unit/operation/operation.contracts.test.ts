import { OperationStatus as PrismaOperationStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import type { CreateOperationCommand, MarkOperationExecutedCommand, TransitionOperationStatusCommand } from '../../../modules/operation/application/operation.commands.js';
import type {
  GetOperationByIdQuery,
  GetOperationByNumberQuery,
  GetOperationFinancialSummaryQuery,
  GetOperationTimelineQuery,
  ListOperationsQuery,
} from '../../../modules/operation/application/operation.queries.js';
import type {
  OperationCommissionCalculatedEventPayload,
  OperationCreatedEventPayload,
  OperationEventEnvelope,
  OperationEventName,
  OperationExecutionEventPayload,
  OperationFailureEventPayload,
  OperationProposalEventPayload,
  OperationSettlementEventPayload,
  OperationStatusTransitionEventPayload,
} from '../../../modules/operation/domain/operation-events.js';
import type { OperationStatus } from '../../../modules/operation/domain/operation-status.js';
import type {
  OperationDTO,
  OperationFinancialSummaryDTO,
  OperationSummaryDTO,
  OperationTimelineDTO,
} from '../../../modules/operation/dto/operation.dto.js';
import type {
  OperationIdentityContract,
  OperationFinancialContract,
  OperationOwnershipContract,
  OperationPersistenceContract,
  OperationTraceContract,
} from '../../../modules/operation/contracts/operation.contracts.js';
import type {
  OperationRepositoryContract,
  OperationRepositoryCreateInput,
  OperationRepositoryListInput,
  OperationRepositoryListResult,
  OperationRepositoryUpdateStatusInput,
} from '../../../modules/operation/repositories/operation.repository.contract.js';
import type { OperationListResult, OperationServiceContract } from '../../../modules/operation/services/operation.service.contract.js';
import type {
  CreateOperationHandlerContract,
  GetOperationByIdHandlerContract,
  GetOperationByNumberHandlerContract,
  GetOperationFinancialSummaryHandlerContract,
  GetOperationTimelineHandlerContract,
    ListOperationsByOpportunityHandlerContract,
    ListOperationsHandlerContract,
    OperationCommandHandler,
    OperationExecutionContext,
    OperationQueryHandler,
  TransitionOperationStatusHandlerContract,
} from '../../../modules/operation/orchestration/operation.handlers.contract.js';
import {
  CreateOperationBodySchema,
  OperationIdParamsSchema,
  OperationListQuerySchema,
  OperationStatusTransitionBodySchema,
} from '../../../modules/operation/validators/operation.schema.js';

function expectType<T>(value: T): T {
  return value;
}

describe('operation contracts', () => {
  const validUuid = '11111111-1111-1111-1111-111111111111';

  it('exposes the public contract types with basic compatibility', () => {
    expect(CreateOperationBodySchema).toBeDefined();
    expect(OperationIdParamsSchema).toBeDefined();
    expect(OperationListQuerySchema).toBeDefined();
    expect(OperationStatusTransitionBodySchema).toBeDefined();

    const status: OperationStatus = PrismaOperationStatus.CREATED;
    const createdEventPayload: OperationCreatedEventPayload = {
      operationNumber: 'OP-2026-0001',
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      amount: 12500.75,
      currency: 'BRL',
      status,
    };
    const statusTransitionEventPayload: OperationStatusTransitionEventPayload = {
      previousStatus: status,
      nextStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
      actorId: validUuid,
    };
    const proposalEventPayload: OperationProposalEventPayload = {
      opportunityId: validUuid,
      bankProposalId: validUuid,
    };
    const executionEventPayload: OperationExecutionEventPayload = {
      executedAt: '2026-06-11T12:30:00.000Z',
      referenceDate: '2026-06-10T12:30:00.000Z',
      providerOperationId: 'provider-001',
      externalReference: 'external-001',
    };
    const failureEventPayload: OperationFailureEventPayload = {
      reason: 'integration failure',
      errorCode: 'OP_FAIL',
    };
    const commissionEventPayload: OperationCommissionCalculatedEventPayload = {
      amount: 321.45,
      currency: 'BRL',
    };
    const settlementEventPayload: OperationSettlementEventPayload = {
      settlementId: 'settlement-001',
      settlementStatus: 'confirmed',
    };
    const eventEnvelope: OperationEventEnvelope<'OperationCreated', OperationCreatedEventPayload> = {
      name: 'OperationCreated',
      tenantId: validUuid,
      operationId: validUuid,
      correlationId: 'corr-123',
      requestId: 'req-123',
      occurredAt: '2026-06-11T12:30:00.000Z',
      payload: createdEventPayload,
    };
    const dto: OperationDTO = {
      id: validUuid,
      tenantId: validUuid,
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      amount: 12500.75,
      currency: 'BRL',
      status,
      executedAt: '2026-06-11T12:30:00.000Z',
      referenceDate: '2026-06-10T12:30:00.000Z',
      providerOperationId: 'provider-001',
      externalReference: 'external-001',
      metadata: { source: 'unit-test' },
      notes: 'operation dto',
      correlationId: 'corr-123',
      deletedAt: null,
      createdAt: '2026-06-11T12:30:00.000Z',
      updatedAt: '2026-06-11T12:30:00.000Z',
    };
    const summaryDto: OperationSummaryDTO = {
      id: validUuid,
      operationNumber: 'OP-2026-0001',
      status,
      amount: 12500.75,
      currency: 'BRL',
      opportunityId: validUuid,
    };
    const timelineDto: OperationTimelineDTO = {
      operationId: validUuid,
      tenantId: validUuid,
      events: [
        {
          name: 'OperationCreated',
          occurredAt: '2026-06-11T12:30:00.000Z',
          status,
          correlationId: 'corr-123',
        },
      ],
    };
    const financialSummaryDto: OperationFinancialSummaryDTO = {
      operationId: validUuid,
      amount: 12500.75,
      currency: 'BRL',
      status,
      executedAt: '2026-06-11T12:30:00.000Z',
      referenceDate: '2026-06-10T12:30:00.000Z',
    };
    const identityContract: OperationIdentityContract = {
      id: validUuid,
      tenantId: validUuid,
      operationNumber: 'OP-2026-0001',
    };
    const ownershipContract: OperationOwnershipContract = {
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
    };
    const financialContract: OperationFinancialContract = {
      amount: 12500.75,
      currency: 'BRL',
      status,
      executedAt: null,
      referenceDate: null,
    };
    const traceContract: OperationTraceContract = {
      correlationId: 'corr-123',
      requestId: 'req-123',
      metadata: { source: 'unit-test' },
      notes: 'trace',
    };
    const persistenceContract: OperationPersistenceContract = {
      ...identityContract,
      ...ownershipContract,
      ...financialContract,
      ...traceContract,
      year: 2026,
      sequence: 1,
      providerOperationId: 'provider-001',
      externalReference: 'external-001',
      deletedAt: null,
      createdAt: '2026-06-11T12:30:00.000Z',
      updatedAt: '2026-06-11T12:30:00.000Z',
    };
    const repositoryCreateInput: OperationRepositoryCreateInput = {
      ...identityContract,
      ...ownershipContract,
      ...financialContract,
      ...traceContract,
      year: 2026,
      sequence: 1,
    };
    const repositoryUpdateStatusInput: OperationRepositoryUpdateStatusInput = {
      tenantId: validUuid,
      operationId: validUuid,
      previousStatus: status,
      nextStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
      actorId: validUuid,
      correlationId: 'corr-456',
    };
    const repositoryListInput: OperationRepositoryListInput = {
      tenantId: validUuid,
      page: 1,
      limit: 25,
      status,
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      search: 'operation',
    };
    const repositoryListResult: OperationRepositoryListResult = {
      data: [summaryDto],
      total: 1,
      page: 1,
      limit: 25,
    };
    const serviceListResult: OperationListResult = {
      items: [summaryDto],
      total: 1,
      page: 1,
      limit: 25,
    };
    const executionContext: OperationExecutionContext = {
      tenantId: validUuid,
      actorId: validUuid,
      requestId: 'req-123',
      correlationId: 'corr-123',
      idempotencyKey: 'idem-123',
    };
    const createCommand: CreateOperationCommand = {
      tenantId: validUuid,
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      amount: 12500.75,
      currency: 'BRL',
      referenceDate: '2026-06-10T12:30:00.000Z',
      metadata: { source: 'unit-test' },
      notes: 'create command',
      correlationId: 'corr-123',
    };
    const transitionCommand: TransitionOperationStatusCommand = {
      tenantId: validUuid,
      operationId: validUuid,
      previousStatus: status,
      nextStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
      actorId: validUuid,
      correlationId: 'corr-456',
    };
    const markExecutedCommand: MarkOperationExecutedCommand = {
      tenantId: validUuid,
      operationId: validUuid,
      executedById: validUuid,
      executedAt: '2026-06-11T12:30:00.000Z',
      referenceDate: '2026-06-10T12:30:00.000Z',
      providerOperationId: 'provider-001',
      externalReference: 'external-001',
      correlationId: 'corr-789',
    };
    const getByIdQuery: GetOperationByIdQuery = {
      tenantId: validUuid,
      operationId: validUuid,
    };
    const getByNumberQuery: GetOperationByNumberQuery = {
      tenantId: validUuid,
      operationNumber: 'OP-2026-0001',
    };
    const listQuery: ListOperationsQuery = {
      tenantId: validUuid,
      page: 1,
      limit: 25,
      status: 'CREATED',
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      search: 'operation',
    };
    const timelineQuery: GetOperationTimelineQuery = {
      tenantId: validUuid,
      operationId: validUuid,
    };
    const financialSummaryQuery: GetOperationFinancialSummaryQuery = {
      tenantId: validUuid,
      operationId: validUuid,
    };
    const commandHandler: OperationCommandHandler<CreateOperationCommand, OperationDTO> = {
      handle: async () => dto,
    };
    const queryHandler: OperationQueryHandler<GetOperationByIdQuery, OperationDTO | null> = {
      handle: async () => dto,
    };
    const createHandlerContract: CreateOperationHandlerContract = commandHandler;
    const getByIdHandlerContract: GetOperationByIdHandlerContract = queryHandler;
    const getByNumberHandlerContract: GetOperationByNumberHandlerContract = {
      handle: async () => dto,
    };
    const listHandlerContract: ListOperationsHandlerContract = {
      handle: async () => serviceListResult,
    };
    const listByOpportunityHandlerContract: ListOperationsByOpportunityHandlerContract = {
      handle: async () => [summaryDto],
    };
    const transitionHandlerContract: TransitionOperationStatusHandlerContract = {
      handle: async () => dto,
    };
    const timelineHandlerContract: GetOperationTimelineHandlerContract = {
      handle: async () => timelineDto,
    };
    const financialSummaryHandlerContract: GetOperationFinancialSummaryHandlerContract = {
      handle: async () => financialSummaryDto,
    };
    const repositoryContract: OperationRepositoryContract = {
      create: async () => dto,
      findById: async () => dto,
      findByOperationNumber: async () => dto,
      listByTenant: async () => repositoryListResult,
      listByOpportunity: async () => [summaryDto],
      listByStatus: async () => [summaryDto],
      updateStatus: async () => dto,
      appendMetadata: async () => dto,
      getTimeline: async () => timelineDto,
      getFinancialSummary: async () => financialSummaryDto,
    };
    const serviceContract: OperationServiceContract = {
      createOperation: async () => dto,
      getOperationById: async () => dto,
      getOperationByNumber: async () => dto,
      listOperations: async () => serviceListResult,
      listOperationsByOpportunity: async () => [summaryDto],
      transitionOperationStatus: async () => dto,
      getOperationTimeline: async () => timelineDto,
      getOperationFinancialSummary: async () => financialSummaryDto,
    };

    expect(status).toBe(PrismaOperationStatus.CREATED);
    expect(eventEnvelope.name).toBe('OperationCreated');
    expect(repositoryContract.create).toBeInstanceOf(Function);
    expect(serviceContract.createOperation).toBeInstanceOf(Function);
    expectType(createCommand);
    expectType(transitionCommand);
    expectType(markExecutedCommand);
    expectType(getByIdQuery);
    expectType(getByNumberQuery);
    expectType(listQuery);
    expectType(timelineQuery);
    expectType(financialSummaryQuery);
    expectType(repositoryCreateInput);
    expectType(repositoryUpdateStatusInput);
    expectType(repositoryListInput);
    expectType(persistenceContract);
    expectType(commandHandler);
    expectType(queryHandler);
    expectType(createHandlerContract);
    expectType(getByIdHandlerContract);
    expectType(getByNumberHandlerContract);
    expectType(listHandlerContract);
    expectType(listByOpportunityHandlerContract);
    expectType(transitionHandlerContract);
    expectType(timelineHandlerContract);
    expectType(financialSummaryHandlerContract);
    expectType(repositoryContract);
    expectType(serviceContract);
    expectType(createdEventPayload);
    expectType(statusTransitionEventPayload);
    expectType(proposalEventPayload);
    expectType(executionEventPayload);
    expectType(failureEventPayload);
    expectType(commissionEventPayload);
    expectType(settlementEventPayload);
    expectType(dto);
    expectType(summaryDto);
    expectType(timelineDto);
    expectType(financialSummaryDto);
    expectType(identityContract);
    expectType(ownershipContract);
    expectType(financialContract);
    expectType(traceContract);
    expectType(eventEnvelope);
    expectType(repositoryListResult);
    expectType(serviceListResult);
    expectType(executionContext);
  });

  it('keeps the declared event names aligned with the contract', () => {
    const expectedEventNames = [
      'OperationCreated',
      'OperationProposalRequested',
      'OperationProposalReceived',
      'OperationProposalApproved',
      'OperationProposalRejected',
      'OperationExecuted',
      'OperationFailed',
      'OperationCanceled',
      'CommissionCalculated',
      'SettlementRequested',
      'SettlementConfirmed',
      'SettlementFailed',
    ] as const satisfies readonly OperationEventName[];

    expect(expectedEventNames).toEqual([
      'OperationCreated',
      'OperationProposalRequested',
      'OperationProposalReceived',
      'OperationProposalApproved',
      'OperationProposalRejected',
      'OperationExecuted',
      'OperationFailed',
      'OperationCanceled',
      'CommissionCalculated',
      'SettlementRequested',
      'SettlementConfirmed',
      'SettlementFailed',
    ]);
  });

  it('keeps OperationStatus compatible with Prisma', () => {
    const statusValues = Object.values(PrismaOperationStatus);
    const domainStatus: OperationStatus = PrismaOperationStatus.SETTLED;
    const prismaStatus: PrismaOperationStatus = domainStatus;

    expect(statusValues).toEqual([
      'CREATED',
      'PROPOSAL_REQUESTED',
      'PROPOSAL_RECEIVED',
      'PROPOSAL_APPROVED',
      'EXECUTED',
      'COMMISSION_CALCULATED',
      'SETTLEMENT_PENDING',
      'SETTLED',
      'REJECTED',
      'FAILED',
      'CANCELED',
    ]);
    expect(prismaStatus).toBe(PrismaOperationStatus.SETTLED);
  });
});
