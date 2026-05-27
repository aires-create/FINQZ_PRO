import type {
  BluepayCommissionPayoutResult,
  BluepayRequestResult,
} from '../../../modules/integrations/providers/bluepay/bluepay.types.js';

const clientMock = vi.hoisted(() => ({
  createBluepayCommissionPayout: vi.fn(),
  getBluepayCommissionPayoutStatus: vi.fn(),
  listBluepayCommissionPayouts: vi.fn(),
  testBluepayConnection: vi.fn(),
}));

vi.mock('../../../modules/integrations/providers/bluepay/bluepay.client.js', () => ({
  createBluepayCommissionPayout: clientMock.createBluepayCommissionPayout,
  getBluepayCommissionPayoutStatus: clientMock.getBluepayCommissionPayoutStatus,
  listBluepayCommissionPayouts: clientMock.listBluepayCommissionPayouts,
  testBluepayConnection: clientMock.testBluepayConnection,
}));

import { BluepayService } from '../../../modules/integrations/providers/bluepay/bluepay.service.js';

const successConnectionResult = (): BluepayRequestResult => ({
  providerKey: 'bluepay',
  success: true,
  externalStatus: 'available',
  statusCode: 200,
  durationMs: 10,
});

const payoutNotImplementedResult = (): BluepayCommissionPayoutResult => ({
  providerKey: 'bluepay',
  success: false,
  durationMs: 2,
  error: {
    code: 'BLUEPAY_NOT_IMPLEMENTED',
    message: 'Commission payout runtime is not implemented yet',
  },
});

describe('BluepayService', () => {
  beforeEach(() => {
    clientMock.createBluepayCommissionPayout.mockReset();
    clientMock.getBluepayCommissionPayoutStatus.mockReset();
    clientMock.listBluepayCommissionPayouts.mockReset();
    clientMock.testBluepayConnection.mockReset();
  });

  it('supports optional provider runtime via bindRuntime', async () => {
    clientMock.testBluepayConnection.mockResolvedValue(successConnectionResult());
    const service = new BluepayService();
    const runtimeService = service.bindRuntime({
      context: {
        requestId: 'req-runtime-bluepay',
        tenantId: 'integration-test',
        providerKey: 'bluepay',
        capability: 'healthCheck',
        operation: 'test_connection',
        startedAt: new Date(),
        attempt: 1,
      },
    });

    await runtimeService.testConnection();

    expect(clientMock.testBluepayConnection).toHaveBeenCalledTimes(1);
    expect(clientMock.testBluepayConnection.mock.calls[0][0]).toMatchObject({
      context: {
        requestId: 'req-runtime-bluepay',
      },
    });
  });

  it('preserves public behavior for payout not implemented', async () => {
    clientMock.createBluepayCommissionPayout.mockResolvedValue(payoutNotImplementedResult());
    const service = new BluepayService();

    await expect(
      service.createCommissionPayout({
        commissionExternalIds: ['COM-1'],
      }),
    ).rejects.toBeTruthy();
  });

  it('passes runtime payout context to client on createCommissionPayout', async () => {
    clientMock.createBluepayCommissionPayout.mockResolvedValue(payoutNotImplementedResult());
    const service = new BluepayService().bindRuntime({
      context: {
        requestId: 'req-runtime-payout',
        tenantId: 'tenant-1',
        providerKey: 'bluepay',
        capability: 'healthCheck',
        operation: 'test_connection',
        startedAt: new Date(),
        attempt: 1,
      },
    }) as BluepayService;

    await expect(
      service.createCommissionPayout({
        commissionExternalIds: ['COM-1'],
      }),
    ).rejects.toBeTruthy();

    expect(clientMock.createBluepayCommissionPayout).toHaveBeenCalledTimes(1);
    expect(clientMock.createBluepayCommissionPayout.mock.calls[0][1]).toMatchObject({
      context: {
        tenantId: 'tenant-1',
        providerKey: 'bluepay',
        capability: 'commissionPayout',
        operation: 'createCommissionPayout',
      },
    });
  });
});
