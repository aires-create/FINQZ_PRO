import { describe, expect, it, vi } from 'vitest';

import type {
  OperationDTO,
  OperationSummaryDTO,
} from '../../../modules/operation/dto/operation.dto.js';
import type { OperationRepositoryContract } from '../../../modules/operation/repositories/operation.repository.contract.js';
import type { OperationNumberGenerator } from '../../../modules/operation/services/operation-number.generator.js';
import { OperationService } from '../../../modules/operation/services/operation.service.js';

const createRepositoryMock = (): OperationRepositoryContract => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByOperationNumber: vi.fn(),
  listByTenant: vi.fn(),
  listByOpportunity: vi.fn(),
  listByStatus: vi.fn(),
  updateStatus: vi.fn(),
  appendMetadata: vi.fn(),
  getTimeline: vi.fn(),
  getFinancialSummary: vi.fn(),
});

const createOperationNumberGeneratorMock = (): OperationNumberGenerator => ({
  next: vi.fn(),
});

const createUniqueConstraintError = (target: string[]) => ({
  code: 'P2002',
  meta: {
    target,
  },
});

describe('OperationService', () => {
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
  const summary: OperationSummaryDTO = {
    id: operationId,
    operationNumber,
    status: 'CREATED',
    amount: 1234.56,
    currency: 'BRL',
    opportunityId: '33333333-3333-3333-3333-333333333333',
  };

  it('createOperation delegates to repository.create with tenant context', async () => {
    const repository = createRepositoryMock();
    const createSpy = vi.mocked(repository.create);
    createSpy.mockResolvedValueOnce(baseOperation);
    const numberGenerator = createOperationNumberGeneratorMock();
    const numberGeneratorSpy = vi.mocked(numberGenerator.next);
    numberGeneratorSpy.mockResolvedValueOnce({
      operationNumber,
      year: 2026,
      sequence: 1,
    });
    const service = new OperationService(repository, numberGenerator);

    const result = await service.createOperation({
      tenantId,
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: null,
      createdById: '44444444-4444-4444-4444-444444444444',
      amount: 1234.56,
      currency: 'BRL',
      referenceDate: '2026-06-10T12:00:00.000Z',
      metadata: { source: 'unit-test' },
      notes: 'created from service',
      correlationId: 'corr-1',
    });

    expect(numberGeneratorSpy).toHaveBeenCalledWith({
      tenantId,
      requestedAt: expect.any(Date),
    });
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        operationNumber,
        year: 2026,
        sequence: 1,
        opportunityId: '33333333-3333-3333-3333-333333333333',
        createdById: '44444444-4444-4444-4444-444444444444',
        amount: 1234.56,
        currency: 'BRL',
        referenceDate: '2026-06-10T12:00:00.000Z',
        metadata: { source: 'unit-test' },
        notes: 'created from service',
        correlationId: 'corr-1',
      }),
    );
    expect(result).toBe(baseOperation);
  });

  it('retries createOperation when operation number unique constraint fails', async () => {
    const repository = createRepositoryMock();
    const createSpy = vi.mocked(repository.create);
    const numberGenerator = createOperationNumberGeneratorMock();
    const numberGeneratorSpy = vi.mocked(numberGenerator.next);
    numberGeneratorSpy
      .mockResolvedValueOnce({
        operationNumber,
        year: 2026,
        sequence: 1,
      })
      .mockResolvedValueOnce({
        operationNumber: 'OP-2026-000002',
        year: 2026,
        sequence: 2,
      });
    createSpy
      .mockRejectedValueOnce(
        createUniqueConstraintError(['tenantId', 'operationNumber']),
      )
      .mockResolvedValueOnce(baseOperation);

    const service = new OperationService(repository, numberGenerator);

    const result = await service.createOperation({
      tenantId,
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: null,
      createdById: '44444444-4444-4444-4444-444444444444',
      amount: 1234.56,
      currency: 'BRL',
      referenceDate: '2026-06-10T12:00:00.000Z',
      metadata: { source: 'unit-test' },
      notes: 'created from service',
      correlationId: 'corr-1',
    });

    expect(numberGeneratorSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(baseOperation);
  });

  it('getOperationById delegates to repository.findById', async () => {
    const repository = createRepositoryMock();
    const findByIdSpy = vi.mocked(repository.findById);
    findByIdSpy.mockResolvedValueOnce(baseOperation);
    const service = new OperationService(repository);

    const result = await service.getOperationById({
      tenantId,
      operationId,
    });

    expect(findByIdSpy).toHaveBeenCalledWith(tenantId, operationId);
    expect(result).toBe(baseOperation);
  });

  it('getOperationByNumber delegates to repository.findByOperationNumber', async () => {
    const repository = createRepositoryMock();
    const findByOperationNumberSpy = vi.mocked(repository.findByOperationNumber);
    findByOperationNumberSpy.mockResolvedValueOnce(baseOperation);
    const service = new OperationService(repository);

    const result = await service.getOperationByNumber({
      tenantId,
      operationNumber,
    });

    expect(findByOperationNumberSpy).toHaveBeenCalledWith(tenantId, operationNumber);
    expect(result).toBe(baseOperation);
  });

  it('listOperations delegates to repository.listByTenant and maps the response', async () => {
    const repository = createRepositoryMock();
    const listByTenantSpy = vi.mocked(repository.listByTenant);
    listByTenantSpy.mockResolvedValueOnce({
      data: [summary],
      total: 1,
      page: 2,
      limit: 25,
    });
    const service = new OperationService(repository);

    const result = await service.listOperations({
      tenantId,
      page: 2,
      limit: 25,
      status: 'CREATED',
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: undefined,
      createdById: '44444444-4444-4444-4444-444444444444',
      search: 'OP-2026',
    });

    expect(listByTenantSpy).toHaveBeenCalledWith({
      tenantId,
      page: 2,
      limit: 25,
      status: 'CREATED',
      opportunityId: '33333333-3333-3333-3333-333333333333',
      bankProposalId: undefined,
      createdById: '44444444-4444-4444-4444-444444444444',
      search: 'OP-2026',
    });
    expect(result).toEqual({
      items: [summary],
      total: 1,
      page: 2,
      limit: 25,
    });
  });

  it('rejects missing tenant context', async () => {
    const repository = createRepositoryMock();
    const service = new OperationService(repository);

    await expect(
      service.getOperationById({
        tenantId: ' ',
        operationId,
      }),
    ).rejects.toThrow('Missing tenant context');
  });

  it('keeps blocked methods explicit', async () => {
    const service = new OperationService(createRepositoryMock());

    await expect(
      service.listOperationsByOpportunity({
        tenantId,
        opportunityId: '33333333-3333-3333-3333-333333333333',
      }),
    ).rejects.toThrow('OperationService.listOperationsByOpportunity is not implemented yet');
    await expect(
      service.transitionOperationStatus({
        tenantId,
        operationId,
        previousStatus: 'CREATED',
        nextStatus: 'PROPOSAL_REQUESTED',
        actorId: '44444444-4444-4444-4444-444444444444',
      }),
    ).rejects.toThrow('OperationService.transitionOperationStatus is not implemented yet');
    await expect(
      service.getOperationTimeline({
        tenantId,
        operationId,
      }),
    ).rejects.toThrow('OperationService.getOperationTimeline is not implemented yet');
    await expect(
      service.getOperationFinancialSummary({
        tenantId,
        operationId,
      }),
    ).rejects.toThrow('OperationService.getOperationFinancialSummary is not implemented yet');
  });
});
