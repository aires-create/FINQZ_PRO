import Fastify from 'fastify';

import { config } from '../../config/app';
import { logger } from '../../shared/logger';

import { authJwtPlugin } from '../../modules/auth/jwt.plugin';
import authRoutes from '../../modules/auth/auth.routes';

import { crmRoutes } from '../../modules/crm/routes';
import { auditRoutes } from '../../modules/audit/routes';

export async function buildFastifyApp(): Promise<any> {
  const app = Fastify({ logger: false });

  // JWT
  await app.register(authJwtPlugin);

  // Health
  app.get('/health', async () => ({
    success: true,
    status: 'ok',
    service: 'FINQZ PRO API',
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Auth routes
  await authRoutes(app);

  // Protected module routes
  await app.register(crmRoutes, { prefix: '/api/v1/crm' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit' });

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

  return app;
}
