import {
  __resetSosBolsoTokenCacheForTests,
  authenticateSosBolso,
  inquireSosBolsoMargin,
  testSosBolsoConnection,
} from '../../../modules/integrations/providers/sos-bolso/sos-bolso.client.js';
import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';
import type { ProviderExecutionContext } from '../../../modules/integrations/application/provider-execution-context.js';

const createJsonResponse = (payload: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
  });

describe('SosBolso client', () => {
  beforeEach(() => {
    __resetSosBolsoTokenCacheForTests();
  });

  it('returns configuration error when required config is missing', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    const result = await testSosBolsoConnection({
      fetcher,
      timeoutMs: 50,
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      providerKey: 'sos-bolso',
      success: false,
      externalStatus: 'configuration_error',
      error: {
        code: 'SOS_BOLSO_CONFIGURATION_ERROR',
      },
    });
  });

  it('returns authentication failure when auth endpoint rejects credentials', async () => {
    const fetcher = vi.fn(async () => createJsonResponse({}, 401)) as unknown as typeof fetch;

    const result = await authenticateSosBolso({
      baseUrl: 'https://sos-bolso.test',
      signedJwt: 'jwt-assinado',
      fetcher,
      timeoutMs: 50,
    });

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'SOS_BOLSO_AUTHENTICATION_ERROR',
      },
    });
  });

  it('retries authenticate request after transient 429 and succeeds', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { 'retry-after': '0' },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          access_token: 'token-abc',
          expires_in: 3600,
        }),
      ) as unknown as typeof fetch;

    const result = await authenticateSosBolso({
      baseUrl: 'https://sos-bolso.test',
      signedJwt: 'jwt-assinado',
      fetcher,
      timeoutMs: 50,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      success: true,
      accessToken: 'token-abc',
    });
  });

  it('returns timeout on network abort during margin inquiry', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(_input);
      if (url.includes('/oauth/token')) {
        return createJsonResponse({
          access_token: 'token-abc',
          expires_in: 3600,
        });
      }

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          },
          { once: true },
        );
      });
    }) as unknown as typeof fetch;

    const result = await inquireSosBolsoMargin(
      {
        document: '12345678901',
        metadata: {
          convenioCnpj: '12345678000190',
          enrollmentId: '98765',
        },
      },
      {
        baseUrl: 'https://sos-bolso.test',
        signedJwt: 'jwt-assinado',
        fetcher,
        timeoutMs: 1,
      },
    );

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'SOS_BOLSO_TIMEOUT',
      },
    });
  });

  it('reuses cached token while valid and normalizes inquiry response', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/oauth/token')) {
        return createJsonResponse({
          access_token: 'token-abc',
          expires_in: 3600,
        });
      }

      return createJsonResponse({
        cpf_cliente: '12345678901',
        matriculas: [
          {
            matricula_cliente: '98765',
            cnpj_convenio: '12345678000190',
            nome_orgao: 'Prefeitura',
            valor_margem_total: 3500,
            valor_margem_disponivel: 1250.5,
          },
        ],
      });
    }) as unknown as typeof fetch;

    const input = {
      document: '12345678901',
      metadata: {
        convenioCnpj: '12345678000190',
        enrollmentId: '98765',
      },
    };

    const first = await inquireSosBolsoMargin(input, {
      baseUrl: 'https://sos-bolso.test',
      signedJwt: 'jwt-assinado',
      fetcher,
      timeoutMs: 100,
    });
    const second = await inquireSosBolsoMargin(input, {
      baseUrl: 'https://sos-bolso.test',
      signedJwt: 'jwt-assinado',
      fetcher,
      timeoutMs: 100,
    });

    expect(first).toMatchObject({
      success: true,
      data: {
        providerKey: 'sos-bolso',
        availableMargin: 1250.5,
        currency: 'BRL',
      },
    });
    expect(second).toMatchObject({
      success: true,
      data: {
        providerKey: 'sos-bolso',
        availableMargin: 1250.5,
      },
    });

    const authCalls = fetcher.mock.calls.filter(([url]) => String(url).includes('/oauth/token'));
    expect(authCalls).toHaveLength(1);
  });

  it('updates health tracker on successful margin inquiry and preserves requestId header', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/oauth/token')) {
        return createJsonResponse({
          access_token: 'token-abc',
          expires_in: 3600,
        });
      }

      return createJsonResponse({
        cpf_cliente: '12345678901',
        matriculas: [
          {
            matricula_cliente: '98765',
            cnpj_convenio: '12345678000190',
            nome_orgao: 'Prefeitura',
            valor_margem_total: 3500,
            valor_margem_disponivel: 1250.5,
          },
        ],
      });
    }) as unknown as typeof fetch;

    const healthTracker = new ProviderHealthTracker();
    const context: ProviderExecutionContext = {
      requestId: 'req-governance-1',
      tenantId: 'integration-test',
      providerKey: 'sos-bolso',
      capability: 'marginInquiry',
      operation: 'test_margin_inquiry',
      startedAt: new Date(),
      attempt: 1,
      metadata: { requestId: 'req-governance-1' },
    };

    const result = await inquireSosBolsoMargin(
      {
        document: '12345678901',
        metadata: {
          convenioCnpj: '12345678000190',
          enrollmentId: '98765',
          requestId: 'req-governance-1',
        },
      },
      {
        baseUrl: 'https://sos-bolso.test',
        signedJwt: 'jwt-assinado',
        requestId: 'req-governance-1',
        fetcher,
        timeoutMs: 100,
        context,
        healthTracker,
      },
    );

    expect(result.success).toBe(true);
    const marginCall = fetcher.mock.calls.find(([url]) => String(url).includes('/consulta-margem'));
    expect(marginCall).toBeDefined();
    expect((marginCall?.[1]?.headers as Record<string, string>)['X-Request-ID']).toBe(
      'req-governance-1',
    );
    expect(healthTracker.get('sos-bolso', 'marginInquiry')?.status).toBe('ok');
  });
});
