import { FinancialExecutionRuntime } from '../../../modules/integrations/application/financial-execution-runtime.js';
import { DefaultFinancialExecutionPolicy } from '../../../modules/integrations/domain/contracts/financial-execution.contract.js';
import { DefaultProviderIdempotencyContract } from '../../../modules/integrations/application/provider-idempotency-contract.js';

describe('FinancialExecutionRuntime', () => {
  const baseContext = {
    tenantId: 'tenant-1',
    providerKey: 'bluepay',
    executionType: 'commission_payout' as const,
    operation: 'createCommissionPayout',
    idempotencyKey: 'idem-1',
    externalReference: 'batch-1',
    startedAt: new Date('2026-05-27T10:00:00.000Z'),
  };

  it('blocks execution by invalid scope', () => {
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      new DefaultProviderIdempotencyContract(),
    );

    const result = runtime.execute({
      ...baseContext,
      tenantId: '',
    });

    expect(result.allowed).toBe(false);
    expect(result.diagnostics.status).toBe('blocked');
    expect(result.diagnostics.sanitizedErrorCode).toBe('invalid_scope');
    expect(result.diagnostics.retryable).toBe(false);
  });

  it('blocks execution by policy decision', () => {
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      new DefaultProviderIdempotencyContract(),
    );

    const result = runtime.execute({
      ...baseContext,
      idempotencyKey: '',
    });

    expect(result.allowed).toBe(false);
    expect(result.diagnostics.status).toBe('blocked');
    expect(result.diagnostics.sanitizedErrorCode).toBe('missing_idempotency_key');
  });

  it('allows execution and returns pending status', () => {
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      new DefaultProviderIdempotencyContract(),
    );

    const result = runtime.execute(baseContext);

    expect(result.allowed).toBe(true);
    expect(result.diagnostics.status).toBe('pending');
    expect(result.diagnostics.providerKey).toBe('bluepay');
  });

  it('createIdempotencyKey generates deterministic value', () => {
    const idempotencyContract = new DefaultProviderIdempotencyContract();
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      idempotencyContract,
    );

    const first = runtime.createIdempotencyKey(baseContext);
    const second = runtime.createIdempotencyKey(baseContext);

    expect(first).toBeDefined();
    expect(first).toBe(second);
  });

  it('createIdempotencyKey returns undefined without external reference', () => {
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      new DefaultProviderIdempotencyContract(),
    );

    const key = runtime.createIdempotencyKey({
      ...baseContext,
      externalReference: '',
    });

    expect(key).toBeUndefined();
  });

  it('includes diagnostics durationMs', () => {
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      new DefaultProviderIdempotencyContract(),
    );

    const result = runtime.execute(baseContext);

    expect(result.diagnostics.durationMs).toEqual(expect.any(Number));
  });

  it('does not perform any external execution', () => {
    const idempotencyContract = new DefaultProviderIdempotencyContract();
    const generateSpy = vi.spyOn(idempotencyContract, 'generateIdempotencyKey');
    const runtime = new FinancialExecutionRuntime(
      new DefaultFinancialExecutionPolicy(),
      idempotencyContract,
    );

    runtime.execute(baseContext);
    expect(generateSpy).not.toHaveBeenCalled();
  });
});
