import { describe, expect, it } from 'vitest';

import { parseEnv } from '../../config/env.js';

const validEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'local',
  DATABASE_URL:
    'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public',
  REDIS_URL: 'redis://localhost:6379/2',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_DB: '2',
  JWT_SECRET: 'test-only-jwt-secret-change-before-runtime-use-32chars',
  JWT_REFRESH_SECRET: 'test-only-refresh-secret-change-before-runtime-use-32chars',
  CORS_ORIGIN: 'http://localhost:5173',
};

describe('parseEnv', () => {
  it('normalizes a valid isolated test environment', () => {
    const env = parseEnv(validEnv);

    expect(env.nodeEnv).toBe('test');
    expect(env.appEnv).toBe('local');
    expect(env.externalEffectsEnabled).toBe(false);
    expect(env.port).toBe(4000);
    expect(env.host).toBe('0.0.0.0');
    expect(env.databaseUrl).toBe(validEnv.DATABASE_URL);
    expect(env.redisUrl).toBe(validEnv.REDIS_URL);
    expect(env.redisHost).toBe('localhost');
    expect(env.redisPort).toBe(6379);
    expect(env.redisDb).toBe(2);
    expect(env.redisTls).toBe(false);
    expect(env.corsOrigin).toEqual(['http://localhost:5173']);
  });

  it('derives Redis host, port and database from REDIS_URL when explicit fields are omitted', () => {
    const env = parseEnv({
      ...validEnv,
      REDIS_URL: 'redis://:safe-password@redis:6380/4',
      REDIS_HOST: undefined,
      REDIS_PORT: undefined,
      REDIS_DB: undefined,
    });

    expect(env.redisHost).toBe('redis');
    expect(env.redisPort).toBe(6380);
    expect(env.redisPassword).toBe('safe-password');
    expect(env.redisDb).toBe(4);
  });

  it('rejects missing required infrastructure variables', () => {
    expect(() => parseEnv({ NODE_ENV: 'test' })).toThrow(
      /DATABASE_URL is required/,
    );
  });

  it('rejects invalid Redis numeric configuration', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        REDIS_PORT: 'invalid',
      }),
    ).toThrow(/REDIS_PORT must be an integer/);

    expect(() =>
      parseEnv({
        ...validEnv,
        REDIS_DB: '-1',
      }),
    ).toThrow(/REDIS_DB must be a non-negative integer/);
  });

  it('keeps BLUEPAY optional when disabled', () => {
    const env = parseEnv({
      ...validEnv,
      BLUEPAY_ENABLED: 'false',
    });

    expect(env.bluepayEnabled).toBe(false);
    expect(env.bluepayBaseUrl).toBeUndefined();
  });

  it('requires BLUEPAY config when enabled', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        BLUEPAY_ENABLED: 'true',
      }),
    ).toThrow(/BLUEPAY_BASE_URL is required when BLUEPAY_ENABLED=true/);
  });

  it('accepts EXTERNAL_EFFECTS_ENABLED boolean aliases', () => {
    const env = parseEnv({
      ...validEnv,
      APP_ENV: 'production',
      NODE_ENV: 'production',
      JWT_SECRET: 'prod-secure-alpha-abcdefghijklmnopqrstuvwxyz123456',
      JWT_REFRESH_SECRET: 'prod-secure-beta-abcdefghijklmnopqrstuvwxyz654321',
      EXTERNAL_EFFECTS_ENABLED: 'yes',
      PORT: '4000',
      HOST: '0.0.0.0',
    });

    expect(env.externalEffectsEnabled).toBe(true);
  });

  it('rejects EXTERNAL_EFFECTS_ENABLED=true when APP_ENV=local', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        APP_ENV: 'local',
        EXTERNAL_EFFECTS_ENABLED: 'true',
      }),
    ).toThrow(/EXTERNAL_EFFECTS_ENABLED must be false when APP_ENV=local/);
  });

  it('rejects EXTERNAL_EFFECTS_ENABLED=true when APP_ENV=homologation', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        APP_ENV: 'homologation',
        EXTERNAL_EFFECTS_ENABLED: '1',
      }),
    ).toThrow(/EXTERNAL_EFFECTS_ENABLED must be false when APP_ENV=homologation/);
  });

  it('allows EXTERNAL_EFFECTS_ENABLED=true only in production app env', () => {
    const env = parseEnv({
      ...validEnv,
      NODE_ENV: 'production',
      APP_ENV: 'production',
      JWT_SECRET: 'prod-secure-alpha-abcdefghijklmnopqrstuvwxyz123456',
      JWT_REFRESH_SECRET: 'prod-secure-beta-abcdefghijklmnopqrstuvwxyz654321',
      EXTERNAL_EFFECTS_ENABLED: 'on',
      PORT: '4000',
      HOST: '0.0.0.0',
    });

    expect(env.nodeEnv).toBe('production');
    expect(env.appEnv).toBe('production');
    expect(env.externalEffectsEnabled).toBe(true);
  });
});
