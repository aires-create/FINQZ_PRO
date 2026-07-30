import { describe, expect, it, vi } from 'vitest';

import type { CreateOperationCommand } from '../../../modules/operation/application/operation.commands.js';
import type {
  GetOperationByIdQuery,
  GetOperationByNumberQuery,
  ListOperationsQuery,
} from '../../../modules/operation/application/operation.queries.js';
import type { OperationDTO } from '../../../modules/operation/dto/operation.dto.js';
import type { OperationServiceContract } from '../../../modules/operation/services/operation.service.contract.js';
import {
  CreateOperationHandler,
  GetOperationByIdHandler,
  GetOperationByNumberHandler,
  ListOperationsHandler,
} from '../../../modules/operation/orchestration/operation.handlers.js';

const createServiceMock = (): OperationServiceContract => ({
  createOperation: vi.fn(),
  getOperationById: vi.fn(),
  getOperationByNumber: vi.fn(),
  listOperations: vi.fn(),
  listOperationsByOpportunity: vi.fn(),
  transitionOperationStatus: vi.fn(),
  getOperationTimeline: vi.fn(),
  getOperationFinancialSummary: vi.fn(),
});

describe('operation handlers', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const operationId = '22222222-2222-2222-2222-222222222222';
  const operationNumber = 'OP-2026-0001';
  const baseOperation: OperationDTO = {
    id: operationId,
    tenantId,
    operationNumber,
    year: 2026,
    sequence: 1,
    opportunityId: '33333333-3333-3333-3333-333333333333',
    bankProposalId: null,
    createdById: '44444444-4444-4444-4444-444444444444',
    amount: 1234.56,
    currency: 'BRL',
    status: 'CREATED',
    executedAt: null,
    referenceDate: null,
    providerOperationId: null,
    externalReference: null,
    metadata: null,
    notes: null,
    correlationId: null,
    deletedAt: null,
    createdAt: '2026-06-11T12:00:00.000Z',
    updatedAt: '2026-06-11T12:00:00.000Z',
  };

  it('CreateOperationHandler delegates to OperationService', async () => {
    const service = createServiceMock();
    const serviceSpy = vi.mocked(service.createOperation);
    serviceSpy.mockResolvedValueOnce(baseOperation);
    const handler = new CreateOperationHandler(service);
    const command: CreateOperationCommand = {
      tenantId,
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: null,
      createdById: '44444444-4444-4444-4444-444444444444',
      amount: 1234.56,
      currency: 'BRL',
      referenceDate: '2026-06-10T12:00:00.000Z',
      metadata: { source: 'handler-test' },
      notes: 'create',
      correlationId: 'corr-1',
    };

    const result = await handler.handle(command, {
      tenantId,
      actorId: '44444444-4444-4444-4444-444444444444',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
    });

    expect(serviceSpy).toHaveBeenCalledWith(command);
    expect(result).toBe(baseOperation);
  });

  it('GetOperationByIdHandler delegates to OperationService', async () => {
    const service = createServiceMock();
    const serviceSpy = vi.mocked(service.getOperationById);
    serviceSpy.mockResolvedValueOnce(baseOperation);
    const handler = new GetOperationByIdHandler(service);
    const query: GetOperationByIdQuery = {
      tenantId,
      operationId,
    };

    const result = await handler.handle(query, {
      tenantId,
      actorId: '44444444-4444-4444-4444-444444444444',
      requestId: 'req-2',
      correlationId: 'corr-2',
    });

    expect(serviceSpy).toHaveBeenCalledWith(query);
    expect(result).toBe(baseOperation);
  });

  it('GetOperationByNumberHandler delegates to OperationService', async () => {
    const service = createServiceMock();
    const serviceSpy = vi.mocked(service.getOperationByNumber);
    serviceSpy.mockResolvedValueOnce(baseOperation);
    const handler = new GetOperationByNumberHandler(service);
    const query: GetOperationByNumberQuery = {
      tenantId,
      operationNumber,
    };

    const result = await handler.handle(query, {
      tenantId,
      actorId: '44444444-4444-4444-4444-444444444444',
      requestId: 'req-3',
      correlationId: 'corr-3',
    });

    expect(serviceSpy).toHaveBeenCalledWith(query);
    expect(result).toBe(baseOperation);
  });

  it('ListOperationsHandler delegates to OperationService', async () => {
    const service = createServiceMock();
    const serviceSpy = vi.mocked(service.listOperations);
    serviceSpy.mockResolvedValueOnce({
      items: [baseOperation],
      total: 1,
      page: 1,
      limit: 25,
    });
    const handler = new ListOperationsHandler(service);
    const query: ListOperationsQuery = {
      tenantId,
      page: 1,
      limit: 25,
      status: 'CREATED',
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: undefined,
      createdById: '44444444-4444-4444-4444-444444444444',
      search: 'OP-2026',
    };

    const result = await handler.handle(query, {
      tenantId,
      actorId: '44444444-4444-4444-4444-444444444444',
      requestId: 'req-4',
      correlationId: 'corr-4',
    });

    expect(serviceSpy).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      items: [baseOperation],
      total: 1,
      page: 1,
      limit: 25,
    });
  });
});
