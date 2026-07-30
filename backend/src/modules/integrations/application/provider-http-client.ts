import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import { ProviderRateLimitError } from '../domain/errors/provider-rate-limit.error.js';
import type { ProviderExecutionContext } from './provider-execution-context.js';
import { mapProviderError } from './provider-error-mapper.js';
import { ProviderHealthTracker } from './provider-health-tracker.js';
import { ProviderRetryPolicy } from './provider-retry-policy.js';
import { sanitizeProviderError } from './provider-sanitizer.js';
import {
  recordProviderHealthStatusMetric,
  recordProviderRequestMetrics,
} from '../../../infra/observability/index.js';

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export type ProviderHttpClientOptions = {
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  fetcher?: typeof fetch;
  context?: ProviderExecutionContext;
  healthTracker?: ProviderHealthTracker;
  providerRetryPolicy?: ProviderRetryPolicy;
};

export type ProviderRequestOptions = RequestInit & {
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  context?: ProviderExecutionContext;
  capability?: string;
  providerKey?: string;
  operation?: string;
};

const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 2_000,
};

const defaultTimeoutMs = 5_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt: number, policy: RetryPolicy): number => {
  const raw = policy.baseDelayMs * 2 ** (attempt - 1);
  return Math.min(raw, policy.maxDelayMs);
};

const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

const parseRetryAfterMs = (response: Response): number | null => {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const asDate = Date.parse(retryAfter);
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now();
    return delta > 0 ? delta : 0;
  }

  return null;
};

export class ProviderHttpClient {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retryPolicy: RetryPolicy;
  private readonly context: ProviderExecutionContext | undefined;
  private readonly healthTracker: ProviderHealthTracker | undefined;
  private readonly providerRetryPolicy: ProviderRetryPolicy | undefined;

  constructor(options: ProviderHttpClientOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.retryPolicy = options.retryPolicy ?? defaultRetryPolicy;
    this.context = options.context;
    this.healthTracker = options.healthTracker;
    this.providerRetryPolicy = options.providerRetryPolicy;
  }

  async request(url: string, options: ProviderRequestOptions = {}): Promise<Response> {
    const {
      timeoutMs: requestTimeoutMs,
      retryPolicy: requestRetryPolicy,
      context: requestContext,
      capability: requestCapability,
      providerKey: requestProviderKey,
      operation: _requestOperation,
      ...requestInit
    } = options;

    const retryPolicy = requestRetryPolicy ?? this.retryPolicy;
    const timeoutMs = requestTimeoutMs ?? this.timeoutMs;
    const governanceRetryPolicy = this.providerRetryPolicy;
    const startedAt = Date.now();
    const context = requestContext ?? this.context;
    const providerKey = requestProviderKey ?? context?.providerKey;
    const capability = requestCapability ?? context?.capability;

    let lastError: unknown;

    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await this.fetcher(url, {
          ...requestInit,
          signal: controller.signal,
        });

        const shouldRetry = governanceRetryPolicy
          ? governanceRetryPolicy.decide({ status: response.status }).retryable
          : isRetryableStatus(response.status);

        if (!shouldRetry || attempt === retryPolicy.maxAttempts) {
          if (response.status === 429) {
            this.trackHealthFailure({
              providerKey,
              capability,
              startedAt,
              finalStatus: 'down',
              error: new ProviderRateLimitError(providerKey ?? 'unknown'),
            });
            throw new ProviderRateLimitError('unknown');
          }

          this.trackHealthSuccess({
            providerKey,
            capability,
            startedAt,
          });
          return response;
        }

        const retryAfterMs = parseRetryAfterMs(response);
        const delayMs = retryAfterMs ?? this.resolveRetryDelay(attempt, retryPolicy);
        this.trackHealthFailure({
          providerKey,
          capability,
          startedAt,
          finalStatus: 'degraded',
          error: { status: response.status },
        });
        await sleep(delayMs);
        continue;
      } catch (error) {
        lastError = error;
        const retryDecision = governanceRetryPolicy?.decide(error);
        const retryableByGovernance = retryDecision?.retryable ?? null;
        const retryableByLegacy =
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError'
            ? true
            : !(error instanceof ProviderRateLimitError);
        const shouldRetry = retryableByGovernance ?? retryableByLegacy;

        if (!shouldRetry || attempt === retryPolicy.maxAttempts) {
          this.trackHealthFailure({
            providerKey,
            capability,
            startedAt,
            finalStatus: 'down',
            error,
          });

          if (
            typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            error.name === 'AbortError'
          ) {
            throw error;
          }
          if (error instanceof ProviderRateLimitError) {
            throw error;
          }

          throw new ProviderConnectionError('unknown');
        }

        this.trackHealthFailure({
          providerKey,
          capability,
          startedAt,
          finalStatus: 'degraded',
          error,
        });
        await sleep(this.resolveRetryDelay(attempt, retryPolicy));
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    throw lastError ?? new ProviderConnectionError('unknown');
  }

  private resolveRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    if (this.providerRetryPolicy) {
      return this.providerRetryPolicy.getDelayMs(attempt);
    }

    return backoffDelay(attempt, retryPolicy);
  }

  private trackHealthSuccess(params: {
    providerKey: string | undefined;
    capability: string | undefined;
    startedAt: number;
  }): void {
    const providerKey = params.providerKey ?? 'unknown';
    const capability = params.capability ?? 'unknown';
    const latencyMs = Date.now() - params.startedAt;

    recordProviderRequestMetrics({
      provider: providerKey,
      capability,
      status: 'success',
      durationMs: latencyMs,
    });
    recordProviderHealthStatusMetric({
      provider: providerKey,
      capability,
      status: 'ok',
    });

    if (this.healthTracker && params.providerKey && params.capability) {
      this.healthTracker.set(params.providerKey, params.capability, {
        status: 'ok',
        latencyMs,
        lastSuccessAt: new Date(),
      });
    }
  }

  private trackHealthFailure(params: {
    providerKey: string | undefined;
    capability: string | undefined;
    startedAt: number;
    finalStatus: 'degraded' | 'down';
    error: unknown;
  }): void {
    const providerKey = params.providerKey ?? 'unknown';
    const capability = params.capability ?? 'unknown';
    const latencyMs = Date.now() - params.startedAt;

    const mappedCode = mapProviderError(params.error);
    const sanitized = sanitizeProviderError(params.error);
    const sanitizedErrorCode = sanitized.code ?? mappedCode;
    recordProviderRequestMetrics({
      provider: providerKey,
      capability,
      status: 'failure',
      durationMs: latencyMs,
      errorCode: sanitizedErrorCode,
    });
    recordProviderHealthStatusMetric({
      provider: providerKey,
      capability,
      status: params.finalStatus,
    });

    if (this.healthTracker && params.providerKey && params.capability) {
      this.healthTracker.set(params.providerKey, params.capability, {
        status: params.finalStatus,
        latencyMs,
        lastFailureAt: new Date(),
        sanitizedErrorCode,
      });
    }
  }
}
