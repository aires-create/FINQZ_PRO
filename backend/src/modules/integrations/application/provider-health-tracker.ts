export type ProviderHealthStatus = 'ok' | 'degraded' | 'down' | 'disabled';

export type ProviderHealthSnapshot = {
  status: ProviderHealthStatus;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  latencyMs?: number;
  lastLatencyMs?: number;
  sanitizedErrorCode?: string;
  updatedAt?: Date;
  successCount?: number;
  failureCount?: number;
};

type ProviderHealthKey = `${string}:${string}`;

const makeKey = (providerKey: string, capability: string): ProviderHealthKey =>
  `${providerKey}:${capability}`;

export class ProviderHealthTracker {
  private readonly state = new Map<ProviderHealthKey, ProviderHealthSnapshot>();

  set(
    providerKey: string,
    capability: string,
    snapshot: ProviderHealthSnapshot,
  ): ProviderHealthSnapshot {
    const key = makeKey(providerKey, capability);
    const current = this.state.get(key);
    const successCount =
      snapshot.status === 'ok' ? (current?.successCount ?? 0) + 1 : current?.successCount;
    const failureCount =
      snapshot.status === 'degraded' || snapshot.status === 'down'
        ? (current?.failureCount ?? 0) + 1
        : current?.failureCount;
    const lastLatencyMs =
      typeof snapshot.latencyMs === 'number' ? snapshot.latencyMs : current?.lastLatencyMs;

    const next: ProviderHealthSnapshot = {
      ...current,
      ...snapshot,
      ...(typeof successCount === 'number' ? { successCount } : {}),
      ...(typeof failureCount === 'number' ? { failureCount } : {}),
      ...(typeof lastLatencyMs === 'number' ? { lastLatencyMs } : {}),
      updatedAt: new Date(),
    };
    this.state.set(key, next);
    return next;
  }

  get(providerKey: string, capability: string): ProviderHealthSnapshot | undefined {
    return this.state.get(makeKey(providerKey, capability));
  }

  list(): ReadonlyArray<{
    providerKey: string;
    capability: string;
    health: ProviderHealthSnapshot;
  }> {
    return Array.from(this.state.entries()).map(([key, health]) => {
      const separatorIndex = key.indexOf(':');
      return {
        providerKey: key.slice(0, separatorIndex),
        capability: key.slice(separatorIndex + 1),
        health,
      };
    });
  }

  snapshot(): {
    generatedAt: Date;
    total: number;
    byStatus: Record<ProviderHealthStatus, number>;
    providers: Array<{
      providerKey: string;
      capability: string;
      health: ProviderHealthSnapshot;
    }>;
  } {
    const providers = this.list();
    const byStatus: Record<ProviderHealthStatus, number> = {
      ok: 0,
      degraded: 0,
      down: 0,
      disabled: 0,
    };

    for (const item of providers) {
      byStatus[item.health.status] += 1;
    }

    return {
      generatedAt: new Date(),
      total: providers.length,
      byStatus,
      providers: [...providers],
    };
  }

  clear(): void {
    this.state.clear();
  }
}
