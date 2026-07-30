import { describe, expect, it } from 'vitest';
import {
  ErrorCategory,
  EventSeverity,
  sanitizeTelemetryContext,
  sanitizeTelemetryIdentifier,
  sanitizeTelemetryText,
  telemetryBaseContextSchema,
  telemetryLogSchema,
  telemetryMetricSchema,
  validateTelemetryContext,
  validateTelemetryLog,
  validateTelemetryMetric,
} from '../../../shared/telemetry/index.js';

describe('shared telemetry primitives', () => {
  it('exposes only generic shared enums', () => {
    expect(EventSeverity.INFO).toBe('INFO');
    expect(ErrorCategory.TELEMETRY).toBe('TELEMETRY');
    expect(telemetryBaseContextSchema.safeParse({
      requestId: 'req-1',
      source: 'shared/logger',
    }).success).toBe(true);
  });

  it('validates generic context, log, and metric contracts', () => {
    const context = validateTelemetryContext({
      requestId: 'req-123',
      source: 'shared/telemetry',
      correlationId: 'corr-123',
    });
    const log = validateTelemetryLog({
      requestId: 'req-123',
      source: 'shared/logger',
      timestamp: '2026-07-12T12:34:56.789Z',
      level: EventSeverity.WARN,
      message: 'fallback used',
    });
    const metric = validateTelemetryMetric({
      requestId: 'req-123',
      source: 'shared/metrics',
      timestamp: '2026-07-12T12:34:56.789Z',
      name: 'telemetry_ratio',
      kind: 'ratio',
      value: 0.42,
      numerator: 'successes',
      denominator: 'attempts',
      labels: {
        consumer: 'MASTER_CATALOG',
      },
    });

    expect(context.success).toBe(true);
    expect(log.success).toBe(true);
    expect(metric.success).toBe(true);
    expect(telemetryLogSchema.safeParse({
      requestId: 'req-123',
      source: 'shared/logger',
      timestamp: '2026-07-12T12:34:56.789Z',
      level: EventSeverity.WARN,
      message: 'fallback used',
    }).success).toBe(true);
    expect(telemetryMetricSchema.safeParse({
      requestId: 'req-123',
      source: 'shared/metrics',
      timestamp: '2026-07-12T12:34:56.789Z',
      name: 'telemetry_ratio',
      kind: 'ratio',
      value: 0.42,
      numerator: 'successes',
      denominator: 'attempts',
      labels: {
        consumer: 'MASTER_CATALOG',
      },
    }).success).toBe(true);
  });

  it('rejects invalid metric labels and negative numeric values', () => {
    const invalidLabels = validateTelemetryMetric({
      requestId: 'req-123',
      source: 'shared/metrics',
      timestamp: '2026-07-12T12:34:56.789Z',
      name: 'telemetry_ratio',
      kind: 'ratio',
      value: 0.42,
      labels: {
        tenantId: 'tenant-123',
      },
    });

    const invalidValue = validateTelemetryMetric({
      requestId: 'req-123',
      source: 'shared/metrics',
      timestamp: '2026-07-12T12:34:56.789Z',
      name: 'telemetry_ratio',
      kind: 'ratio',
      value: -1,
    });

    const invalidShape = telemetryMetricSchema.safeParse({
      requestId: 'req-123',
      source: 'shared/metrics',
      timestamp: '2026-07-12T12:34:56.789Z',
      name: 'telemetry_ratio',
      kind: 'ratio',
      value: 0.42,
      unknownKey: true,
    });

    expect(invalidLabels.success).toBe(false);
    expect(invalidValue.success).toBe(false);
    expect(invalidShape.success).toBe(false);
  });

  it('sanitizes sensitive values, collections, and special types without mutation', () => {
    const cycle: Record<string, unknown> = {
      requestId: 'req-123',
      source: 'shared/telemetry',
      authorization: 'Bearer abc.def.ghi',
      proxyAuthorization: 'Bearer xyz',
      cookie: 'session=abc',
      setCookie: 'secret=value',
      cpf: '12345678901',
      cnpj: '12345678000195',
      bankAccount: '1234567',
      connectionString: 'postgres://user:pass@db.example.com/app',
      url: 'https://user:password@example.com/path?token=abc123&foo=bar',
      date: new Date('2026-07-12T12:34:56.789Z'),
      bigInt: BigInt(42),
      array: ['token=abc', { secret: 'keep-out' }],
      map: new Map([
        ['authorization', 'Bearer map-token'],
        ['nested', { secret: 'map-secret' }],
      ]),
      set: new Set(['set-secret', 'token=from-set']),
      error: new Error('secret failure'),
    };
    cycle.self = cycle;
    Object.defineProperty(cycle, 'throwingGetter', {
      enumerable: true,
      get() {
        throw new Error('getter failed');
      },
    });

    const sanitized = sanitizeTelemetryContext(cycle);

    expect(sanitized.authorization).toBe('[REDACTED]');
    expect(sanitized.proxyAuthorization).toBe('[REDACTED]');
    expect(sanitized.cookie).toBe('[REDACTED]');
    expect(sanitized.setCookie).toBe('[REDACTED]');
    expect(sanitized.cpf).toBe('123.***.***-01');
    expect(sanitized.cnpj).toBe('12.***.***/****-95');
    expect(sanitized.bankAccount).toMatch(/\*+67$/);
    expect(String(sanitized.connectionString)).not.toContain('user:pass');
    expect(String(sanitized.url)).not.toContain('password');
    expect(sanitized.date).toBe('2026-07-12T12:34:56.789Z');
    expect(sanitized.bigInt).toBe('42');
    expect(Array.isArray(sanitized.array)).toBe(true);
    expect((sanitized.array as unknown[])[0]).toBe('[REDACTED]');
    expect((sanitized.array as unknown[])[1]).toEqual({ secret: '[REDACTED]' });
    expect((sanitized.map as Record<string, unknown>)['[REDACTED]']).toBe('[REDACTED]');
    expect((sanitized.map as Record<string, unknown>).nested).toEqual({
      secret: '[REDACTED]',
    });
    expect(Array.isArray(sanitized.set)).toBe(true);
    expect((sanitized.set as unknown[])).toEqual(['[REDACTED]', '[REDACTED]']);
    expect(String(sanitized.error.message)).not.toContain('secret');
    expect(String(sanitized.self)).toBe('[CYCLE]');
    expect(String(sanitized.throwingGetter)).toBe('[REDACTED]');
    expect(cycle.authorization).toBe('Bearer abc.def.ghi');
    expect(cycle.array).toEqual(['token=abc', { secret: 'keep-out' }]);
    expect(cycle.self).toBe(cycle);
  });

  it('handles depth and size limits safely', () => {
    const deep: Record<string, unknown> = { level0: {} };
    let cursor = deep.level0 as Record<string, unknown>;
    for (let index = 1; index <= 8; index += 1) {
      cursor[`level${index}`] = {};
      cursor = cursor[`level${index}`] as Record<string, unknown>;
    }
    const huge = {
      text: 'x'.repeat(5_000),
      array: Array.from({ length: 100 }, (_, index) => index),
    };

    const deepResult = sanitizeTelemetryContext(deep);
    const hugeResult = sanitizeTelemetryContext(huge);

    expect(String(deepResult.level0.level1.level2.level3.level4.level5)).toBe(
      '[MAX_DEPTH]',
    );
    expect(String(hugeResult.text).length).toBeLessThanOrEqual(2_048 + 11);
    expect((hugeResult.array as unknown[]).length).toBeLessThanOrEqual(65);
  });

  it('produces deterministic identifier sanitization', () => {
    expect(sanitizeTelemetryText('  hello\nworld  ')).toBe('hello world');
    expect(sanitizeTelemetryText('https://user:pass@example.com/path?token=abc'))
      .toContain('[REDACTED]');
    expect(sanitizeTelemetryIdentifier('tenant-12345', {
      keepPrefix: 3,
      keepSuffix: 2,
    })).toBe('ten***45');
  });
});
