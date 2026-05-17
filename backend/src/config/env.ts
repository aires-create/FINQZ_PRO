import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const nodeEnvironments = ['development', 'test', 'production'] as const;

const requiredEnvKeys = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
] as const;

const productionRequiredEnvKeys = ['PORT', 'HOST'] as const;

const blockedProductionSecretExactValues = new Set([
  'secret',
  'password',
  'default',
  'changeme',
  'development',
  'test',
  'jwt_secret',
  'jwtsecret',
]);

const blockedProductionSecretFragments = [
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

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const optionalEnvString = z.preprocess(
  emptyStringToUndefined,
  z.string().optional(),
);

const nodeEnvSchema = z.preprocess(
  emptyStringToUndefined,
  z.enum(nodeEnvironments).default('development'),
);

const rawEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: optionalEnvString,
  HOST: optionalEnvString,
  DATABASE_URL: optionalEnvString,
  REDIS_URL: optionalEnvString,
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

const addEnvIssue = (
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

const isValidUrlWithProtocol = (
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

const parsePort = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const port = Number(value);

  return Number.isInteger(port) && port >= 1 && port <= 65535
    ? port
    : undefined;
};

const parsePositiveInteger = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : undefined;
};

const parseCorsOrigins = (value: string) => {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isInsecureProductionSecret = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue.length < 32 ||
    blockedProductionSecretExactValues.has(normalizedValue) ||
    blockedProductionSecretFragments.some((fragment) =>
      normalizedValue.includes(fragment),
    )
  );
};

const validateRequiredEnv = (
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

const validateUrls = (
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

const validateCors = (
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

const validateProductionSecrets = (
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

const validateNumbers = (
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
};

const transformEnv = (input: z.infer<typeof rawEnvSchema>) => {
  const port = parsePort(input.PORT) ?? 4000;
  const bcryptRounds = parsePositiveInteger(input.BCRYPT_ROUNDS) ?? 10;
  const swaggerPath = input.SWAGGER_PATH ?? '/api-docs';

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

export const envSchema = rawEnvSchema
  .superRefine((input, context) => {
    validateRequiredEnv(input, context);
    validateUrls(input, context);
    validateCors(input, context);
    validateProductionSecrets(input, context);
    validateNumbers(input, context);

    if (input.SWAGGER_PATH && !input.SWAGGER_PATH.startsWith('/')) {
      addEnvIssue(
        context,
        'SWAGGER_PATH',
        'SWAGGER_PATH must start with "/".',
      );
    }
  })
  .transform(transformEnv);

export type Env = Readonly<z.infer<typeof envSchema>>;

const formatEnvValidationError = (error: z.ZodError) => {
  const uniqueMessages = [
    ...new Set(
      error.issues.map((issue) => {
        const key = issue.path.join('.') || 'ENV';

        return `${key}: ${issue.message}`;
      }),
    ),
  ];

  return [
    'Environment validation failed.',
    ...uniqueMessages.map((message) => `- ${message}`),
    'Fix these variables before starting the backend. Values are hidden for security.',
  ].join('\n');
};

export const parseEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatEnvValidationError(result.error));
  }

  return Object.freeze(result.data);
};

export const env = parseEnv();
