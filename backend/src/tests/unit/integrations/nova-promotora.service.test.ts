import type { NovaPromotoraRequestResult } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.types.js';

const clientMock = vi.hoisted(() => ({
  testNovaPromotoraConnection: vi.fn(),
}));

vi.mock(
  '../../../modules/integrations/providers/nova-promotora/nova-promotora.client.js',
  () => ({
    testNovaPromotoraConnection: clientMock.testNovaPromotoraConnection,
  }),
);

import { ProviderConnectionError } from '../../../modules/integrations/domain/errors/provider-connection.error.js';
import { NovaPromotoraService } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.service.js';

const successResult = (): NovaPromotoraRequestResult => ({
  providerKey: 'nova-promotora',
  success: true,
  externalStatus: 'available',
  statusCode: 200,
  durationMs: 12,
});

const timeoutResult = (): NovaPromotoraRequestResult => ({
  providerKey: 'nova-promotora',
  success: false,
  externalStatus: 'timeout',
  durationMs: 5_000,
  error: {
    code: 'NOVA_PROMOTORA_TIMEOUT',
    message: 'Provider health check timed out',
  },
});

describe('NovaPromotoraService', () => {
  beforeEach(() => {
    clientMock.testNovaPromotoraConnection.mockReset();
  });

  it('returns a normalized connection success response', async () => {
    clientMock.testNovaPromotoraConnection.mockResolvedValue(successResult());
    const service = new NovaPromotoraService();

    await expect(service.testConnection()).resolves.toEqual({
      connected: true,
      status: 200,
    });
  });

  it('turns timeout failures into ProviderConnectionError', async () => {
    clientMock.testNovaPromotoraConnection.mockResolvedValue(timeoutResult());
    const service = new NovaPromotoraService();

    await expect(service.testConnection()).rejects.toThrow(
      ProviderConnectionError,
    );
  });

  it('does not leak external secrets through thrown errors', async () => {
    clientMock.testNovaPromotoraConnection.mockResolvedValue({
      ...timeoutResult(),
      error: {
        code: 'NOVA_PROMOTORA_TIMEOUT',
        message: 'Provider health check timed out token=test-api-key',
      },
    });
    const service = new NovaPromotoraService();

    try {
      await service.testConnection();
      throw new Error('Expected service.testConnection to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderConnectionError);
      expect(error instanceof Error ? error.message : '').not.toContain(
        'test-api-key',
      );
    }
  });
});
