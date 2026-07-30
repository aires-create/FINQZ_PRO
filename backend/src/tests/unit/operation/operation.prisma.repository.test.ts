import { describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  operation: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { operationPrismaRepository } from '../../../modules/operation/repositories/operation.prisma.repository.js';

describe('operationPrismaRepository', () => {
  it('create persists operation with tenant enforcement', async () => {
    prismaMock.operation.create.mockResolvedValueOnce({
      id: 'op-1',
      tenantId: 'tenant-a',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: 'bank-1',
      createdById: 'user-1',
      amount: 1234.56,
      currency: 'BRL',
      status: 'CREATED',
      executedAt: null,
      referenceDate: null,
      providerOperationId: null,
      externalReference: null,
      metadata: { source: 'unit-test' },
      notes: null,
      correlationId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-11T12:00:00.000Z'),
      updatedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    const result = await operationPrismaRepository.create({
      id: 'op-1',
      tenantId: 'tenant-a',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: 'bank-1',
      createdById: 'user-1',
      amount: 1234.56,
      currency: 'BRL',
      status: 'CREATED',
      referenceDate: '2026-06-10T12:00:00.000Z',
      metadata: { source: 'unit-test' },
      notes: null,
      correlationId: null,
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:00:00.000Z',
    });

    expect(prismaMock.operation.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        operationNumber: 'OP-2026-0001',
        year: 2026,
        sequence: 1,
        opportunityId: 'opp-1',
        bankProposalId: 'bank-1',
        createdById: 'user-1',
        amount: 1234.56,
        currency: 'BRL',
        status: 'CREATED',
        executedAt: undefined,
        referenceDate: new Date('2026-06-10T12:00:00.000Z'),
        providerOperationId: null,
        externalReference: null,
        metadata: { source: 'unit-test' },
        notes: null,
        correlationId: null,
        deletedAt: undefined,
        createdAt: new Date('2026-06-11T12:00:00.000Z'),
        updatedAt: new Date('2026-06-11T12:00:00.000Z'),
      },
    });
    expect(result).toEqual({
      id: 'op-1',
      tenantId: 'tenant-a',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: 'bank-1',
      createdById: 'user-1',
      amount: 1234.56,
      currency: 'BRL',
      status: 'CREATED',
      executedAt: null,
      referenceDate: null,
      providerOperationId: null,
      externalReference: null,
      metadata: { source: 'unit-test' },
      notes: null,
      correlationId: null,
      deletedAt: null,
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:00:00.000Z',
    });
  });

  it('create rejects payload without operation number', async () => {
    await expect(
      operationPrismaRepository.create({
        tenantId: 'tenant-a',
        year: 2026,
        sequence: 1,
        opportunityId: 'opp-1',
        bankProposalId: 'bank-1',
        createdById: 'user-1',
        amount: 1234.56,
        currency: 'BRL',
        status: 'CREATED',
        referenceDate: null,
      } as never),
    ).rejects.toThrow('Missing operation number');
  });

  it('findById respects tenant isolation', async () => {
    prismaMock.operation.findFirst.mockResolvedValueOnce({
      id: 'op-1',
      tenantId: 'tenant-a',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: null,
      createdById: 'user-1',
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
      createdAt: new Date('2026-06-11T12:00:00.000Z'),
      updatedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    await operationPrismaRepository.findById('tenant-a', 'op-1');

    expect(prismaMock.operation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'op-1',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
    });
  });

  it('findByOperationNumber respects tenant isolation', async () => {
    prismaMock.operation.findFirst.mockResolvedValueOnce(null);

    await operationPrismaRepository.findByOperationNumber('tenant-a', 'OP-2026-0001');

    expect(prismaMock.operation.findFirst).toHaveBeenCalledWith({
      where: {
        operationNumber: 'OP-2026-0001',
        tenantId: 'tenant-a',
        deletedAt: null,
      },
    });
  });

  it('listByTenant applies tenant and pagination filters', async () => {
    prismaMock.operation.findMany.mockResolvedValueOnce([
      {
        id: 'op-1',
        tenantId: 'tenant-a',
        operationNumber: 'OP-2026-0001',
        year: 2026,
        sequence: 1,
        opportunityId: 'opp-1',
        bankProposalId: null,
        createdById: 'user-1',
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
        createdAt: new Date('2026-06-11T12:00:00.000Z'),
        updatedAt: new Date('2026-06-11T12:00:00.000Z'),
      },
    ]);
    prismaMock.operation.count.mockResolvedValueOnce(1);

    const result = await operationPrismaRepository.listByTenant({
      tenantId: 'tenant-a',
      page: 2,
      limit: 10,
      status: 'CREATED',
      opportunityId: 'opp-1',
      bankProposalId: 'bank-1',
      createdById: 'user-1',
      search: 'OP-2026',
    });

    expect(prismaMock.operation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          deletedAt: null,
          status: 'CREATED',
          opportunityId: 'opp-1',
          bankProposalId: 'bank-1',
          createdById: 'user-1',
          OR: expect.any(Array),
        }),
        skip: 10,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );
    expect(prismaMock.operation.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 'tenant-a',
        deletedAt: null,
        status: 'CREATED',
      }),
    });
    expect(result).toEqual({
      data: [
        {
          id: 'op-1',
          operationNumber: 'OP-2026-0001',
          status: 'CREATED',
          amount: 1234.56,
          currency: 'BRL',
          opportunityId: 'opp-1',
        },
      ],
      total: 1,
      page: 2,
      limit: 10,
    });
  });

  it('keeps blocked methods explicit', async () => {
    await expect(operationPrismaRepository.listByOpportunity('tenant-a', 'opp-1')).rejects.toThrow(
      'OperationPrismaRepository.listByOpportunity is not implemented yet',
    );
    await expect(operationPrismaRepository.listByStatus('tenant-a', 'CREATED')).rejects.toThrow(
      'OperationPrismaRepository.listByStatus is not implemented yet',
    );
    await expect(operationPrismaRepository.updateStatus({} as never)).rejects.toThrow(
      'OperationPrismaRepository.updateStatus is not implemented yet',
    );
    await expect(operationPrismaRepository.appendMetadata('tenant-a', 'op-1', {})).rejects.toThrow(
      'OperationPrismaRepository.appendMetadata is not implemented yet',
    );
    await expect(operationPrismaRepository.getTimeline('tenant-a', 'op-1')).rejects.toThrow(
      'OperationPrismaRepository.getTimeline is not implemented yet',
    );
    await expect(operationPrismaRepository.getFinancialSummary('tenant-a', 'op-1')).rejects.toThrow(
      'OperationPrismaRepository.getFinancialSummary is not implemented yet',
    );
  });
});
