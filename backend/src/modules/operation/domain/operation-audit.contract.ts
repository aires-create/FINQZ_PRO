import type { OperationStatus } from './operation-status.js';

// ARCH-029 to IMPL-09A: audit contracts only, no runtime behavior.
export type OperationAuditReason = string;

export type OperationAuditMetadata = Readonly<Record<string, unknown>>;

export interface OperationAuditContext {
  tenantId: string;
  operationId: string;
  operationNumber?: string | null;
  actorUserId?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  source?: string | null;
}

export interface OperationAuditEntry {
  id: string;
  tenantId: string;
  operationId: string;
  fromStatus: OperationStatus;
  toStatus: OperationStatus;
  actorUserId: string;
  reason: OperationAuditReason;
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  metadata?: OperationAuditMetadata | null;
  createdAt: string;
}

export interface OperationAuditTransitionEvidence extends OperationAuditContext {
  fromStatus: OperationStatus;
  toStatus: OperationStatus;
  reason: OperationAuditReason;
  metadata?: OperationAuditMetadata | null;
}
