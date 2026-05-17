import { Counter } from 'prom-client';

import { metricsRegistry } from './registry.js';

const rateLimitMetricLabels = ['policy', 'route'] as const;

type RateLimitMetricLabel = (typeof rateLimitMetricLabels)[number];

type RateLimitExceededInput = {
  policy: string;
  route: string;
};

export const rateLimitExceededTotal = new Counter<RateLimitMetricLabel>({
  name: 'finqz_rate_limit_exceeded_total',
  help: 'Total number of FINQZ PRO API requests blocked by distributed rate limiting.',
  labelNames: rateLimitMetricLabels,
  registers: [metricsRegistry],
});

export const recordRateLimitExceeded = ({
  policy,
  route,
}: RateLimitExceededInput) => {
  rateLimitExceededTotal.inc({
    policy,
    route,
  });
};
