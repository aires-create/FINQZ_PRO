import { Counter, Histogram } from 'prom-client';

import { metricsRegistry } from './registry.js';

const httpMetricLabels = ['method', 'route', 'status_code'] as const;
// Keep requestId out of Prometheus labels. It is high-cardinality by design;
// per-request investigation belongs in structured logs and security events.

type HttpMetricLabel = (typeof httpMetricLabels)[number];

type HttpMetricInput = {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
};

const normalizeRoute = (route: string) => {
  const path = route.split('?')[0] || '/';

  return path
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
};

export const httpRequestsTotal = new Counter<HttpMetricLabel>({
  name: 'finqz_http_requests_total',
  help: 'Total number of HTTP requests handled by the FINQZ PRO API.',
  labelNames: httpMetricLabels,
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram<HttpMetricLabel>({
  name: 'finqz_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for the FINQZ PRO API.',
  labelNames: httpMetricLabels,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const recordHttpRequestMetrics = ({
  method,
  route,
  statusCode,
  durationMs,
}: HttpMetricInput) => {
  const labels = {
    method: method.toUpperCase(),
    route: normalizeRoute(route),
    status_code: String(statusCode),
  };

  httpRequestsTotal.inc(labels);
  httpRequestDurationSeconds.observe(labels, durationMs / 1000);
};
