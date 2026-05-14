// ============================================
// FINQZ PRO - Server Entry Point
// ============================================

import { config } from './config/app';
import { logger } from './shared/logger';
import { testDatabaseConnection, disconnectDatabase } from './database/prisma';
import createApp from './app';

const startServer = async (): Promise<void> => {
  try {
    logger.info('Testing database connection...');

    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    const app = await createApp();

    await app.listen(
      {
        port: config.port,
        host: config.host,
      },
      (err: Error | null, _address: string) => {
        if (err) throw err;

        logger.info(
          `FINQZ PRO API Server running on http://${config.host}:${config.port}`,
        );
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`Health check: http://${config.host}:${config.port}/health`);

        if (config.nodeEnv === 'development') {
          logger.info(`API Docs: http://${config.host}:${config.port}/api-docs`);
        }
      },
    );

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      await app.close();
      logger.info('HTTP server closed');

      await disconnectDatabase();
      logger.info('Database connection closed');

      process.exit(0);
    };

    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT');
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error,
      });

      void gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        promise,
        reason,
      });

      void gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error,
    });

    process.exit(1);
  }
};

startServer().catch((error) => {
  logger.error('Critical error during server startup', {
    error,
  });

  process.exit(1);
});