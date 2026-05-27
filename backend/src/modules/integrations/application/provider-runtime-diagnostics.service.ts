import type {
  ProviderHealthSnapshot,
  ProviderHealthStatus,
} from './provider-health-tracker.js';
import { ProviderHealthTracker } from './provider-health-tracker.js';

type ProviderDiagnosticsEntry = {
  providerKey: string;
  capability: string;
  health: ProviderHealthSnapshot;
};

export class ProviderRuntimeDiagnosticsService {
  constructor(private readonly healthTracker: ProviderHealthTracker) {}

  getSnapshot() {
    return this.healthTracker.snapshot();
  }

  getSummary(): {
    generatedAt: Date;
    totalProviders: number;
    healthy: number;
    degraded: number;
    down: number;
    disabled: number;
    averageLatencyMs?: number;
  } {
    const snapshot = this.healthTracker.snapshot();
    const latencies = snapshot.providers
      .map((entry) => entry.health.lastLatencyMs)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const averageLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((acc, value) => acc + value, 0) / latencies.length)
        : undefined;

    return {
      generatedAt: snapshot.generatedAt,
      totalProviders: snapshot.total,
      healthy: snapshot.byStatus.ok,
      degraded: snapshot.byStatus.degraded,
      down: snapshot.byStatus.down,
      disabled: snapshot.byStatus.disabled,
      ...(typeof averageLatencyMs === 'number' ? { averageLatencyMs } : {}),
    };
  }

  getIssues(): Array<{
    providerKey: string;
    capability: string;
    status: 'degraded' | 'down';
    sanitizedErrorCode?: string;
    lastFailureAt?: Date;
    latencyMs?: number;
  }> {
    return this.healthTracker
      .list()
      .filter(
        (entry): entry is ProviderDiagnosticsEntry & { health: ProviderHealthSnapshot & { status: 'degraded' | 'down' } } =>
          entry.health.status === 'degraded' || entry.health.status === 'down',
      )
      .map((entry) => ({
        providerKey: entry.providerKey,
        capability: entry.capability,
        status: entry.health.status,
        ...(entry.health.sanitizedErrorCode
          ? { sanitizedErrorCode: entry.health.sanitizedErrorCode }
          : {}),
        ...(entry.health.lastFailureAt ? { lastFailureAt: entry.health.lastFailureAt } : {}),
        ...(typeof entry.health.lastLatencyMs === 'number'
          ? { latencyMs: entry.health.lastLatencyMs }
          : {}),
      }));
  }

  getProviderDiagnostics(providerKey: string): Array<{
    providerKey: string;
    capability: string;
    health: ProviderHealthSnapshot;
  }> {
    return this.healthTracker
      .list()
      .filter((entry) => entry.providerKey === providerKey);
  }
}
