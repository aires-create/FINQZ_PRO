import { crmRoutes } from '../../modules/crm/routes';
import Fastify from 'fastify';
import { config } from '../../config/app';
import { logger } from '../../shared/logger';
import { authJwtPlugin } from '../../modules/auth/jwt.plugin';
import authRoutes from '../../modules/auth/auth.routes';

export async function buildFastifyApp(): Promise<any> {
  const app = Fastify({ logger: false });

  // COOKIE
 
  // JWT
  await app.register(authJwtPlugin);

  // Health
  app.get('/health', async () => ({
    success: true,
    status: 'ok',
  }));

  // Routes
  await authRoutes(app);

  // Error handler
  app.setErrorHandler((error: any, request: any, reply: any) => {
    if (error.statusCode && error.message) {
      reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        errors: Array.isArray((error as any).errors)
          ? (error as any).errors
          : [],
      });
      return;
    }

    logger.error('Unhandled error in Fastify app', error);

    reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  });

  await app.register(crmRoutes, { prefix: '/api/v1/crm' });
  return app;
}