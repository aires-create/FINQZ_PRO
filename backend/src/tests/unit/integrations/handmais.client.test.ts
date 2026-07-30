import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';
import { runHandmaisInitialSimulation } from '../../../modules/integrations/providers/handmais/handmais.client.js';

const originalEnv = {
  baseUrl: process.env.HANDMAIS_BASE_URL,
  apiKey: process.env.HANDMAIS_API_KEY,
  timeout: process.env.HANDMAIS_TIMEOUT,
};

const setRequiredEnv = () => {
  vi.stubEnv('HANDMAIS_BASE_URL', 'https://app.handmais.com');
  vi.stubEnv('HANDMAIS_API_KEY', 'test-handmais-api-key');
  vi.stubEnv('HANDMAIS_TIMEOUT', '5000');
};

describe('Handmais client initial simulation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.HANDMAIS_BASE_URL = originalEnv.baseUrl;
    process.env.HANDMAIS_API_KEY = originalEnv.apiKey;
    process.env.HANDMAIS_TIMEOUT = originalEnv.timeout;
    vi.restoreAllMocks();
  });

  it('normalizes success 2xx with valor_margem', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({
        valor_margem: 1234.56,
        matricula: 'MATRICULA001',
        cnpj: '12345678000190',
        mensagem: 'ok',
      }),
    );

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA001',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toMatchObject({
      cpfMasked: '***3188',
      matricula: 'MATRICULA001',
      cnpj: '12345678000190',
      availableMargin: 1234.56,
      providerStatusCode: 200,
      providerMessage: 'ok',
    });
    expect(result.diagnostics.externalCall).toBe(true);
    expect(result.diagnostics.endpoint).toContain('/uy3/simulacao_clt');
    expect(result.diagnostics.latencyMs).toEqual(expect.any(Number));
  });

  it('normalizes success 2xx with alternative margin fields', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({
        availableMargin: '2500,75',
        message: 'simulacao recebida',
      }),
    );

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA002',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.availableMargin).toBe(2500.75);
    expect(result.data.providerMessage).toBe('simulacao recebida');
  });

  it('returns auth invalid on 401/403', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA003',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_AUTH_INVALID');
    expect(result.diagnostics.providerStatusCode).toBe(401);
    expect(result.diagnostics.normalizedProviderError).toBe('PROVIDER_AUTHENTICATION_ERROR');
  });

  it('returns timeout error when request aborts', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    vi.stubEnv('HANDMAIS_TIMEOUT', '1');

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA004',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_TIMEOUT_ERROR');
    expect(result.diagnostics.timeoutStatus).toBe('timeout');
    expect(result.diagnostics.normalizedProviderError).toBe('PROVIDER_TIMEOUT_ERROR');
  });

  it('returns provider unavailable on 5xx', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 503 }));

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA005',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_PROVIDER_UNAVAILABLE');
    expect(result.diagnostics.connectivityStatus).toBe('degraded');
    expect(result.diagnostics.normalizedProviderError).toBe('PROVIDER_CONNECTION_ERROR');
  });

  it('returns invalid response on malformed JSON body', async () => {
    setRequiredEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('not-json', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: 'MATRICULA006',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_INVALID_RESPONSE');
  });

  it('returns invalid CPF without external call', async () => {
    setRequiredEnv();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await runHandmaisInitialSimulation({
      cpf: '123',
      matricula: 'MATRICULA007',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_INVALID_CPF');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns invalid matricula without external call', async () => {
    setRequiredEnv();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await runHandmaisInitialSimulation({
      cpf: '02481903188',
      matricula: '   ',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('HANDMAIS_INVALID_MATRICULA');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('tracks health status for initialSimulation capability', async () => {
    setRequiredEnv();
    const healthTracker = new ProviderHealthTracker();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ valor_margem: 10 }));

    const result = await runHandmaisInitialSimulation(
      {
        cpf: '02481903188',
        matricula: 'MATRICULA008',
      },
      {
        healthTracker,
      },
    );

    expect(result.success).toBe(true);
    expect(healthTracker.get('handmais', 'initialSimulation')?.status).toBe('ok');
  });
});
