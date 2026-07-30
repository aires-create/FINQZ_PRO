import type { OperationStatus } from '../domain/operation-status.js';

// ARCH-023 to ARCH-026: DTO contracts only, no transport or runtime logic.
export interface OperationDTO {
  id: string;
  tenantId: string;
  operationNumber: string;
  year: number;
  sequence: number;
  opportunityId: string;
  bankProposalId?: string | null;
  createdById: string;
  amount: number;
  currency: string;
  status: OperationStatus;
  executedAt?: string | null;
  referenceDate?: string | null;
  providerOperationId?: string | null;
  externalReference?: string | null;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  correlationId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationSummaryDTO {
  id: string;
  operationNumber: string;
  status: OperationStatus;
  amount: number;
  currency: string;
  opportunityId: string;
}

export interface OperationTimelineDTO {
  operationId: string;
  tenantId: string;
  events: Array<{
    name: string;
    occurredAt: string;
    status?: OperationStatus;
    correlationId?: string | null;
  }>;
}

export interface OperationFinancialSummaryDTO {
  operationId: string;
  amount: number;
  currency: string;
  status: OperationStatus;
  executedAt?: string | null;
  referenceDate?: string | null;
}
