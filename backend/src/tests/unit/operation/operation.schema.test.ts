import { OperationStatus as PrismaOperationStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  CreateOperationBodySchema,
  OperationIdParamsSchema,
  OperationListQuerySchema,
  OperationStatusTransitionBodySchema,
} from '../../../modules/operation/validators/operation.schema.js';

describe('operation schemas', () => {
  const validUuid = '11111111-1111-1111-1111-111111111111';

  it('validates CreateOperationBodySchema', () => {
    const result = CreateOperationBodySchema.parse({
      tenantId: validUuid,
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      amount: '12500.75',
      currency: 'BRL',
      referenceDate: '2026-06-11T12:30:00.000Z',
      metadata: { origin: 'unit-test' },
      notes: 'operation body',
      correlationId: 'corr-123',
    });

    expect(result.tenantId).toBe(validUuid);
    expect(result.amount).toBe(12500.75);
    expect(result.currency).toBe('BRL');
  });

  it('rejects invalid CreateOperationBodySchema payloads', () => {
    expect(() =>
      CreateOperationBodySchema.parse({
        tenantId: validUuid,
        opportunityId: 'not-a-uuid',
        createdById: validUuid,
        amount: '12500.75',
      }),
    ).toThrow();

    expect(() =>
      CreateOperationBodySchema.parse({
        tenantId: validUuid,
        opportunityId: validUuid,
        createdById: validUuid,
        amount: '12500.75',
        operationNumber: 'OP-2026-000001',
        year: 2026,
        sequence: 1,
      }),
    ).toThrow();
  });

  it('validates OperationIdParamsSchema', () => {
    const result = OperationIdParamsSchema.parse({
      id: validUuid,
    });

    expect(result.id).toBe(validUuid);
  });

  it('rejects invalid OperationIdParamsSchema payloads', () => {
    expect(() =>
      OperationIdParamsSchema.parse({
        id: 'invalid-id',
      }),
    ).toThrow();
  });

  it('validates OperationListQuerySchema', () => {
    const result = OperationListQuerySchema.parse({
      page: '2',
      limit: '50',
      status: PrismaOperationStatus.CREATED,
      opportunityId: validUuid,
      bankProposalId: validUuid,
      createdById: validUuid,
      search: '  operation search  ',
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
    expect(result.status).toBe(PrismaOperationStatus.CREATED);
    expect(result.search).toBe('operation search');
  });

  it('validates OperationStatusTransitionBodySchema', () => {
    const result = OperationStatusTransitionBodySchema.parse({
      tenantId: validUuid,
      operationId: validUuid,
      previousStatus: PrismaOperationStatus.CREATED,
      nextStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
      actorId: validUuid,
      correlationId: 'corr-456',
    });

    expect(result.previousStatus).toBe(PrismaOperationStatus.CREATED);
    expect(result.nextStatus).toBe(PrismaOperationStatus.PROPOSAL_REQUESTED);
  });

  it('rejects invalid OperationStatusTransitionBodySchema payloads', () => {
    expect(() =>
      OperationStatusTransitionBodySchema.parse({
        tenantId: validUuid,
        operationId: validUuid,
        previousStatus: PrismaOperationStatus.CREATED,
        nextStatus: 'UNKNOWN_STATUS',
        actorId: validUuid,
      }),
    ).toThrow();
  });
});
