import Fastify, { FastifyInstance } from 'fastify';
import { config } from '../../config/app';
import { logger } from '../../shared/logger';
import { authJwtPlugin } from '../../modules/auth/jwt.plugin';
import authRoutes from '../../modules/auth/auth.routes';

export async function buildFastifyApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(authJwtPlugin);

  app.get('/health', async () => ({
    success: true,
    status: 'ok',
  }));

  await authRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
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
