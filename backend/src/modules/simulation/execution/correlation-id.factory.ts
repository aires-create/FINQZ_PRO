import { randomUUID } from 'node:crypto';

export const createSimulationCorrelationId = (prefix = 'sim'): string => {
  return `${prefix}_${randomUUID()}`;
};

