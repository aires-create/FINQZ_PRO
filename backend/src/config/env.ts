import dotenv from 'dotenv';

dotenv.config();

const requiredEnvKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
  'CORS_ORIGIN',
] as const;

type RequiredEnvKey = (typeof requiredEnvKeys)[number];
type RequiredEnvValues = Record<RequiredEnvKey, string>;

export interface Env {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  redisUrl: string;
  corsOrigin: string[];
  bcryptRounds: number;
  logLevel: string;
  logFile: string;
  swaggerTitle: string;
  swaggerVersion: string;
  swaggerDescription: string;
  swaggerPath: string;
}

const getNonEmptyEnvValue = (key: string): string | undefined => {
  const value = process.env[key]?.trim();

  return value && value.length > 0 ? value : undefined;
};

const loadRequiredEnv = (): RequiredEnvValues => {
  const missingKeys = requiredEnvKeys.filter(
    (key) => getNonEmptyEnvValue(key) === undefined,
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Environment validation failed. Missing required variable(s): ${missingKeys.join(
        ', ',
      )}. Set them before starting the backend.`,
    );
  }

  const values = {} as RequiredEnvValues;

  for (const key of requiredEnvKeys) {
    const value = getNonEmptyEnvValue(key);

    if (value === undefined) {
      throw new Error(
        `Environment validation failed. Missing required variable(s): ${key}. Set it before starting the backend.`,
      );
    }

    values[key] = value;
  }

  return values;
};

const getOptionalEnvValue = (key: string, fallback: string): string => {
  return getNonEmptyEnvValue(key) ?? fallback;
};

const getOptionalNumberEnvValue = (key: string, fallback: number): number => {
  const value = getNonEmptyEnvValue(key);

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Environment validation failed. ${key} must be a valid number.`,
    );
  }

  return parsed;
};

const parseCorsOrigin = (value: string): string[] => {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error(
      'Environment validation failed. CORS_ORIGIN must include at least one origin.',
    );
  }

  return origins;
};

const requiredEnv = loadRequiredEnv();

export const env: Readonly<Env> = Object.freeze({
  nodeEnv: getOptionalEnvValue('NODE_ENV', 'development'),
  host: getOptionalEnvValue('HOST', '0.0.0.0'),
  port: getOptionalNumberEnvValue('PORT', 4000),
  databaseUrl: requiredEnv.DATABASE_URL,
  jwtSecret: requiredEnv.JWT_SECRET,
  jwtRefreshSecret: getOptionalEnvValue(
    'JWT_REFRESH_SECRET',
    requiredEnv.JWT_SECRET,
  ),
  jwtExpiresIn: getOptionalEnvValue('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: getOptionalEnvValue('JWT_REFRESH_EXPIRES_IN', '7d'),
  redisUrl: requiredEnv.REDIS_URL,
  corsOrigin: parseCorsOrigin(requiredEnv.CORS_ORIGIN),
  bcryptRounds: getOptionalNumberEnvValue('BCRYPT_ROUNDS', 10),
  logLevel: getOptionalEnvValue('LOG_LEVEL', 'info'),
  logFile: getOptionalEnvValue('LOG_FILE', 'logs/app.log'),
  swaggerTitle: getOptionalEnvValue('SWAGGER_TITLE', 'FINQZ PRO API'),
  swaggerVersion: getOptionalEnvValue('SWAGGER_VERSION', '1.0.0'),
  swaggerDescription: getOptionalEnvValue(
    'SWAGGER_DESCRIPTION',
    'FINQZ PRO backend API documentation',
  ),
  swaggerPath: getOptionalEnvValue('SWAGGER_PATH', '/api-docs'),
});
