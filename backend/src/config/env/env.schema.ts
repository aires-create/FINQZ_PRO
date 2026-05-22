import { z } from 'zod';

export const nodeEnvironments = [
  'development',
  'test',
  'production',
] as const;

export const requiredEnvKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
] as const;

export const productionRequiredEnvKeys = [
  'PORT',
  'HOST',
] as const;

export const blockedProductionSecretExactValues = new Set([
  'secret',
  'password',
  'default',
  'changeme',
  'development',
  'test',
  'jwt_secret',
  'jwtsecret',
]);

export const blockedProductionSecretFragments = [
  'change-me',
  'replace-me',
  'your-',
  'example',
  'jwt-secret',
  'super-secret',
  'dev-secret',
  'dev-only',
  'change-before-production',
  'development',
];

export const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : undefined;
};

export const optionalEnvString = z.preprocess(
  emptyStringToUndefined,
  z.string().optional(),
);

export const nodeEnvSchema = z.preprocess(
  emptyStringToUndefined,
  z.enum(nodeEnvironments).default('development'),
);

export const rawEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: optionalEnvString,
  HOST: optionalEnvString,
  DATABASE_URL: optionalEnvString,
  REDIS_URL: optionalEnvString,
  REDIS_HOST: optionalEnvString,
  REDIS_PORT: optionalEnvString,
  REDIS_PASSWORD: optionalEnvString,
  REDIS_DB: optionalEnvString,
  JWT_SECRET: optionalEnvString,
  JWT_REFRESH_SECRET: optionalEnvString,
  JWT_EXPIRES_IN: optionalEnvString,
  JWT_REFRESH_EXPIRES_IN: optionalEnvString,
  CORS_ORIGIN: optionalEnvString,
  BCRYPT_ROUNDS: optionalEnvString,
  LOG_LEVEL: optionalEnvString,
  LOG_FILE: optionalEnvString,
  SWAGGER_TITLE: optionalEnvString,
  SWAGGER_VERSION: optionalEnvString,
  SWAGGER_DESCRIPTION: optionalEnvString,
  SWAGGER_PATH: optionalEnvString,
});