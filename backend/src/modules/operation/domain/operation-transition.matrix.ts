import type { OperationStatus } from './operation-status.js';

export interface OperationStatusTransitionEdge {
  from: OperationStatus;
  to: OperationStatus;
}

export type OperationStatusTransitionMatrix = Readonly<
  Record<OperationStatus, readonly OperationStatus[]>
>;

export const OPERATION_STATUS_TERMINAL_STATUSES = [
  'SETTLED',
  'REJECTED',
  'FAILED',
  'CANCELED',
] as const satisfies readonly OperationStatus[];

export const OPERATION_STATUS_TRANSIENT_STATUSES = [
  'CREATED',
  'PROPOSAL_REQUESTED',
  'PROPOSAL_RECEIVED',
  'PROPOSAL_APPROVED',
  'EXECUTED',
  'COMMISSION_CALCULATED',
  'SETTLEMENT_PENDING',
] as const satisfies readonly OperationStatus[];

export const OPERATION_STATUS_CONTROLLED_REVERSIONS = [
  {
    from: 'PROPOSAL_RECEIVED',
    to: 'PROPOSAL_REQUESTED',
  },
  {
    from: 'PROPOSAL_APPROVED',
    to: 'PROPOSAL_RECEIVED',
  },
] as const satisfies readonly OperationStatusTransitionEdge[];

export const OPERATION_STATUS_TRANSITION_MATRIX = {
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
} as const satisfies OperationStatusTransitionMatrix;

export const OPERATION_STATUS_TRANSITIONS = [
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
] as const satisfies readonly OperationStatusTransitionEdge[];
