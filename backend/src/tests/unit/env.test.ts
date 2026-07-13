import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.APP_ENV = 'local';
  process.env.DATABASE_URL =
    'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public';
  process.env.JWT_SECRET =
    'test-only-jwt-secret-change-before-runtime-use-32chars';
  process.env.JWT_REFRESH_SECRET =
    'test-only-refresh-secret-change-before-runtime-use-32chars';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
});

const dotenvConfigMock = vi.hoisted(() => vi.fn(() => ({ parsed: {} })));

vi.mock('dotenv', () => ({
  default: {
    config: dotenvConfigMock,
  },
}));

import { parseEnv } from '../../config/env.js';

const testFileDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(testFileDir, '../../../');
const workspaceRoot = path.dirname(backendRoot);
const expectedBackendEnvPath = path.resolve(backendRoot, '.env');
const expectedRootEnvPath = path.resolve(workspaceRoot, '.env');
const expectedSrcEnvPath = path.resolve(backendRoot, 'src/.env');

const snapshotEnv = () => {
  return { ...process.env };
};

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

const loadFreshTestSetupModule = async () => {
  vi.resetModules();
  return await import('../../tests/setup.ts');
};

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

let envSnapshot: NodeJS.ProcessEnv;
let cwdSnapshot = process.cwd();

beforeEach(() => {
  envSnapshot = snapshotEnv();
  cwdSnapshot = process.cwd();
  dotenvConfigMock.mockClear();
  dotenvConfigMock.mockImplementation(() => ({ parsed: {} }));
});

afterEach(() => {
  restoreEnv(envSnapshot);

  if (process.cwd() !== cwdSnapshot) {
    process.chdir(cwdSnapshot);
  }

  vi.restoreAllMocks();
});

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

describe('environment bootstrap contract', () => {
  it('loads backend/.env in development without overriding existing process.env values', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'development',
      PORT: '4567',
    });
    process.env.PORT = '4567';

    dotenvConfigMock.mockImplementation(({ path: configPath, override }) => {
      expect(configPath).toBe(expectedBackendEnvPath);
      expect(override).toBe(false);

      if (override) {
        process.env.PORT = '9999';
      }

      return { parsed: {} };
    });

    const module = await loadFreshEnvModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(module.env.port).toBe(4567);
    expect(process.env.PORT).toBe('4567');
  });

  it('loads backend/.env when NODE_ENV is absent and npm_lifecycle_event=dev', async () => {
    Object.assign(process.env, validEnv, {
      PORT: '4567',
      npm_lifecycle_event: 'dev',
    });
    delete process.env.NODE_ENV;
    delete process.env.APP_ENV;

    await loadFreshEnvModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(dotenvConfigMock).toHaveBeenCalledWith({
      path: expectedBackendEnvPath,
      override: false,
    });
  });

  it('does not load backend/.env when npm_lifecycle_event is not dev', async () => {
    Object.assign(process.env, validEnv, {
      npm_lifecycle_event: 'test',
    });
    delete process.env.NODE_ENV;
    delete process.env.APP_ENV;

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('uses the test setup bootstrap to load backend/.env deterministically', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
      PORT: '4321',
    });

    dotenvConfigMock.mockImplementation(({ path: configPath, override }) => {
      expect(configPath).toBe(expectedBackendEnvPath);
      expect(override).toBe(false);
      return { parsed: {} };
    });

    await loadFreshTestSetupModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(process.env.PORT).toBe('4321');
  });

  it.each([
    ['workspace root', workspaceRoot],
    ['backend directory', backendRoot],
  ])('resolves the same backend/.env from %s cwd', async (_label, cwd) => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'development',
    });
    process.chdir(cwd);

    await loadFreshEnvModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(dotenvConfigMock).toHaveBeenCalledWith({
      path: expectedBackendEnvPath,
      override: false,
    });
  });

  it('does not depend on process.cwd', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'development',
    });

    const cwdSpy = vi.spyOn(process, 'cwd');

    await loadFreshEnvModule();

    expect(cwdSpy).not.toHaveBeenCalled();
    cwdSpy.mockRestore();
  });

  it('does not load a local .env in test', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
      npm_lifecycle_event: 'dev',
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('does not load a local .env in production', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'production',
      APP_ENV: 'production',
      npm_lifecycle_event: 'dev',
      JWT_SECRET: 'prod-secure-alpha-abcdefghijklmnopqrstuvwxyz123456',
      JWT_REFRESH_SECRET: 'prod-secure-beta-abcdefghijklmnopqrstuvwxyz654321',
      PORT: '4000',
      HOST: '0.0.0.0',
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('keeps the compiled dist contract aligned with backend/.env', () => {
    const compiledEnvModulePath = path.resolve(
      backendRoot,
      'dist/config/env/env.js',
    );
    const compiledBackendEnvPath = path.resolve(
      path.dirname(compiledEnvModulePath),
      '../../../.env',
    );

    expect(compiledBackendEnvPath).toBe(expectedBackendEnvPath);
  });

  it('does not consider root .env or src/.env in the test bootstrap', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
      npm_lifecycle_event: 'dev',
    });

    await loadFreshTestSetupModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(dotenvConfigMock).toHaveBeenCalledWith({
      path: expectedBackendEnvPath,
      override: false,
    });
    expect(expectedBackendEnvPath).not.toBe(expectedRootEnvPath);
    expect(expectedBackendEnvPath).not.toBe(expectedSrcEnvPath);
  });

  it('runs before config imports in the test bootstrap', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
    });

    await loadFreshTestSetupModule();

    await expect(import('../../config/app.js')).resolves.toBeDefined();
  });

  it('keeps tests working when backend/.env is absent and process.env is complete', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'test',
      npm_lifecycle_event: 'dev',
    });

    dotenvConfigMock.mockImplementation(() => ({ parsed: {} }));

    await loadFreshTestSetupModule();
    await expect(loadFreshEnvModule()).resolves.toBeDefined();
  });

  it('does not load a local .env in homologation', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'development',
      APP_ENV: 'homologation',
      npm_lifecycle_event: 'dev',
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('preserves variables already injected into process.env when the local file is absent', async () => {
    Object.assign(process.env, validEnv, {
      NODE_ENV: 'development',
      npm_lifecycle_event: 'dev',
      PORT: '4321',
    });

    dotenvConfigMock.mockImplementation(({ override }) => {
      if (override) {
        process.env.PORT = '9999';
      }

      return { parsed: {} };
    });

    await loadFreshEnvModule();

    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(process.env.PORT).toBe('4321');
  });

  it('does not load backend/.env for node dist/server.js without dev lifecycle context', async () => {
    Object.assign(process.env, validEnv, {
      PORT: '4000',
      HOST: '0.0.0.0',
    });
    delete process.env.NODE_ENV;
    delete process.env.APP_ENV;
    delete process.env.npm_lifecycle_event;

    await loadFreshEnvModule();

    expect(dotenvConfigMock).not.toHaveBeenCalled();
  });

  it('continues to validate normally when required variables are missing', () => {
    expect(() => parseEnv({ NODE_ENV: 'test' })).toThrow(
      /DATABASE_URL is required/,
    );
  });
});
