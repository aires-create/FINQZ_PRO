import { OperationStatus as PrismaOperationStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  isTerminalOperationStatus,
  isValidOperationStatusTransition,
  type OperationStatusTransition,
  type OperationTerminalStatus,
  type OperationTransientStatus,
} from '../../../modules/operation/domain/operation-transition.contract.js';
import {
  OPERATION_STATUS_CONTROLLED_REVERSIONS,
  OPERATION_STATUS_TERMINAL_STATUSES,
  OPERATION_STATUS_TRANSIENT_STATUSES,
  OPERATION_STATUS_TRANSITION_MATRIX,
  OPERATION_STATUS_TRANSITIONS,
} from '../../../modules/operation/domain/operation-transition.matrix.js';
import type { OperationStatus } from '../../../modules/operation/domain/operation-status.js';

describe('operation transition contracts', () => {
  const expectTransition = (
    previousStatus: OperationStatus,
    nextStatus: OperationStatus,
    expected: boolean,
  ) => {
    expect(isValidOperationStatusTransition(previousStatus, nextStatus)).toBe(expected);
  };

  it('exposes the declared status groups and transition contract types', () => {
    const transition: OperationStatusTransition = {
      previousStatus: PrismaOperationStatus.CREATED,
      nextStatus: PrismaOperationStatus.PROPOSAL_REQUESTED,
    };
    const terminalStatus: OperationTerminalStatus = 'SETTLED';
    const transientStatus: OperationTransientStatus = 'CREATED';

    expect(transition.previousStatus).toBe(PrismaOperationStatus.CREATED);
    expect(terminalStatus).toBe('SETTLED');
    expect(transientStatus).toBe('CREATED');
    expect(OPERATION_STATUS_TERMINAL_STATUSES).toEqual([
      'SETTLED',
      'REJECTED',
      'FAILED',
      'CANCELED',
    ]);
    expect(OPERATION_STATUS_TRANSIENT_STATUSES).toEqual([
      'CREATED',
      'PROPOSAL_REQUESTED',
      'PROPOSAL_RECEIVED',
      'PROPOSAL_APPROVED',
      'EXECUTED',
      'COMMISSION_CALCULATED',
      'SETTLEMENT_PENDING',
    ]);
  });

  it('validates the main Operation lifecycle flow', () => {
    expectTransition('CREATED', 'PROPOSAL_REQUESTED', true);
    expectTransition('PROPOSAL_REQUESTED', 'PROPOSAL_RECEIVED', true);
    expectTransition('PROPOSAL_RECEIVED', 'PROPOSAL_APPROVED', true);
    expectTransition('PROPOSAL_APPROVED', 'EXECUTED', true);
    expectTransition('EXECUTED', 'COMMISSION_CALCULATED', true);
    expectTransition('COMMISSION_CALCULATED', 'SETTLEMENT_PENDING', true);
    expectTransition('SETTLEMENT_PENDING', 'SETTLED', true);
  });

  it('validates controlled reversions allowed by ARCH-028', () => {
    expectTransition('PROPOSAL_RECEIVED', 'PROPOSAL_REQUESTED', true);
    expectTransition('PROPOSAL_APPROVED', 'PROPOSAL_RECEIVED', true);
  });

  it('validates cancelation and failure exits', () => {
    expectTransition('CREATED', 'CANCELED', true);
    expectTransition('PROPOSAL_REQUESTED', 'FAILED', true);
    expectTransition('PROPOSAL_APPROVED', 'CANCELED', true);
    expectTransition('SETTLEMENT_PENDING', 'FAILED', true);
  });

  it('rejects prohibited transitions', () => {
    expectTransition('CREATED', 'EXECUTED', false);
    expectTransition('CREATED', 'SETTLED', false);
    expectTransition('PROPOSAL_REQUESTED', 'EXECUTED', false);
    expectTransition('PROPOSAL_RECEIVED', 'SETTLED', false);
    expectTransition('PROPOSAL_APPROVED', 'SETTLEMENT_PENDING', false);
    expectTransition('EXECUTED', 'PROPOSAL_REQUESTED', false);
    expectTransition('COMMISSION_CALCULATED', 'SETTLED', false);
    expectTransition('SETTLED', 'CREATED', false);
    expectTransition('REJECTED', 'PROPOSAL_REQUESTED', false);
    expectTransition('CANCELED', 'PROPOSAL_APPROVED', false);
    expectTransition('FAILED', 'SETTLEMENT_PENDING', false);
  });

  it('identifies terminal states correctly', () => {
    expect(isTerminalOperationStatus('SETTLED')).toBe(true);
    expect(isTerminalOperationStatus('REJECTED')).toBe(true);
    expect(isTerminalOperationStatus('FAILED')).toBe(true);
    expect(isTerminalOperationStatus('CANCELED')).toBe(true);
    expect(isTerminalOperationStatus('CREATED')).toBe(false);
    expect(isTerminalOperationStatus('PROPOSAL_APPROVED')).toBe(false);
  });

  it('keeps the transition matrix aligned with the contract', () => {
    expect(OPERATION_STATUS_TRANSITIONS).toEqual([
      { from: 'CREATED', to: 'PROPOSAL_REQUESTED' },
      { from: 'CREATED', to: 'REJECTED' },
      { from: 'CREATED', to: 'CANCELED' },
      { from: 'CREATED', to: 'FAILED' },
      { from: 'PROPOSAL_REQUESTED', to: 'PROPOSAL_RECEIVED' },
      { from: 'PROPOSAL_REQUESTED', to: 'REJECTED' },
      { from: 'PROPOSAL_REQUESTED', to: 'CANCELED' },
      { from: 'PROPOSAL_REQUESTED', to: 'FAILED' },
      { from: 'PROPOSAL_RECEIVED', to: 'PROPOSAL_APPROVED' },
      { from: 'PROPOSAL_RECEIVED', to: 'PROPOSAL_REQUESTED' },
      { from: 'PROPOSAL_RECEIVED', to: 'REJECTED' },
      { from: 'PROPOSAL_RECEIVED', to: 'CANCELED' },
      { from: 'PROPOSAL_RECEIVED', to: 'FAILED' },
      { from: 'PROPOSAL_APPROVED', to: 'EXECUTED' },
      { from: 'PROPOSAL_APPROVED', to: 'PROPOSAL_RECEIVED' },
      { from: 'PROPOSAL_APPROVED', to: 'REJECTED' },
      { from: 'PROPOSAL_APPROVED', to: 'CANCELED' },
      { from: 'PROPOSAL_APPROVED', to: 'FAILED' },
      { from: 'EXECUTED', to: 'COMMISSION_CALCULATED' },
      { from: 'EXECUTED', to: 'FAILED' },
      { from: 'COMMISSION_CALCULATED', to: 'SETTLEMENT_PENDING' },
      { from: 'COMMISSION_CALCULATED', to: 'FAILED' },
      { from: 'SETTLEMENT_PENDING', to: 'SETTLED' },
      { from: 'SETTLEMENT_PENDING', to: 'FAILED' },
    ]);

    expect(OPERATION_STATUS_TRANSITION_MATRIX).toMatchObject({
      CREATED: ['PROPOSAL_REQUESTED', 'REJECTED', 'CANCELED', 'FAILED'],
      PROPOSAL_REQUESTED: ['PROPOSAL_RECEIVED', 'REJECTED', 'CANCELED', 'FAILED'],
      PROPOSAL_RECEIVED: [
        'PROPOSAL_APPROVED',
        'PROPOSAL_REQUESTED',
        'REJECTED',
        'CANCELED',
        'FAILED',
      ],
      PROPOSAL_APPROVED: [
        'EXECUTED',
        'PROPOSAL_RECEIVED',
        'REJECTED',
        'CANCELED',
        'FAILED',
      ],
      EXECUTED: ['COMMISSION_CALCULATED', 'FAILED'],
      COMMISSION_CALCULATED: ['SETTLEMENT_PENDING', 'FAILED'],
      SETTLEMENT_PENDING: ['SETTLED', 'FAILED'],
      SETTLED: [],
      REJECTED: [],
      FAILED: [],
      CANCELED: [],
    });
    expect(OPERATION_STATUS_CONTROLLED_REVERSIONS).toEqual([
      { from: 'PROPOSAL_RECEIVED', to: 'PROPOSAL_REQUESTED' },
      { from: 'PROPOSAL_APPROVED', to: 'PROPOSAL_RECEIVED' },
    ]);
  });
});
