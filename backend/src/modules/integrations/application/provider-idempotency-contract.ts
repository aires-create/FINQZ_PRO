import { createHash } from 'node:crypto';

export type ProviderIdempotencyInput = {
  tenantId: string;
  providerKey: string;
  capability: string;
  operation: string;
  externalReference: string;
};

export interface ProviderIdempotencyContract {
  generateIdempotencyKey(input: ProviderIdempotencyInput): string;
  validateIdempotencyScope(input: ProviderIdempotencyInput): boolean;
}

const normalize = (value: string): string => value.trim().toLowerCase();

export class DefaultProviderIdempotencyContract implements ProviderIdempotencyContract {
  generateIdempotencyKey(input: ProviderIdempotencyInput): string {
    const canonical = JSON.stringify({
      tenantId: normalize(input.tenantId),
      providerKey: normalize(input.providerKey),
      capability: normalize(input.capability),
      operation: normalize(input.operation),
      externalReference: normalize(input.externalReference),
    });

    return createHash('sha256').update(canonical).digest('hex');
  }

  validateIdempotencyScope(input: ProviderIdempotencyInput): boolean {
    return Boolean(
      input.tenantId.trim() &&
        input.providerKey.trim() &&
        input.capability.trim() &&
        input.operation.trim() &&
        input.externalReference.trim(),
    );
  }
}
