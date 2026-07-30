import type { OperationStatus } from '../domain/operation-status.js';

// ARCH-023 to ARCH-026: shared contract types only, no executable code.
export interface OperationIdentityContract {
  id: string;
  tenantId: string;
  operationNumber: string;
}

export interface OperationOwnershipContract {
  opportunityId: string;
  bankProposalId?: string | null;
  createdById: string;
}

export interface OperationFinancialContract {
  amount: number;
  currency: string;
  status: OperationStatus;
  executedAt?: string | null;
  referenceDate?: string | null;
}

export interface OperationTraceContract {
  correlationId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface OperationPersistenceContract
  extends OperationIdentityContract,
    OperationOwnershipContract,
    OperationFinancialContract,
    OperationTraceContract {
  year: number;
  sequence: number;
  providerOperationId?: string | null;
  externalReference?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
