import type { OperationStatus } from '../domain/operation-status.js';
import type { OperationStatusTransition } from '../domain/operation-transition.contract.js';

// ARCH-023 to ARCH-026: command contracts only, no handlers or execution logic.
export interface CreateOperationCommand {
  tenantId: string;
  opportunityId: string;
  bankProposalId?: string | null;
  createdById: string;
  amount: number;
  currency: string;
  referenceDate?: string | null;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  correlationId?: string | null;
}

export interface RequestOperationProposalCommand {
  tenantId: string;
  operationId: string;
  requestedById: string;
  correlationId?: string | null;
}

export interface ReceiveOperationProposalCommand {
  tenantId: string;
  operationId: string;
  bankProposalId?: string | null;
  receivedById: string;
  correlationId?: string | null;
}

export interface ApproveOperationProposalCommand {
  tenantId: string;
  operationId: string;
  approvedById: string;
  correlationId?: string | null;
}

export interface RejectOperationProposalCommand {
  tenantId: string;
  operationId: string;
  rejectedById: string;
  reason?: string | null;
  correlationId?: string | null;
}

export interface TransitionOperationStatusCommand
  extends OperationStatusTransition {
  tenantId: string;
  operationId: string;
  actorId: string;
  correlationId?: string | null;
}

export interface MarkOperationExecutedCommand {
  tenantId: string;
  operationId: string;
  executedById: string;
  executedAt?: string | null;
  referenceDate?: string | null;
  providerOperationId?: string | null;
  externalReference?: string | null;
  correlationId?: string | null;
}

export interface MarkOperationFailedCommand {
  tenantId: string;
  operationId: string;
  failedById: string;
  reason?: string | null;
  errorCode?: string | null;
  correlationId?: string | null;
}

export interface MarkOperationCanceledCommand {
  tenantId: string;
  operationId: string;
  canceledById: string;
  reason?: string | null;
  correlationId?: string | null;
}

export interface MarkOperationSettlementPendingCommand {
  tenantId: string;
  operationId: string;
  actorId: string;
  correlationId?: string | null;
}

export interface MarkOperationSettledCommand {
  tenantId: string;
  operationId: string;
  actorId: string;
  settlementId?: string | null;
  correlationId?: string | null;
}
