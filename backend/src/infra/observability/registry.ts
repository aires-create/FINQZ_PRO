import { Registry } from 'prom-client';

import { config } from '../../config/app.js';

export const metricsRegistry = new Registry();

metricsRegistry.setDefaultLabels({
  service: 'finqz-pro-api',
  environment: config.nodeEnv,
});
