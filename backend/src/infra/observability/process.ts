import { Gauge, collectDefaultMetrics } from 'prom-client';

import { metricsRegistry } from './registry.js';

let processMetricsInitialized = false;

const processUptimeSeconds = new Gauge({
  name: 'finqz_process_uptime_seconds',
  help: 'FINQZ PRO API process uptime in seconds.',
  registers: [metricsRegistry],
  collect() {
    this.set(process.uptime());
  },
});

export const initializeProcessMetrics = () => {
  if (processMetricsInitialized) {
    return;
  }

  collectDefaultMetrics({
    register: metricsRegistry,
    eventLoopMonitoringPrecision: 10,
  });

  processMetricsInitialized = true;
};

export { processUptimeSeconds };
