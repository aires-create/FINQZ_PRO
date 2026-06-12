import { OperationStatus as PrismaOperationStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import type {
  OperationAuditContext,
  OperationAuditEntry,
  OperationAuditMetadata,
  OperationAuditReason,
  OperationAuditTransitionEvidence,
} from '../../../modules/operation/domain/operation-audit.contract.js';
import type { OperationStatus } from '../../../modules/operation/domain/operation-status.js';

describe('operation audit contracts', () => {
  const validUuid = '11111111-1111-1111-1111-111111111111';

  it('exposes the minimum append-only audit entry shape', () => {
    const metadata: OperationAuditMetadata = Object.freeze({
      origin: 'unit-test',
      channel: 'internal',
    });
    const reason: OperationAuditReason = 'transition_requested_by_approved_flow';
    const context: OperationAuditContext = {
      tenantId: validUuid,
      operationId: validUuid,
      operationNumber: 'OP-2026-0001',
      actorUserId: validUuid,
      requestId: 'req-123',
      correlationId: 'corr-123',
      idempotencyKey: 'idem-123',
      source: 'operation-command',
    };
    const evidence: OperationAuditTransitionEvidence = {
      ...context,
      fromStatus: PrismaOperationStatus.PROPOSAL_RECEIVED,
      toStatus: PrismaOperationStatus.PROPOSAL_APPROVED,
      reason,
      metadata,
    };
    const entry: OperationAuditEntry = {
      id: validUuid,
      tenantId: context.tenantId,
      operationId: context.operationId,
      fromStatus: PrismaOperationStatus.PROPOSAL_RECEIVED,
      toStatus: PrismaOperationStatus.PROPOSAL_APPROVED,
      actorUserId: validUuid,
      reason,
      requestId: context.requestId,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      metadata,
      createdAt: '2026-06-12T12:30:00.000Z',
    };

    expect(entry.id).toBe(validUuid);
    expect(entry.tenantId).toBe(validUuid);
    expect(entry.operationId).toBe(validUuid);
    expect(entry.fromStatus).toBe(PrismaOperationStatus.PROPOSAL_RECEIVED);
    expect(entry.toStatus).toBe(PrismaOperationStatus.PROPOSAL_APPROVED);
    expect(entry.actorUserId).toBe(validUuid);
    expect(entry.reason).toBe(reason);
    expect(entry.metadata).toEqual(metadata);
    expect(entry.createdAt).toBe('2026-06-12T12:30:00.000Z');
    expect(evidence.fromStatus).toBe(PrismaOperationStatus.PROPOSAL_RECEIVED);
    expect(evidence.toStatus).toBe(PrismaOperationStatus.PROPOSAL_APPROVED);
  });

  it('requires reason as a first-class contract field', () => {
    const entry: OperationAuditEntry = {
      id: validUuid,
      tenantId: validUuid,
      operationId: validUuid,
      fromStatus: PrismaOperationStatus.CREATED,
      toStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
      actorUserId: validUuid,
      reason: 'created_to_proposal_requested',
      createdAt: '2026-06-12T12:30:00.000Z',
    };

    expect(entry.reason).toBe('created_to_proposal_requested');
  });

  it('keeps fromStatus and toStatus aligned with OperationStatus', () => {
    const fromStatus: OperationStatus = PrismaOperationStatus.CREATED;
    const toStatus: OperationStatus = PrismaOperationStatus.PROPOSAL_REQUESTED;
    const entry: OperationAuditEntry = {
      id: validUuid,
      tenantId: validUuid,
      operationId: validUuid,
      fromStatus,
      toStatus,
      actorUserId: validUuid,
      reason: 'proposal_requested_after_creation',
      requestId: 'req-456',
      correlationId: 'corr-456',
      idempotencyKey: 'idem-456',
      metadata: null,
      createdAt: '2026-06-12T12:30:00.000Z',
    };

    expect(entry.fromStatus).toBe(PrismaOperationStatus.CREATED);
    expect(entry.toStatus).toBe(PrismaOperationStatus.PROPOSAL_REQUESTED);
  });

  it('keeps metadata optional and append-only in concept', () => {
    const entryWithoutMetadata: OperationAuditEntry = {
      id: validUuid,
      tenantId: validUuid,
      operationId: validUuid,
      fromStatus: PrismaOperationStatus.EXECUTED,
      toStatus: PrismaOperationStatus.COMMISSION_CALCULATED,
      actorUserId: validUuid,
      reason: 'executed_to_commission_calculated',
      requestId: null,
      correlationId: 'corr-789',
      idempotencyKey: null,
      createdAt: '2026-06-12T12:30:00.000Z',
    };

    expect(entryWithoutMetadata.metadata).toBeUndefined();
  });

  it('remains a pure contract without runtime or persistence concerns', () => {
    const entry: OperationAuditEntry = {
      id: validUuid,
      tenantId: validUuid,
      operationId: validUuid,
      fromStatus: PrismaOperationStatus.SETTLEMENT_PENDING,
      toStatus: PrismaOperationStatus.SETTLED,
      actorUserId: validUuid,
      reason: 'settlement_confirmed',
      requestId: 'req-789',
      correlationId: 'corr-789',
      idempotencyKey: 'idem-789',
      metadata: Object.freeze({ source: 'audit-contract-test' }),
      createdAt: '2026-06-12T12:30:00.000Z',
    };

    expect(typeof entry).toBe('object');
    expect(Object.hasOwn(entry, 'tenantId')).toBe(true);
    expect(Object.hasOwn(entry, 'fromStatus')).toBe(true);
    expect(Object.hasOwn(entry, 'toStatus')).toBe(true);
    expect(Object.hasOwn(entry, 'createdAt')).toBe(true);
  });

  it('fits the append-only evidence model conceptually', () => {
    const firstEntry: OperationAuditEntry = {
      id: 'audit-001',
      tenantId: validUuid,
      operationId: validUuid,
      fromStatus: PrismaOperationStatus.PROPOSAL_APPROVED,
      toStatus: PrismaOperationStatus.EXECUTED,
      actorUserId: validUuid,
      reason: 'approved_to_executed',
      requestId: 'req-001',
      correlationId: 'corr-001',
      idempotencyKey: 'idem-001',
      metadata: { step: 'first' },
      createdAt: '2026-06-12T12:30:00.000Z',
    };
    const secondEntry: OperationAuditEntry = {
      ...firstEntry,
      id: 'audit-002',
      fromStatus: PrismaOperationStatus.EXECUTED,
      toStatus: PrismaOperationStatus.COMMISSION_CALCULATED,
      reason: 'executed_to_commission_calculated',
      createdAt: '2026-06-12T12:31:00.000Z',
    };

    expect(firstEntry.id).not.toBe(secondEntry.id);
    expect(firstEntry.toStatus).toBe(PrismaOperationStatus.EXECUTED);
    expect(secondEntry.fromStatus).toBe(PrismaOperationStatus.EXECUTED);
    expect(secondEntry.toStatus).toBe(PrismaOperationStatus.COMMISSION_CALCULATED);
  });
});
