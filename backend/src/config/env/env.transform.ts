import type { z } from 'zod';

import type { rawEnvSchema } from './env.schema.js';
import {
  parseNonNegativeInteger,
  parsePort,
  parsePositiveInteger,
} from './env.parsers.js';

export const parseRedisUrlParts = (value: string | undefined) => {
  if (!value) {
    return {};
  }

  try {
    const url = new URL(value);
    const dbPath = url.pathname.replace('/', '');

    return {
      host: url.hostname || undefined,
      port: parsePort(url.port),
      password: url.password ? decodeURIComponent(url.password) : undefined,
      db: dbPath ? parseNonNegativeInteger(dbPath) : undefined,
      tls: url.protocol === 'rediss:',
    };
  } catch {
    return {};
  }
};

export const parseCorsOrigins = (value: string) => {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const transformEnv = (input: z.infer<typeof rawEnvSchema>) => {
  const port = parsePort(input.PORT) ?? 4000;
  const bcryptRounds = parsePositiveInteger(input.BCRYPT_ROUNDS) ?? 10;
  const swaggerPath = input.SWAGGER_PATH ?? '/api-docs';
  const redisUrlParts = parseRedisUrlParts(input.REDIS_URL);
  const redisHost = input.REDIS_HOST ?? redisUrlParts.host ?? 'localhost';
  const redisPort = parsePort(input.REDIS_PORT) ?? redisUrlParts.port ?? 6379;
  const redisDb = parseNonNegativeInteger(input.REDIS_DB) ?? redisUrlParts.db ?? 0;
  const redisPassword = input.REDIS_PASSWORD ?? redisUrlParts.password;

  return {
    nodeEnv: input.NODE_ENV,
    host: input.HOST ?? '0.0.0.0',
    port,
    databaseUrl: input.DATABASE_URL ?? '',
    jwtSecret: input.JWT_SECRET ?? '',
    jwtRefreshSecret: input.JWT_REFRESH_SECRET ?? '',
    jwtExpiresIn: input.JWT_EXPIRES_IN ?? '15m',
    jwtRefreshExpiresIn: input.JWT_REFRESH_EXPIRES_IN ?? '7d',
    redisUrl: input.REDIS_URL ?? '',
    redisHost,
    redisPort,
    redisPassword,
    redisDb,
    redisTls: redisUrlParts.tls ?? false,
    corsOrigin: parseCorsOrigins(input.CORS_ORIGIN ?? ''),
    bcryptRounds,
    logLevel: input.LOG_LEVEL ?? 'info',
    logFile: input.LOG_FILE ?? 'logs/app.log',
    swaggerTitle: input.SWAGGER_TITLE ?? 'FINQZ PRO API',
    swaggerVersion: input.SWAGGER_VERSION ?? '1.0.0',
    swaggerDescription:
      input.SWAGGER_DESCRIPTION ?? 'FINQZ PRO backend API documentation',
    swaggerPath,
  };
};