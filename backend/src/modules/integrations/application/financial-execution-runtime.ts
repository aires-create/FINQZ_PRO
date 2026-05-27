import type {
  FinancialExecutionContext,
  FinancialExecutionDiagnostics,
  FinancialExecutionPolicy,
} from '../domain/contracts/financial-execution.contract.js';
import type { ProviderIdempotencyContract } from './provider-idempotency-contract.js';

export type FinancialExecutionRuntimeResult = {
  allowed: boolean;
  diagnostics: FinancialExecutionDiagnostics;
};

const getDurationMs = (startedAt: number) => Date.now() - startedAt;

export class FinancialExecutionRuntime {
  constructor(
    private readonly policy: FinancialExecutionPolicy,
    private readonly idempotencyContract: ProviderIdempotencyContract,
  ) {}

  execute(context: FinancialExecutionContext): FinancialExecutionRuntimeResult {
    const executionStartedAt = Date.now();
    const scopeIsValid = this.idempotencyContract.validateIdempotencyScope({
      tenantId: context.tenantId,
      providerKey: context.providerKey,
      capability: context.executionType,
      operation: context.operation,
      externalReference: context.externalReference ?? '',
    });
    const finishedAt = new Date();

    if (!scopeIsValid) {
      return {
        allowed: false,
        diagnostics: {
          status: 'blocked',
          riskLevel: 'high',
          retryable: false,
          sanitizedErrorCode: 'invalid_scope',
          providerKey: context.providerKey,
          operation: context.operation,
          ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
          ...(context.externalReference ? { externalReference: context.externalReference } : {}),
          startedAt: context.startedAt,
          finishedAt,
          durationMs: getDurationMs(executionStartedAt),
          ...(context.metadata ? { metadata: context.metadata } : {}),
        },
      };
    }

    const decision = this.policy.evaluate(context);
    const allowed = decision.allowed;

    return {
      allowed,
      diagnostics: {
        status: allowed ? 'pending' : 'blocked',
        riskLevel: decision.riskLevel,
        retryable: decision.retryable,
        ...(!allowed ? { sanitizedErrorCode: decision.reason } : {}),
        providerKey: context.providerKey,
        operation: context.operation,
        ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
        ...(context.externalReference ? { externalReference: context.externalReference } : {}),
        startedAt: context.startedAt,
        finishedAt,
        durationMs: getDurationMs(executionStartedAt),
        ...(context.metadata ? { metadata: context.metadata } : {}),
      },
    };
  }

  createIdempotencyKey(context: FinancialExecutionContext): string | undefined {
    if (!context.externalReference?.trim()) {
      return undefined;
    }

    return this.idempotencyContract.generateIdempotencyKey({
      tenantId: context.tenantId,
      providerKey: context.providerKey,
      capability: context.executionType,
      operation: context.operation,
      externalReference: context.externalReference,
    });
  }
}
