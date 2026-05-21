import {
  testNovaPromotoraConnection,
} from '../../../modules/integrations/providers/nova-promotora/nova-promotora.client.js';

const createFetchResponse = (status: number) => {
  return new Response(null, {
    status,
  });
};

describe('NovaPromotora client', () => {
  it('returns a normalized success result without calling the real provider', async () => {
    let requestedUrl: string | undefined;
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      requestedUrl = String(input);

      return createFetchResponse(200);
    }) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test',
      fetcher,
      healthPath: '/api',
      timeoutMs: 100,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(requestedUrl).toBe('https://nova-promotora.test/api');
    expect(result).toMatchObject({
      providerKey: 'nova-promotora',
      success: true,
      externalStatus: 'available',
      statusCode: 200,
    });
    expect(result.durationMs).toEqual(expect.any(Number));
  });

  it('uses a custom health path when building the final URL', async () => {
    let requestedUrl: string | undefined;
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      requestedUrl = String(input);

      return createFetchResponse(204);
    }) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test/backoffice',
      fetcher,
      healthPath: '/health/status',
      timeoutMs: 100,
    });

    expect(requestedUrl).toBe(
      'https://nova-promotora.test/backoffice/health/status',
    );
    expect(result).toMatchObject({
      success: true,
      statusCode: 204,
    });
  });

  it('normalizes duplicate slashes between base URL and health path', async () => {
    let requestedUrl: string | undefined;
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      requestedUrl = String(input);

      return createFetchResponse(200);
    }) as unknown as typeof fetch;

    await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test//base//',
      fetcher,
      healthPath: '//api//health//',
      timeoutMs: 100,
    });

    expect(requestedUrl).toBe('https://nova-promotora.test/base/api/health');
  });

  it('returns a configuration error when health path is missing', async () => {
    vi.stubEnv('NOVA_PROMOTORA_HEALTH_PATH', '');
    const fetcher = vi.fn(async () => createFetchResponse(200)) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test',
      fetcher,
      timeoutMs: 100,
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      providerKey: 'nova-promotora',
      success: false,
      externalStatus: 'configuration_error',
      error: {
        code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
        message: 'Provider configuration is incomplete',
      },
    });
  });

  it('returns a sanitized timeout result without leaking secrets', async () => {
    const fetcher = vi.fn(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => {
              const error = new Error('aborted token=test-api-key');
              error.name = 'AbortError';
              reject(error);
            },
            {
              once: true,
            },
          );
        }),
    ) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test',
      fetcher,
      healthPath: '/api',
      timeoutMs: 1,
    });
    const serializedResult = JSON.stringify(result);

    expect(result).toMatchObject({
      providerKey: 'nova-promotora',
      success: false,
      externalStatus: 'timeout',
      error: {
        code: 'NOVA_PROMOTORA_TIMEOUT',
        message: 'Provider health check timed out',
      },
    });
    expect(serializedResult).not.toContain('test-api-key');
    expect(serializedResult).not.toContain('aborted token');
  });

  it('returns a sanitized network failure result', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network failed with token=test-api-key');
    }) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test',
      fetcher,
      healthPath: '/api',
      timeoutMs: 100,
    });

    expect(result).toMatchObject({
      providerKey: 'nova-promotora',
      success: false,
      externalStatus: 'network_error',
      error: {
        code: 'NOVA_PROMOTORA_NETWORK_ERROR',
        message: 'Provider health check request failed',
      },
    });
    expect(JSON.stringify(result)).not.toContain('test-api-key');
  });
});
