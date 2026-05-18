import type { FastifyInstance } from 'fastify';
import { buildFastifyApp } from './core/http/fastify.js';
import { config } from './config/app.js';
import { logger } from './shared/logger.js';
import { testDatabaseConnection, disconnectDatabase } from './database/prisma.js';

let app: FastifyInstance | undefined;
let isShuttingDown = false;

const runtimeContext = () => ({
  service: 'FINQZ PRO API',
  runtime: 'fastify',
  environment: config.nodeEnv,
  host: config.host,
  port: config.port,
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

const getRuntimeErrorMeta = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  const meta: Record<string, unknown> = {
    ...runtimeContext(),
    ...extra,
    errorName: 'UnknownError',
    errorCode: getErrorCode(error),
  };

  if (error instanceof Error) {
    meta.errorName = error.name;
    meta.errorMessage =
      config.nodeEnv === 'production'
        ? 'Runtime failure'
        : error.message;

    if (config.nodeEnv !== 'production' && error.stack) {
      meta.stack = error.stack;
    }
  }

  return meta;
};

const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('Graceful shutdown started', {
    ...runtimeContext(),
    signal,
  });

  try {
    if (app) {
      await app.close();
      logger.info('HTTP server closed', {
        ...runtimeContext(),
        signal,
      });
    }

    await disconnectDatabase();
    logger.info('Database connection closed', {
      ...runtimeContext(),
      signal,
    });

    logger.info('Graceful shutdown completed', {
      ...runtimeContext(),
      signal,
    });
    process.exit(0);
  } catch (error) {
    logger.error(
      'Graceful shutdown error',
      getRuntimeErrorMeta(error, { signal }),
    );
    process.exit(1);
  }
};

const registerShutdownHooks = () => {
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  for (const signal of shutdownSignals) {
    process.once(signal, () => {
      void gracefulShutdown(signal);
    });
  }
};

const startServer = async (): Promise<void> => {
  try {
    logger.info('Server starting', runtimeContext());
    logger.info('Database readiness check started', {
      ...runtimeContext(),
      component: 'database',
    });

    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    logger.info('Database readiness check completed', {
      ...runtimeContext(),
      component: 'database',
      status: 'ready',
    });

    app = await buildFastifyApp();
    const address = await app.listen({ port: config.port, host: config.host });

    logger.info('Server listening', {
      ...runtimeContext(),
      address,
      healthUrl: `${address}/health`,
      readinessUrl: `${address}/ready`,
      metricsUrl: `${address}/metrics`,
    });
  } catch (error) {
    logger.error(
      'Server startup failed',
      getRuntimeErrorMeta(error, { phase: 'startup' }),
    );
    process.exit(1);
  }
};

registerShutdownHooks();
void startServer();
