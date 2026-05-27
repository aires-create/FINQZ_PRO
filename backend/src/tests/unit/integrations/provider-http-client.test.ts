import { ProviderHttpClient } from '../../../modules/integrations/application/provider-http-client.js';
import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';
import { ProviderRetryPolicy } from '../../../modules/integrations/application/provider-retry-policy.js';
import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { ProviderRateLimitError } from '../../../modules/integrations/domain/errors/provider-rate-limit.error.js';

describe('ProviderHttpClient', () => {
  it('keeps compatibility with legacy constructor and request usage', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
    });

    const response = await client.request('https://provider.test/legacy');

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and returns success when next attempt is ok', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { 'retry-after': '0' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      retryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    const response = await client.request('https://provider.test/health');

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('throws ProviderRateLimitError after exhausting retries on 429', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '0' } }));
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      retryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    await expect(client.request('https://provider.test/health')).rejects.toBeInstanceOf(
      ProviderRateLimitError,
    );
  });

  it('throws ProviderConnectionError when fetch fails repeatedly', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down');
    });
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      retryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    await expect(client.request('https://provider.test/health')).rejects.toBeInstanceOf(
      ProviderConnectionError,
    );
  });

  it('retries on 500 and returns success when next attempt is ok', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      retryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    const response = await client.request('https://provider.test/retry-500');

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('preserves timeout behavior on final attempt', async () => {
    const fetcher = vi.fn(async () => {
      throw new DOMException('Timeout', 'AbortError');
    });
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      retryPolicy: {
        maxAttempts: 1,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    await expect(client.request('https://provider.test/timeout')).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('registers success on health tracker when governance context is available', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const healthTracker = new ProviderHealthTracker();
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      healthTracker,
      context: {
        requestId: 'r1',
        tenantId: 't1',
        providerKey: 'bluepay',
        capability: 'commission_payout',
        operation: 'create',
        startedAt: new Date(),
        attempt: 1,
      },
    });

    await client.request('https://provider.test/success');

    expect(healthTracker.get('bluepay', 'commission_payout')?.status).toBe('ok');
    expect(healthTracker.get('bluepay', 'commission_payout')?.sanitizedErrorCode).toBeUndefined();
  });

  it('registers failure on health tracker with sanitized error code', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down');
    });
    const healthTracker = new ProviderHealthTracker();
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      healthTracker,
      context: {
        requestId: 'r2',
        tenantId: 't2',
        providerKey: 'sos-bolso',
        capability: 'margin_inquiry',
        operation: 'simulate',
        startedAt: new Date(),
        attempt: 1,
      },
      retryPolicy: {
        maxAttempts: 1,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    await expect(client.request('https://provider.test/failure')).rejects.toBeInstanceOf(
      ProviderConnectionError,
    );

    const snapshot = healthTracker.get('sos-bolso', 'margin_inquiry');
    expect(snapshot?.status).toBe('down');
    expect(snapshot?.sanitizedErrorCode).toBe('PROVIDER_UNKNOWN_ERROR');
  });

  it('uses providerRetryPolicy when provided', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    const customPolicy = new ProviderRetryPolicy(
      { baseDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
      () => 0,
    );
    const decideSpy = vi.spyOn(customPolicy, 'decide');
    const client = new ProviderHttpClient({
      fetcher: fetcher as unknown as typeof fetch,
      providerRetryPolicy: customPolicy,
      retryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      },
    });

    const response = await client.request('https://provider.test/governance-retry');

    expect(decideSpy).toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(500);
  });
});
