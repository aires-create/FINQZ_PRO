import { Redis, type RedisOptions } from 'ioredis';

import { config } from '../../config/app.js';
import { logger } from '../../shared/logger.js';

const redisConnectTimeoutMs = 500;
const redisCommandTimeoutMs = 500;
const redisMaxRetryAttempts = 10;
const redisMaxRetryDelayMs = 2_000;
const redisErrorLogIntervalMs = 30_000;

let redisClient: Redis | null = null;
let lastRedisErrorLogAt = 0;

const redisRuntimeContext = () => ({
  component: 'redis',
  environment: config.nodeEnv,
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  tls: config.redis.tls,
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getErrorCode = (error: unknown) => {
  if (!isRecord(error)) {
    return undefined;
  }

  const errorCode = error.code;

  if (typeof errorCode === 'string' || typeof errorCode === 'number') {
    return String(errorCode);
  }

  return undefined;
};

const buildRedisOptions = (): RedisOptions => ({
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  ...(config.redis.password ? { password: config.redis.password } : {}),
  ...(config.redis.tls ? { tls: {} } : {}),
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: redisConnectTimeoutMs,
  commandTimeout: redisCommandTimeoutMs,
  retryStrategy: (attempt) => {
    if (attempt > redisMaxRetryAttempts) {
      return null;
    }

    return Math.min(attempt * 100, redisMaxRetryDelayMs);
  },
});

const shouldLogRedisError = () => {
  const now = Date.now();

  if (now - lastRedisErrorLogAt < redisErrorLogIntervalMs) {
    return false;
  }

  lastRedisErrorLogAt = now;
  return true;
};

const attachRedisEventHandlers = (client: Redis) => {
  client.on('ready', () => {
    logger.info('Redis client ready', {
      ...redisRuntimeContext(),
      status: client.status,
    });
  });

  client.on('reconnecting', (delayMs: number) => {
    logger.warn('Redis client reconnecting', {
      ...redisRuntimeContext(),
      delayMs,
      status: client.status,
    });
  });

  client.on('error', (error: Error) => {
    if (!shouldLogRedisError()) {
      return;
    }

    logger.warn('Redis client error', {
      ...redisRuntimeContext(),
      status: client.status,
      errorName: error.name,
      errorCode: getErrorCode(error),
      errorMessage:
        config.nodeEnv === 'production'
          ? 'Redis runtime failure'
          : error.message,
    });
  });

  client.on('end', () => {
    logger.info('Redis client connection closed', redisRuntimeContext());
  });
};

export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(buildRedisOptions());
  attachRedisEventHandlers(redisClient);

  return redisClient;
};

export const connectRedis = async (): Promise<Redis> => {
  const client = getRedisClient();

  if (client.status === 'wait') {
    await client.connect();
  }

  return client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (!redisClient) {
    return;
  }

  const client = redisClient;
  redisClient = null;

  if (client.status === 'end' || client.status === 'wait') {
    client.disconnect();
    return;
  }

  try {
    await client.quit();
  } catch (error) {
    logger.warn('Redis graceful shutdown failed; forcing disconnect', {
      ...redisRuntimeContext(),
      status: client.status,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode: getErrorCode(error),
    });
    client.disconnect();
  }
};

export const getRedisStatus = () => getRedisClient().status;
