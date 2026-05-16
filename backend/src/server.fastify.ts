import { buildFastifyApp } from './core/http/fastify.js';
import { config } from './config/app.js';
import { logger } from './shared/logger.js';
import { testDatabaseConnection, disconnectDatabase } from './database/prisma.js';

const startServer = async (): Promise<void> => {
  try {
    logger.info('Testing database connection...');
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    const app = await buildFastifyApp();
    const address = await app.listen({ port: config.port, host: config.host });

    logger.info(`🚀 FINQZ PRO Fastify API Server running on ${address}`);
    logger.info(`📊 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Health check: ${address}/health`);
  } catch (error) {
    logger.error('Failed to start Fastify server:', error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  logger.error('Critical error during Fastify startup:', error);
  process.exit(1);
});
