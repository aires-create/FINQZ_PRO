import { describe, expect, it } from 'vitest';

import { createCommercialRequestBodySchema } from '../../../modules/commercial-governance/requests/presentation/http/commercial-request.schema.js';

describe('commercial request HTTP schemas', () => {
  it('allows only client-owned create fields', () => {
    const result = createCommercialRequestBodySchema.parse({
      reason: 'Campaign update',
      justification: 'Commercial condition needs approval',
    });

    expect(result).toEqual({
      reason: 'Campaign update',
      justification: 'Commercial condition needs approval',
    });
  });

  it('rejects server-owned create fields from the client body', () => {
    expect(() =>
      createCommercialRequestBodySchema.parse({
        requestNumber: 'CR-TENANT-2026-000001',
        year: 2026,
        sequence: 1,
        status: 'Submitted',
        requestedAt: '2026-05-31T12:00:00.000Z',
        reason: 'Campaign update',
        justification: 'Commercial condition needs approval',
      }),
    ).toThrow();
  });
});
