import { afterEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
process.env.PORT = '4000';
process.env.HOST = '127.0.0.1';
process.env.DATABASE_URL =
  'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB = '0';
process.env.JWT_SECRET = 'test-only-jwt-secret-change-before-runtime-use-32chars';
process.env.JWT_REFRESH_SECRET =
  'test-only-refresh-secret-change-before-runtime-use-32chars';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = 'error';
process.env.LOG_FILE = 'logs/test.log';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
