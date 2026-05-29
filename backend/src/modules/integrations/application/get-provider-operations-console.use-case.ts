import {
  providerCapabilityRegistry,
  type IntegrationProviderKey,
  type ProviderCapabilities,
} from './provider-capability-registry.js';
import { ProviderRuntimeDiagnosticsService } from './provider-runtime-diagnostics.service.js';

type ProviderRuntimeHealthEntry = {
  providerKey: string;
  capability: string;
  health: {
    status: 'ok' | 'degraded' | 'down' | 'disabled';
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
    lastLatencyMs?: number;
    sanitizedErrorCode?: string;
    updatedAt?: Date;
  };
};

const getRuntimeStatus = (params: {
  degraded: number;
  down: number;
  disabled: number;
  healthy: number;
  totalProviders: number;
}): 'ok' | 'degraded' | 'down' | 'disabled' | 'idle' => {
  if (params.totalProviders === 0) {
    return 'idle';
  }

  if (params.down > 0) {
    return 'down';
  }

  if (params.degraded > 0) {
    return 'degraded';
  }

  if (params.disabled > 0 && params.healthy === 0) {
    return 'disabled';
  }

  return 'ok';
};

const getProviderStatus = (
  entries: ProviderRuntimeHealthEntry[],
): 'ok' | 'degraded' | 'down' | 'disabled' | 'unknown' => {
  if (entries.length === 0) {
    return 'unknown';
  }

  if (entries.some((entry) => entry.health.status === 'down')) {
    return 'down';
  }

  if (entries.some((entry) => entry.health.status === 'degraded')) {
    return 'degraded';
  }

  if (entries.every((entry) => entry.health.status === 'disabled')) {
    return 'disabled';
  }

  return 'ok';
};

const getLatestDate = (dates: Array<Date | undefined>): Date | undefined => {
  const validDates = dates.filter((value): value is Date => value instanceof Date);
  if (validDates.length === 0) {
    return undefined;
  }

  return new Date(
    Math.max(...validDates.map((value) => value.getTime())),
  );
};

const getLatestErrorCode = (
  entries: ProviderRuntimeHealthEntry[],
): string | undefined => {
  const entriesWithError = entries
    .filter((entry) => entry.health.sanitizedErrorCode)
    .sort((a, b) => {
      const aTime = a.health.updatedAt?.getTime() ?? 0;
      const bTime = b.health.updatedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

  return entriesWithError[0]?.health.sanitizedErrorCode;
};

const getAuthStatus = (
  providerStatus: 'ok' | 'degraded' | 'down' | 'disabled' | 'unknown',
  lastErrorCode?: string,
): 'ok' | 'failed' | 'unknown' => {
  if (lastErrorCode?.includes('AUTHENTICATION')) {
    return 'failed';
  }

  if (providerStatus === 'ok') {
    return 'ok';
  }

  return 'unknown';
};

export class GetProviderOperationsConsoleUseCase {
  constructor(
    private readonly diagnosticsService: ProviderRuntimeDiagnosticsService,
  ) {}

  execute(): {
    generatedAt: Date;
    runtimeStatus: 'ok' | 'degraded' | 'down' | 'disabled' | 'idle';
    summary: {
      generatedAt: Date;
      totalProviders: number;
      healthy: number;
      degraded: number;
      down: number;
      disabled: number;
      averageLatencyMs?: number;
    };
    providers: Array<{
      providerKey: string;
      status: 'ok' | 'degraded' | 'down' | 'disabled' | 'unknown';
      connectivityStatus: 'ok' | 'degraded' | 'down' | 'disabled' | 'unknown';
      authStatus: 'ok' | 'failed' | 'unknown';
      lastLatencyMs?: number;
      lastSuccessAt?: Date;
      lastFailureAt?: Date;
      lastErrorCode?: string;
      capabilities: ProviderCapabilities | null;
      capabilityHealth: Array<{
        capability: string;
        status: 'ok' | 'degraded' | 'down' | 'disabled';
        lastLatencyMs?: number;
        lastSuccessAt?: Date;
        lastFailureAt?: Date;
        lastErrorCode?: string;
      }>;
    }>;
    issues: Array<{
      providerKey: string;
      capability: string;
      status: 'degraded' | 'down';
      sanitizedErrorCode?: string;
      lastFailureAt?: Date;
      latencyMs?: number;
    }>;
    capabilities: Record<string, ProviderCapabilities>;
    counts: {
      degraded: number;
      down: number;
      disabled: number;
    };
  } {
    const snapshot = this.diagnosticsService.getSnapshot();
    const summary = this.diagnosticsService.getSummary();
    const issues = this.diagnosticsService.getIssues();
    const providerHealthEntries = snapshot.providers as ProviderRuntimeHealthEntry[];

    const providerKeys = new Set<string>([
      ...Object.keys(providerCapabilityRegistry),
      ...providerHealthEntries.map((entry) => entry.providerKey),
    ]);

    const providers = Array.from(providerKeys).map((providerKey) => {
      const entries = providerHealthEntries.filter(
        (entry) => entry.providerKey === providerKey,
      );
      const providerStatus = getProviderStatus(entries);
      const lastSuccessAt = getLatestDate(
        entries.map((entry) => entry.health.lastSuccessAt),
      );
      const lastFailureAt = getLatestDate(
        entries.map((entry) => entry.health.lastFailureAt),
      );
      const lastLatencyMs = entries
        .map((entry) => entry.health.lastLatencyMs)
        .filter((value): value is number => typeof value === 'number')
        .at(-1);
      const lastErrorCode = getLatestErrorCode(entries);

      return {
        providerKey,
        status: providerStatus,
        connectivityStatus: providerStatus,
        authStatus: getAuthStatus(providerStatus, lastErrorCode),
        ...(typeof lastLatencyMs === 'number' ? { lastLatencyMs } : {}),
        ...(lastSuccessAt ? { lastSuccessAt } : {}),
        ...(lastFailureAt ? { lastFailureAt } : {}),
        ...(lastErrorCode ? { lastErrorCode } : {}),
        capabilities:
          providerCapabilityRegistry[providerKey as IntegrationProviderKey] ?? null,
        capabilityHealth: entries.map((entry) => ({
          capability: entry.capability,
          status: entry.health.status,
          ...(typeof entry.health.lastLatencyMs === 'number'
            ? { lastLatencyMs: entry.health.lastLatencyMs }
            : {}),
          ...(entry.health.lastSuccessAt
            ? { lastSuccessAt: entry.health.lastSuccessAt }
            : {}),
          ...(entry.health.lastFailureAt
            ? { lastFailureAt: entry.health.lastFailureAt }
            : {}),
          ...(entry.health.sanitizedErrorCode
            ? { lastErrorCode: entry.health.sanitizedErrorCode }
            : {}),
        })),
      };
    });

    return {
      generatedAt: snapshot.generatedAt,
      runtimeStatus: getRuntimeStatus(summary),
      summary,
      providers,
      issues,
      capabilities: providerCapabilityRegistry,
      counts: {
        degraded: summary.degraded,
        down: summary.down,
        disabled: summary.disabled,
      },
    };
  }
}
