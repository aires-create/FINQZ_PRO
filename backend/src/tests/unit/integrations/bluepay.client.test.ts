import {
  authenticateBluepay,
  createBluepayCommissionPayout,
  testBluepayConnection,
} from '../../../modules/integrations/providers/bluepay/bluepay.client.js';
import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';
import { DefaultProviderIdempotencyContract } from '../../../modules/integrations/application/provider-idempotency-contract.js';

describe('Bluepay client skeleton', () => {
  it('returns provider disabled when bluepay is disabled', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    const result = await testBluepayConnection({
      enabled: false,
      fetcher,
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      providerKey: 'bluepay',
      success: false,
      externalStatus: 'disabled',
      error: {
        code: 'BLUEPAY_PROVIDER_DISABLED',
      },
    });
  });

  it('updates health tracker as disabled when provider is disabled', async () => {
    const healthTracker = new ProviderHealthTracker();

    await testBluepayConnection({
      enabled: false,
      healthTracker,
      context: {
        requestId: 'r1',
        tenantId: 't1',
        providerKey: 'bluepay',
        capability: 'healthCheck',
        operation: 'testConnection',
        startedAt: new Date(),
        attempt: 1,
      },
    });

    expect(healthTracker.get('bluepay', 'healthCheck')?.status).toBe('disabled');
  });

  it('returns configuration error when enabled but required config is missing', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    const result = await authenticateBluepay({
      enabled: true,
      fetcher,
      baseUrl: 'https://api.bluepay.test',
      clientId: '',
      clientSecret: '',
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      providerKey: 'bluepay',
      success: false,
      error: {
        code: 'BLUEPAY_CONFIGURATION_ERROR',
      },
    });
  });

  it('does not call external API and returns not implemented on payout skeleton', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;

    const result = await createBluepayCommissionPayout(
      {
        commissionExternalIds: ['COM-1'],
      },
      {
        enabled: true,
        baseUrl: 'https://api.bluepay.test',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        fetcher,
      },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      providerKey: 'bluepay',
      success: false,
      error: {
        code: 'BLUEPAY_NOT_IMPLEMENTED',
      },
    });
  });

  it('keeps configuration error behavior and marks health as down', async () => {
    const healthTracker = new ProviderHealthTracker();

    const result = await testBluepayConnection({
      enabled: true,
      baseUrl: '',
      clientId: '',
      clientSecret: '',
      healthTracker,
      context: {
        requestId: 'r2',
        tenantId: 't1',
        providerKey: 'bluepay',
        capability: 'healthCheck',
        operation: 'testConnection',
        startedAt: new Date(),
        attempt: 1,
      },
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: 'BLUEPAY_CONFIGURATION_ERROR' },
    });
    expect(healthTracker.get('bluepay', 'healthCheck')?.status).toBe('down');
  });

  it('generates deterministic idempotency key in payout foundation without external call', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const contract = new DefaultProviderIdempotencyContract();
    const generateSpy = vi.spyOn(contract, 'generateIdempotencyKey');

    const result = await createBluepayCommissionPayout(
      {
        commissionExternalIds: ['COM-2', 'COM-1'],
      },
      {
        enabled: true,
        baseUrl: 'https://api.bluepay.test',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        fetcher,
        idempotencyContract: contract,
        context: {
          requestId: 'r3',
          tenantId: 'tenant-1',
          providerKey: 'bluepay',
          capability: 'commissionPayout',
          operation: 'createCommissionPayout',
          startedAt: new Date(),
          attempt: 1,
        },
      },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: false,
      error: { code: 'BLUEPAY_NOT_IMPLEMENTED' },
    });
  });

  it('runtime blocks payout execution when idempotency scope is invalid', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const healthTracker = new ProviderHealthTracker();

    const result = await createBluepayCommissionPayout(
      {
        commissionExternalIds: [],
      },
      {
        enabled: true,
        baseUrl: 'https://api.bluepay.test',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        fetcher,
        healthTracker,
        context: {
          requestId: 'r4',
          tenantId: 'tenant-1',
          providerKey: 'bluepay',
          capability: 'commissionPayout',
          operation: 'createCommissionPayout',
          startedAt: new Date(),
          attempt: 1,
        },
      },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: false,
      error: { code: 'BLUEPAY_NOT_IMPLEMENTED' },
    });
    expect(healthTracker.get('bluepay', 'commissionPayout')?.status).toBe('degraded');
    expect(healthTracker.get('bluepay', 'commissionPayout')?.sanitizedErrorCode).toBe(
      'invalid_scope',
    );
  });

  it('runtime allows valid payout context and keeps dry-run pending path', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const healthTracker = new ProviderHealthTracker();

    const result = await createBluepayCommissionPayout(
      {
        commissionExternalIds: ['COM-11'],
      },
      {
        enabled: true,
        baseUrl: 'https://api.bluepay.test',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        fetcher,
        healthTracker,
        context: {
          requestId: 'r5',
          tenantId: 'tenant-1',
          providerKey: 'bluepay',
          capability: 'commissionPayout',
          operation: 'createCommissionPayout',
          startedAt: new Date(),
          attempt: 1,
        },
      },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: false,
      error: { code: 'BLUEPAY_NOT_IMPLEMENTED' },
    });
    expect(healthTracker.get('bluepay', 'commissionPayout')?.status).toBe('degraded');
    expect(healthTracker.get('bluepay', 'commissionPayout')?.sanitizedErrorCode).toBe(
      'BLUEPAY_NOT_IMPLEMENTED',
    );
  });
});
