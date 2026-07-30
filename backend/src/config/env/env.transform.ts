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

const parseOptionalBoolean = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
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
  const sosBolsoTimeoutMs = parsePositiveInteger(input.SOS_BOLSO_TIMEOUT_MS);
  const sosBolsoEnabled = parseOptionalBoolean(input.SOS_BOLSO_ENABLED) ?? false;
  const bluepayTimeoutMs = parsePositiveInteger(input.BLUEPAY_TIMEOUT_MS);
  const bluepayEnabled = parseOptionalBoolean(input.BLUEPAY_ENABLED) ?? false;
  const handmaisTimeoutMs = parsePositiveInteger(input.HANDMAIS_TIMEOUT);
  const externalEffectsEnabled =
    parseOptionalBoolean(input.EXTERNAL_EFFECTS_ENABLED) ?? false;

  return {
    nodeEnv: input.NODE_ENV,
    appEnv: input.APP_ENV,
    externalEffectsEnabled,
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
    sosBolsoEnabled,
    sosBolsoBaseUrl: input.SOS_BOLSO_BASE_URL,
    sosBolsoTokenPath: input.SOS_BOLSO_TOKEN_PATH,
    sosBolsoMarginPath: input.SOS_BOLSO_MARGIN_PATH,
    sosBolsoClientId: input.SOS_BOLSO_CLIENT_ID,
    sosBolsoClientSecret: input.SOS_BOLSO_CLIENT_SECRET,
    sosBolsoTimeoutMs,
    sosBolsoSignedJwt: input.SOS_BOLSO_SIGNED_JWT,
    bluepayEnabled,
    bluepayBaseUrl: input.BLUEPAY_BASE_URL,
    bluepayClientId: input.BLUEPAY_CLIENT_ID,
    bluepayClientSecret: input.BLUEPAY_CLIENT_SECRET,
    bluepayTimeoutMs,
    handmaisBaseUrl: input.HANDMAIS_BASE_URL,
    handmaisApiKey: input.HANDMAIS_API_KEY,
    handmaisTimeoutMs,
    handmaisEnv: input.HANDMAIS_ENV,
    handmaisLogin: input.HANDMAIS_LOGIN,
    handmaisPassword: input.HANDMAIS_PASSWORD,
  };
};
