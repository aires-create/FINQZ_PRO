import type { OperationStatus } from './operation-status.js';
import {
  OPERATION_STATUS_TERMINAL_STATUSES,
  OPERATION_STATUS_TRANSIENT_STATUSES,
  OPERATION_STATUS_TRANSITION_MATRIX,
} from './operation-transition.matrix.js';

export interface OperationStatusTransition {
  previousStatus: OperationStatus;
  nextStatus: OperationStatus;
}

export type OperationTerminalStatus =
  (typeof OPERATION_STATUS_TERMINAL_STATUSES)[number];

export type OperationTransientStatus =
  (typeof OPERATION_STATUS_TRANSIENT_STATUSES)[number];

export function isValidOperationStatusTransition(
  from: OperationStatus,
  to: OperationStatus,
): boolean {
  const allowedTransitions = OPERATION_STATUS_TRANSITION_MATRIX[from] as readonly OperationStatus[];

  return allowedTransitions.includes(to);
}

export function isTerminalOperationStatus(status: OperationStatus): boolean {
  const terminalStatuses = OPERATION_STATUS_TERMINAL_STATUSES as readonly OperationStatus[];

  return terminalStatuses.includes(status);
}
