import { createHash } from 'node:crypto';

const stableSerialize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableSerialize);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );

    return entries.reduce<Record<string, unknown>>((accumulator, [key, currentValue]) => {
      accumulator[key] = stableSerialize(currentValue);
      return accumulator;
    }, {});
  }

  return value;
};

export const createSimulationRequestHash = (request: unknown): string => {
  const serialized = JSON.stringify(stableSerialize(request));
  return createHash('sha256').update(serialized ?? '').digest('hex');
};
