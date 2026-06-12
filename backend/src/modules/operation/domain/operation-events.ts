import type { OperationStatus } from './operation-status.js';
import type { OperationStatusTransition } from './operation-transition.contract.js';

// ARCH-023 to ARCH-026: domain event contracts only, no runtime behavior.
export type OperationEventName =
  | 'OperationCreated'
  | 'OperationProposalRequested'
  | 'OperationProposalReceived'
  | 'OperationProposalApproved'
  | 'OperationProposalRejected'
  | 'OperationExecuted'
  | 'OperationFailed'
  | 'OperationCanceled'
  | 'CommissionCalculated'
  | 'SettlementRequested'
  | 'SettlementConfirmed'
  | 'SettlementFailed';

export interface OperationEventEnvelope<TName extends OperationEventName, TPayload> {
  name: TName;
  tenantId: string;
  operationId: string;
  correlationId?: string | null;
  requestId?: string | null;
  occurredAt: string;
  payload: TPayload;
}

export interface OperationCreatedEventPayload {
  operationNumber: string;
  opportunityId: string;
  bankProposalId?: string | null;
  createdById: string;
  amount: number;
  currency: string;
  status: OperationStatus;
}

export interface OperationStatusTransitionEventPayload
  extends OperationStatusTransition {
  actorId?: string | null;
}

export interface OperationProposalEventPayload {
  opportunityId: string;
  bankProposalId?: string | null;
}

export interface OperationExecutionEventPayload {
  executedAt?: string | null;
  referenceDate?: string | null;
  providerOperationId?: string | null;
  externalReference?: string | null;
}

export interface OperationFailureEventPayload {
  reason?: string | null;
  errorCode?: string | null;
}

export interface OperationCommissionCalculatedEventPayload {
  amount: number;
  currency: string;
}

export interface OperationSettlementEventPayload {
  settlementId?: string | null;
  settlementStatus?: string | null;
}
