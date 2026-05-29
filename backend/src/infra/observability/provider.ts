import { Counter, Gauge, Histogram } from 'prom-client';

import { metricsRegistry } from './registry.js';

const providerMetricLabels = ['provider', 'capability'] as const;
const providerRequestMetricLabels = [
  ...providerMetricLabels,
  'status',
] as const;
const providerFailureMetricLabels = [
  ...providerMetricLabels,
  'error_code',
] as const;

type ProviderStatus = 'success' | 'failure';
type ProviderHealthStatus = 'ok' | 'degraded' | 'down' | 'disabled';

type ProviderRequestMetricInput = {
  provider?: string;
  capability?: string;
  status: ProviderStatus;
  durationMs: number;
  errorCode?: string;
};

type ProviderHealthMetricInput = {
  provider?: string;
  capability?: string;
  status: ProviderHealthStatus;
};

const defaultProviderLabel = 'unknown';
const defaultCapabilityLabel = 'unknown';
const defaultErrorCodeLabel = 'unknown';

const normalizeLabel = (value: string | undefined): string => {
  if (!value) {
    return defaultProviderLabel;
  }

  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
  return normalized || defaultProviderLabel;
};

const getProviderLabels = (provider?: string, capability?: string) => ({
  provider: normalizeLabel(provider),
  capability: normalizeLabel(capability) || defaultCapabilityLabel,
});

const sanitizeErrorCodeLabel = (errorCode?: string): string => {
  if (!errorCode) {
    return defaultErrorCodeLabel;
  }

  const normalized = errorCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_');

  return normalized || defaultErrorCodeLabel;
};

const mapHealthStatusToGaugeValue = (status: ProviderHealthStatus): number => {
  switch (status) {
    case 'ok':
      return 1;
    case 'degraded':
      return 0.5;
    case 'down':
      return 0;
    case 'disabled':
      return -1;
    default:
      return 0;
  }
};

export const providerRequestsTotal = new Counter({
  name: 'finqz_provider_requests_total',
  help: 'Total provider requests executed by FINQZ PRO runtime.',
  labelNames: providerRequestMetricLabels,
  registers: [metricsRegistry],
});

export const providerRequestDurationSeconds = new Histogram({
  name: 'finqz_provider_request_duration_seconds',
  help: 'Provider request duration in seconds.',
  labelNames: providerRequestMetricLabels,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 20],
  registers: [metricsRegistry],
});

export const providerFailuresTotal = new Counter({
  name: 'finqz_provider_failures_total',
  help: 'Total provider request failures.',
  labelNames: providerFailureMetricLabels,
  registers: [metricsRegistry],
});

export const providerHealthStatusGauge = new Gauge({
  name: 'finqz_provider_health_status',
  help: 'Current provider health status (-1 disabled, 0 down, 0.5 degraded, 1 ok).',
  labelNames: providerMetricLabels,
  registers: [metricsRegistry],
});

export const providerCapabilityStatusGauge = new Gauge({
  name: 'finqz_provider_capability_status',
  help: 'Observed provider capability status (1 observed in runtime).',
  labelNames: providerMetricLabels,
  registers: [metricsRegistry],
});

export const recordProviderRequestMetrics = ({
  provider,
  capability,
  status,
  durationMs,
  errorCode,
}: ProviderRequestMetricInput) => {
  const baseLabels = getProviderLabels(provider, capability);
  const labels = {
    ...baseLabels,
    status,
  };

  providerRequestsTotal.inc(labels);
  providerRequestDurationSeconds.observe(labels, Math.max(durationMs, 0) / 1000);
  providerCapabilityStatusGauge.set(baseLabels, 1);

  if (status === 'failure') {
    providerFailuresTotal.inc({
      ...baseLabels,
      error_code: sanitizeErrorCodeLabel(errorCode),
    });
  }
};

export const recordProviderHealthStatusMetric = ({
  provider,
  capability,
  status,
}: ProviderHealthMetricInput) => {
  const labels = getProviderLabels(provider, capability);
  providerHealthStatusGauge.set(labels, mapHealthStatusToGaugeValue(status));
  providerCapabilityStatusGauge.set(labels, 1);
};

