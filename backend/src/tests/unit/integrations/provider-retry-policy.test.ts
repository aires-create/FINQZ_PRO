import { ProviderRetryPolicy } from '../../../modules/integrations/application/provider-retry-policy.js';

describe('ProviderRetryPolicy', () => {
  it('marks 429, 5xx and timeout as retryable', () => {
    const policy = new ProviderRetryPolicy();

    expect(policy.decide({ status: 429 }).retryable).toBe(true);
    expect(policy.decide({ status: 503 }).retryable).toBe(true);
    expect(policy.decide(new DOMException('Timeout', 'AbortError')).retryable).toBe(true);
  });

  it('marks 4xx as non-retryable', () => {
    const policy = new ProviderRetryPolicy();

    expect(policy.decide({ status: 400 }).retryable).toBe(false);
    expect(policy.decide({ status: 401 }).retryable).toBe(false);
    expect(policy.decide({ status: 403 }).retryable).toBe(false);
    expect(policy.decide({ status: 404 }).retryable).toBe(false);
  });

  it('calculates exponential backoff with jitter', () => {
    const policy = new ProviderRetryPolicy(
      {
        baseDelayMs: 100,
        maxDelayMs: 5_000,
        jitterRatio: 0.2,
      },
      () => 0.5,
    );

    expect(policy.getDelayMs(1)).toBe(110);
    expect(policy.getDelayMs(2)).toBe(220);
  });
});
