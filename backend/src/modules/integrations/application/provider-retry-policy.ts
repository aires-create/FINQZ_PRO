export type ProviderRetryDecision = {
  retryable: boolean;
  reason: 'rate_limit' | 'server_error' | 'timeout' | 'network' | 'non_retryable';
};

export type ProviderRetryPolicyConfig = {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
};

const defaultPolicy: ProviderRetryPolicyConfig = {
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  jitterRatio: 0.2,
};

const hasStatus = (error: unknown): error is { status: number } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number';

const isTimeoutError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

export class ProviderRetryPolicy {
  private readonly config: ProviderRetryPolicyConfig;
  private readonly random: () => number;

  constructor(config: Partial<ProviderRetryPolicyConfig> = {}, random: () => number = Math.random) {
    this.config = { ...defaultPolicy, ...config };
    this.random = random;
  }

  decide(error: unknown): ProviderRetryDecision {
    if (isTimeoutError(error)) {
      return { retryable: true, reason: 'timeout' };
    }

    if (hasStatus(error)) {
      if (error.status === 429) {
        return { retryable: true, reason: 'rate_limit' };
      }
      if (error.status >= 500) {
        return { retryable: true, reason: 'server_error' };
      }
      return { retryable: false, reason: 'non_retryable' };
    }

    if (error instanceof Error) {
      return { retryable: true, reason: 'network' };
    }

    return { retryable: false, reason: 'non_retryable' };
  }

  getDelayMs(attempt: number): number {
    const safeAttempt = Math.max(1, attempt);
    const exponent = safeAttempt - 1;
    const raw = this.config.baseDelayMs * 2 ** exponent;
    const capped = Math.min(raw, this.config.maxDelayMs);
    const jitter = capped * this.config.jitterRatio * this.random();
    return Math.round(capped + jitter);
  }
}
