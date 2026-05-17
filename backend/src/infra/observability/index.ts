import { metricsRegistry } from './registry.js';
import { initializeProcessMetrics } from './process.js';

export { metricsRegistry } from './registry.js';
export { recordHttpRequestMetrics } from './http.js';
export { recordRateLimitExceeded } from './rate-limit.js';

export const initializeObservability = () => {
  initializeProcessMetrics();
};

export const getPrometheusMetrics = async () => {
  return {
    contentType: metricsRegistry.contentType,
    body: await metricsRegistry.metrics(),
  };
};
