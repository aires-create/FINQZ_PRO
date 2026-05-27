import type { ProviderMetadata } from './margin-inquiry.contract.js';

export type FinancialExecutionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retryable'
  | 'canceled'
  | 'blocked';

export type FinancialExecutionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type FinancialExecutionType =
  | 'commission_payout'
  | 'payout_status_check'
  | 'payout_reconciliation';

export type FinancialExecutionContext = {
  tenantId: string;
  providerKey: string;
  executionType: FinancialExecutionType;
  operation: string;
  idempotencyKey?: string;
  externalReference?: string;
  requestId?: string;
  startedAt: Date;
  metadata?: ProviderMetadata;
};

export type FinancialExecutionDiagnostics = {
  status: FinancialExecutionStatus;
  riskLevel: FinancialExecutionRiskLevel;
  retryable: boolean;
  sanitizedErrorCode?: string;
  providerKey: string;
  operation: string;
  idempotencyKey?: string;
  externalReference?: string;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
  metadata?: ProviderMetadata;
};

export type FinancialExecutionDecision = {
  allowed: boolean;
  reason:
    | 'valid'
    | 'missing_idempotency_key'
    | 'missing_external_reference'
    | 'blocked_by_risk'
    | 'provider_disabled'
    | 'not_implemented'
    | 'invalid_scope';
  riskLevel: FinancialExecutionRiskLevel;
  retryable: boolean;
};

export interface FinancialExecutionPolicy {
  evaluate(context: FinancialExecutionContext): FinancialExecutionDecision;
}

const hasText = (value: string | undefined): boolean => Boolean(value?.trim());

export class DefaultFinancialExecutionPolicy implements FinancialExecutionPolicy {
  evaluate(context: FinancialExecutionContext): FinancialExecutionDecision {
    const hasScope =
      hasText(context.tenantId) && hasText(context.providerKey) && hasText(context.operation);
    if (!hasScope) {
      return {
        allowed: false,
        reason: 'invalid_scope',
        riskLevel: 'high',
        retryable: false,
      };
    }

    if (!hasText(context.idempotencyKey)) {
      return {
        allowed: false,
        reason: 'missing_idempotency_key',
        riskLevel: 'high',
        retryable: false,
      };
    }

    if (!hasText(context.externalReference)) {
      return {
        allowed: false,
        reason: 'missing_external_reference',
        riskLevel: 'medium',
        retryable: false,
      };
    }

    return {
      allowed: true,
      reason: 'valid',
      riskLevel: 'low',
      retryable: false,
    };
  }
}
