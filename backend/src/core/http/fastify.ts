import Fastify from 'fastify';
import { config } from '../../config/app';
import { logger } from '../../shared/logger';
import { authJwtPlugin } from '../../modules/auth/jwt.plugin';
import authRoutes from '../../modules/auth/auth.routes';

/**
 * Builds the Fastify application with all plugins and configurations
 */
export async function buildFastifyApp(): Promise<any> {
  const app = Fastify({ logger: false });

  // Register authentication JWT plugin
  await app.register(authJwtPlugin);

  // Health check endpoint
  app.get('/health', async () => ({
    success: true,
    status: 'ok',
  }));

  // Register authentication routes
  await authRoutes(app);

  // Global error handler
  app.setErrorHandler((error: any, request: any, reply: any) => {
    if (error.statusCode && error.message) {
      reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        errors: Array.isArray((error as any).errors) ? (error as any).errors : [],
      });
      return;
    }

    logger.error('Unhandled error in Fastify app', error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  });

  return app;
}
