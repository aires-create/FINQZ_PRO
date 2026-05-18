import { describe, expect, it } from 'vitest';

import { sanitizeLogText } from '../../shared/logger.js';

describe('sanitizeLogText', () => {
  it('redacts common sensitive runtime log values', () => {
    const sanitized = sanitizeLogText(
      [
        'password=super-secret',
        'Authorization: Bearer abc.def.ghi',
        'access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
        'redis://:secret-password@localhost:6379/0',
      ].join(' '),
    );

    expect(sanitized).not.toContain('super-secret');
    expect(sanitized).not.toContain('abc.def.ghi');
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(sanitized).not.toContain('secret-password');
    expect(sanitized).toContain('[REDACTED]');
  });
});
