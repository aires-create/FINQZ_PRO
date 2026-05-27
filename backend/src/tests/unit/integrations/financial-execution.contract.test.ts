import { DefaultFinancialExecutionPolicy } from '../../../modules/integrations/domain/contracts/financial-execution.contract.js';

describe('DefaultFinancialExecutionPolicy', () => {
  const policy = new DefaultFinancialExecutionPolicy();

  it('allows execution with complete context', () => {
    const decision = policy.evaluate({
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: 'createCommissionPayout',
      idempotencyKey: 'idem-123',
      externalReference: 'batch-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });

    expect(decision).toEqual({
      allowed: true,
      reason: 'valid',
      riskLevel: 'low',
      retryable: false,
    });
  });

  it('blocks when idempotency key is missing', () => {
    const decision = policy.evaluate({
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: 'createCommissionPayout',
      externalReference: 'batch-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });

    expect(decision).toEqual({
      allowed: false,
      reason: 'missing_idempotency_key',
      riskLevel: 'high',
      retryable: false,
    });
  });

  it('blocks when external reference is missing', () => {
    const decision = policy.evaluate({
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: 'createCommissionPayout',
      idempotencyKey: 'idem-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });

    expect(decision).toEqual({
      allowed: false,
      reason: 'missing_external_reference',
      riskLevel: 'medium',
      retryable: false,
    });
  });

  it('blocks invalid empty scope', () => {
    const decision = policy.evaluate({
      tenantId: ' ',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: '',
      idempotencyKey: 'idem-123',
      externalReference: 'batch-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });

    expect(decision).toEqual({
      allowed: false,
      reason: 'invalid_scope',
      riskLevel: 'high',
      retryable: false,
    });
  });

  it('returns expected risk and retryability for blocked decisions', () => {
    const missingReference = policy.evaluate({
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: 'createCommissionPayout',
      idempotencyKey: 'idem-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });
    const missingIdempotency = policy.evaluate({
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      executionType: 'commission_payout',
      operation: 'createCommissionPayout',
      externalReference: 'batch-123',
      startedAt: new Date('2026-05-27T10:00:00.000Z'),
    });

    expect(missingReference.riskLevel).toBe('medium');
    expect(missingReference.retryable).toBe(false);
    expect(missingIdempotency.riskLevel).toBe('high');
    expect(missingIdempotency.retryable).toBe(false);
  });
});
