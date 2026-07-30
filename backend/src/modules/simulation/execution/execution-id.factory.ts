import { randomUUID } from 'node:crypto';

export const createSimulationExecutionId = (prefix = 'sim'): string => {
  return `${prefix}_${randomUUID()}`;
};
