import { z } from 'zod';

import type { rawEnvSchema } from './env.schema.js';
import {
  blockedProductionSecretExactValues,
  blockedProductionSecretFragments,
  productionRequiredEnvKeys,
  requiredEnvKeys,
} from './env.schema.js';
import {
  parseNonNegativeInteger,
  parsePort,
  parsePositiveInteger,
} from './env.parsers.js';

export const addEnvIssue = (
  context: z.RefinementCtx,
  key: string,
  message: string,
) => {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: [key],
    message,
  });
};

export const isValidUrlWithProtocol = (
  value: string,
  allowedProtocols: readonly string[],
) => {
  try {
    const url = new URL(value);

    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
};

export const parseCorsOrigins = (value: string) => {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const isInsecureProductionSecret = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue.length < 32 ||
    blockedProductionSecretExactValues.has(normalizedValue) ||
    blockedProductionSecretFragments.some((fragment) =>
      normalizedValue.includes(fragment),
    )
  );
};

export const validateRequiredEnv = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  for (const key of requiredEnvKeys) {
    if (!input[key]) {
      addEnvIssue(context, key, `${key} is required.`);
    }
  }

  if (input.NODE_ENV === 'production') {
    for (const key of productionRequiredEnvKeys) {
      if (!input[key]) {
        addEnvIssue(context, key, `${key} is required in production.`);
      }
    }
  }
};

export const validateUrls = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  if (
    input.DATABASE_URL &&
    !isValidUrlWithProtocol(input.DATABASE_URL, ['postgresql:', 'postgres:'])
  ) {
    addEnvIssue(
      context,
      'DATABASE_URL',
      'DATABASE_URL must be a valid PostgreSQL URL.',
    );
  }

  if (
    input.REDIS_URL &&
    !isValidUrlWithProtocol(input.REDIS_URL, ['redis:', 'rediss:'])
  ) {
    addEnvIssue(
      context,
      'REDIS_URL',
      'REDIS_URL must be a valid Redis URL.',
    );
  }
};

export const validateCors = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  if (!input.CORS_ORIGIN) {
    return;
  }

  const origins = parseCorsOrigins(input.CORS_ORIGIN);

  if (origins.length === 0) {
    addEnvIssue(
      context,
      'CORS_ORIGIN',
      'CORS_ORIGIN must include at least one origin.',
    );
    return;
  }

  for (const origin of origins) {
    if (origin === '*') {
      if (input.NODE_ENV === 'production') {
        addEnvIssue(
          context,
          'CORS_ORIGIN',
          'CORS_ORIGIN cannot use wildcard in production.',
        );
      }

      continue;
    }

    if (!isValidUrlWithProtocol(origin, ['http:', 'https:'])) {
      addEnvIssue(
        context,
        'CORS_ORIGIN',
        'CORS_ORIGIN entries must be valid http(s) origins.',
      );
    }
  }
};

export const validateProductionSecrets = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  if (input.NODE_ENV !== 'production') {
    return;
  }

  if (input.JWT_SECRET && isInsecureProductionSecret(input.JWT_SECRET)) {
    addEnvIssue(
      context,
      'JWT_SECRET',
      'JWT_SECRET is insecure for production. Use a strong secret with at least 32 characters.',
    );
  }

  if (
    input.JWT_REFRESH_SECRET &&
    isInsecureProductionSecret(input.JWT_REFRESH_SECRET)
  ) {
    addEnvIssue(
      context,
      'JWT_REFRESH_SECRET',
      'JWT_REFRESH_SECRET is insecure for production. Use a strong secret with at least 32 characters.',
    );
  }

  if (
    input.JWT_SECRET &&
    input.JWT_REFRESH_SECRET &&
    input.JWT_SECRET === input.JWT_REFRESH_SECRET
  ) {
    addEnvIssue(
      context,
      'JWT_REFRESH_SECRET',
      'JWT_REFRESH_SECRET must be different from JWT_SECRET in production.',
    );
  }
};

export const validateNumbers = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  if (input.PORT !== undefined && parsePort(input.PORT) === undefined) {
    addEnvIssue(
      context,
      'PORT',
      'PORT must be an integer between 1 and 65535.',
    );
  }

  if (
    input.BCRYPT_ROUNDS !== undefined &&
    parsePositiveInteger(input.BCRYPT_ROUNDS) === undefined
  ) {
    addEnvIssue(
      context,
      'BCRYPT_ROUNDS',
      'BCRYPT_ROUNDS must be a positive integer.',
    );
  }

  if (input.REDIS_PORT !== undefined && parsePort(input.REDIS_PORT) === undefined) {
    addEnvIssue(
      context,
      'REDIS_PORT',
      'REDIS_PORT must be an integer between 1 and 65535.',
    );
  }

  if (
    input.REDIS_DB !== undefined &&
    parseNonNegativeInteger(input.REDIS_DB) === undefined
  ) {
    addEnvIssue(
      context,
      'REDIS_DB',
      'REDIS_DB must be a non-negative integer.',
    );
  }
};

export const validateSwaggerPath = (
  input: z.infer<typeof rawEnvSchema>,
  context: z.RefinementCtx,
) => {
  if (input.SWAGGER_PATH && !input.SWAGGER_PATH.startsWith('/')) {
    addEnvIssue(
      context,
      'SWAGGER_PATH',
      'SWAGGER_PATH must start with "/".',
    );
  }
};