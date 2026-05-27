import { TokenManager } from '../../../modules/integrations/application/token-manager.js';

describe('TokenManager', () => {
  it('reuses cached token while still valid', async () => {
    const resolver = vi.fn(async () => ({
      accessToken: 'token-1',
      expiresAt: Date.now() + 60_000,
    }));
    const manager = new TokenManager(resolver);

    const tokenA = await manager.getToken();
    const tokenB = await manager.getToken();

    expect(tokenA).toBe('token-1');
    expect(tokenB).toBe('token-1');
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('avoids concurrent refresh duplication', async () => {
    let resolveCall: ((value: { accessToken: string; expiresAt: number }) => void) | null = null;
    const resolver = vi.fn(
      () =>
        new Promise<{ accessToken: string; expiresAt: number }>((resolve) => {
          resolveCall = resolve;
        }),
    );
    const manager = new TokenManager(resolver);

    const pendingA = manager.getToken();
    const pendingB = manager.getToken();
    resolveCall?.({
      accessToken: 'token-2',
      expiresAt: Date.now() + 60_000,
    });

    await expect(Promise.all([pendingA, pendingB])).resolves.toEqual([
      'token-2',
      'token-2',
    ]);
    expect(resolver).toHaveBeenCalledTimes(1);
  });
});
