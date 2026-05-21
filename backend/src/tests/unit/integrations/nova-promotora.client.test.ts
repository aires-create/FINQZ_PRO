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
    const fetcher = vi.fn(async () => createFetchResponse(200)) as unknown as typeof fetch;

    const result = await testNovaPromotoraConnection({
      apiKey: 'test-api-key',
      baseUrl: 'https://nova-promotora.test',
      fetcher,
      timeoutMs: 100,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      providerKey: 'nova-promotora',
      success: true,
      externalStatus: 'available',
      statusCode: 200,
    });
    expect(result.durationMs).toEqual(expect.any(Number));
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
