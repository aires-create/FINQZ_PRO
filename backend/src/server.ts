// ============================================
// FINQZ PRO - Server Entry Point
// ============================================

import { config } from './config/app';
import { logger } from './shared/logger';
import { testDatabaseConnection, disconnectDatabase } from './database/prisma';
import createApp from './app';

// Server startup function
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Build and start Fastify app
    const app = await createApp();

    await app.listen({ port: config.port, host: config.host }, (err: any, address: string) => {
      if (err) throw err;
      
      logger.info(`🚀 FINQZ PRO API Server running on http://${config.host}:${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://${config.host}:${config.port}/health`);

      if (config.nodeEnv === 'development') {
        logger.info(`📚 API Docs: http://${config.host}:${config.port}/api-docs`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      await app.close();
      logger.info('HTTP server closed');

      // Close database connection
      await disconnectDatabase();
      logger.info('Database connection closed');

      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  logger.error('Critical error during server startup:', error);
  process.exit(1);
});