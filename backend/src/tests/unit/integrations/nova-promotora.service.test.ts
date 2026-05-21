import type {
  NovaPromotoraProposalsRequestResult,
  NovaPromotoraRequestResult,
} from '../../../modules/integrations/providers/nova-promotora/nova-promotora.types.js';

const clientMock = vi.hoisted(() => ({
  listNovaPromotoraProposals: vi.fn(),
  testNovaPromotoraConnection: vi.fn(),
}));

vi.mock(
  '../../../modules/integrations/providers/nova-promotora/nova-promotora.client.js',
  () => ({
    listNovaPromotoraProposals: clientMock.listNovaPromotoraProposals,
    testNovaPromotoraConnection: clientMock.testNovaPromotoraConnection,
  }),
);

import { ProviderConfigurationError } from '../../../modules/integrations/domain/errors/provider-configuration.error.js';
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

const proposalsResult = (): NovaPromotoraProposalsRequestResult => ({
  providerKey: 'nova-promotora',
  success: true,
  externalStatus: 'available',
  statusCode: 200,
  durationMs: 20,
  data: {
    data: [
      {
        id: 'PROP-1',
        nomeCliente: 'Maria Silva',
        cpf: '12345678900',
        situacao: 'Aprovada',
        valor: '1500.50',
        dataCriacao: '2026-05-21T00:00:00.000Z',
      },
    ],
  },
});

const proposalsConfigurationError = (): NovaPromotoraProposalsRequestResult => ({
  providerKey: 'nova-promotora',
  success: false,
  externalStatus: 'configuration_error',
  durationMs: 1,
  error: {
    code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
    message: 'Provider configuration is incomplete',
  },
});

describe('NovaPromotoraService', () => {
  beforeEach(() => {
    clientMock.listNovaPromotoraProposals.mockReset();
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

  it('returns normalized read-only proposals', async () => {
    clientMock.listNovaPromotoraProposals.mockResolvedValue(proposalsResult());
    const service = new NovaPromotoraService();

    await expect(service.listProposals()).resolves.toEqual([
      {
        externalId: 'PROP-1',
        customerName: 'Maria Silva',
        document: '12345678900',
        status: 'Aprovada',
        amount: 1500.5,
        createdAt: '2026-05-21T00:00:00.000Z',
        providerKey: 'nova-promotora',
        rawStatus: 'Aprovada',
      },
    ]);
  });

  it('turns missing proposals path into ProviderConfigurationError', async () => {
    clientMock.listNovaPromotoraProposals.mockResolvedValue(
      proposalsConfigurationError(),
    );
    const service = new NovaPromotoraService();

    await expect(service.listProposals()).rejects.toThrow(
      ProviderConfigurationError,
    );
  });

  it('does not leak external proposal details through thrown errors', async () => {
    clientMock.listNovaPromotoraProposals.mockResolvedValue({
      ...proposalsConfigurationError(),
      error: {
        code: 'NOVA_PROMOTORA_CONFIGURATION_ERROR',
        message: 'Provider configuration is incomplete token=test-api-key body={sensitive}',
      },
    });
    const service = new NovaPromotoraService();

    try {
      await service.listProposals();
      throw new Error('Expected service.listProposals to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderConfigurationError);
      expect(error instanceof Error ? error.message : '').not.toContain(
        'test-api-key',
      );
      expect(error instanceof Error ? error.message : '').not.toContain(
        'sensitive',
      );
    }
  });
});
