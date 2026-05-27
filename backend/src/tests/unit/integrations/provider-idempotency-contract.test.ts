import { DefaultProviderIdempotencyContract } from '../../../modules/integrations/application/provider-idempotency-contract.js';

describe('DefaultProviderIdempotencyContract', () => {
  it('generates deterministic idempotency key for same scope', () => {
    const contract = new DefaultProviderIdempotencyContract();
    const input = {
      tenantId: 'tenant-1',
      providerKey: 'bluepay',
      capability: 'commission_payout',
      operation: 'create',
      externalReference: 'proposal-123',
    };

    const first = contract.generateIdempotencyKey(input);
    const second = contract.generateIdempotencyKey(input);

    expect(first).toBe(second);
  });

  it('validates required idempotency scope', () => {
    const contract = new DefaultProviderIdempotencyContract();

    expect(
      contract.validateIdempotencyScope({
        tenantId: 'tenant-1',
        providerKey: 'bluepay',
        capability: 'commission_payout',
        operation: 'create',
        externalReference: 'proposal-123',
      }),
    ).toBe(true);

    expect(
      contract.validateIdempotencyScope({
        tenantId: ' ',
        providerKey: 'bluepay',
        capability: 'commission_payout',
        operation: 'create',
        externalReference: 'proposal-123',
      }),
    ).toBe(false);
  });
});
