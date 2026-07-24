import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dotenvConfigMock = vi.hoisted(() => vi.fn(() => ({ parsed: {} })));

vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public';
  process.env.REDIS_URL = 'redis://localhost:6379/2';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.REDIS_DB = '2';
  process.env.JWT_SECRET =
    'test-only-jwt-secret-with-sufficient-minimum-length-01';
  process.env.JWT_REFRESH_SECRET =
    'test-only-refresh-secret-with-sufficient-minimum-length-01';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.BLUEPAY_ENABLED = 'false';
  process.env.SOS_BOLSO_ENABLED = 'false';
});

vi.mock('dotenv', () => ({
  default: {
    config: dotenvConfigMock,
  },
}));

import { parseEnv } from '../../config/env.js';

const testFileDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(testFileDir, '../../../');
const expectedBackendEnvPath = path.resolve(backendRoot, '.env');

const validEnv = {
  NODE_ENV: 'test',
  DATABASE_URL:
    'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public',
  REDIS_URL: 'redis://localhost:6379/2',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_DB: '2',
  JWT_SECRET: 'test-only-jwt-secret-with-sufficient-minimum-length-01',
  JWT_REFRESH_SECRET:
    'test-only-refresh-secret-with-sufficient-minimum-length-01',
  CORS_ORIGIN: 'http://localhost:5173',
};

const snapshotEnv = () => ({ ...process.env });

const restoreEnv = (snapshot: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
};

const loadFreshEnvModule = async () => {
  vi.resetModules();
  return await import('../../config/env.js');
};

let envSnapshot: NodeJS.ProcessEnv;

beforeEach(() => {
  envSnapshot = snapshotEnv();
  dotenvConfigMock.mockClear();
  dotenvConfigMock.mockImplementation(() => ({ parsed: {} }));
});

afterEach(() => {
  restoreEnv(envSnapshot);
  vi.restoreAllMocks();
});

describe('parseEnv', () => {
  it('normalizes a valid isolated test environment', () => {
    const env = parseEnv(validEnv);

    expect(env.nodeEnv).toBe('test');
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

  it('rejects missing required infrastructure variables without exposing secrets', () => {
    expect(() => parseEnv({ NODE_ENV: 'test' })).toThrow(
      /Values are hidden for security/,
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
});

describe('environment bootstrap contract', () => {
  it('loads backend/.env in development via npm lifecycle and preserves injected values', async () => {
    Object.assign(process.env, validEnv, {
      PORT: '4567',
      npm_lifecycle_event: 'dev',
    });
    delete process.env.NODE_ENV;

    dotenvConfigMock.mockImplementation((options = {}) => {
      expect(options).toEqual({});
      expect(dotenvConfigMock.mock.calls[0] ?? []).toEqual([]);
      expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
      process.env.NODE_ENV = 'development';
      return { parsed: {} };
    });

    const module = await loadFreshEnvModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(module.env.port).toBe(4567);
    expect(process.env.PORT).toBe('4567');
  });

  it('does not load backend/.env in test even when npm_lifecycle_event=dev', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
      npm_lifecycle_event: 'dev',
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('does not load backend/.env in production even when npm_lifecycle_event=dev', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'production',
      PORT: '4000',
      HOST: '0.0.0.0',
      JWT_SECRET:
        'prod-secure-alpha-abcdefghijklmnopqrstuvwxyz123456',
      JWT_REFRESH_SECRET:
        'prod-secure-beta-abcdefghijklmnopqrstuvwxyz654321',
      npm_lifecycle_event: 'dev',
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });
});
