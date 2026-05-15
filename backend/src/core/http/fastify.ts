import Fastify from 'fastify';

import { config } from '../../config/app';
import { logger } from '../../shared/logger';
import { prisma } from '../prisma/client';

import { authJwtPlugin } from '../../modules/auth/jwt.plugin';
import authRoutes from '../../modules/auth/auth.routes';

import { crmRoutes } from '../../modules/crm/routes';
import { auditRoutes } from '../../modules/audit/routes';

const developmentCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const apiRateLimitWindowMs = 15 * 60 * 1000;
const apiRateLimitMaxRequests = 300;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const apiRateLimitStore = new Map<string, RateLimitEntry>();

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const getAllowedCorsOrigins = () => {
  const configuredOrigins = Array.isArray(config.cors.origin)
    ? config.cors.origin
    : [config.cors.origin];

  const envOrigins = configuredOrigins
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');

  const origins =
    config.nodeEnv === 'development'
      ? [...developmentCorsOrigins, ...envOrigins]
      : envOrigins;

  return [...new Set(origins)];
};

const getRequestUrlForLog = (url: string) => url.split('?')[0] || url;

const getRouteForLog = (request: any) => {
  return request.routeOptions?.url ?? request.routerPath ?? undefined;
};

const getLogLevelForStatusCode = (statusCode: number) => {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'http';
};

export async function buildFastifyApp(): Promise<any> {
  const app = Fastify({ logger: false });

  // CORS
  app.addHook('onRequest', async (request, reply) => {
    const origin = getHeaderValue(request.headers.origin);
    const allowedOrigins = getAllowedCorsOrigins();
    const requestHeaders = getHeaderValue(
      request.headers['access-control-request-headers'],
    );

    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
    reply.header(
      'Access-Control-Allow-Headers',
      requestHeaders ?? 'Authorization, Content-Type, X-Request-ID',
    );

    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);

      if (config.cors.credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
    }

    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

  // API rate limit
  app.addHook('onRequest', async (request, reply) => {
    if (
      request.method === 'OPTIONS' ||
      !request.url.startsWith('/api/v1/')
    ) {
      return;
    }

    const now = Date.now();
    const clientId = request.ip || 'unknown';
    let entry = apiRateLimitStore.get(clientId);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + apiRateLimitWindowMs,
      };
      apiRateLimitStore.set(clientId, entry);
    }

    entry.count += 1;

    reply.header('X-RateLimit-Limit', apiRateLimitMaxRequests.toString());
    reply.header(
      'X-RateLimit-Remaining',
      Math.max(0, apiRateLimitMaxRequests - entry.count).toString(),
    );
    reply.header(
      'X-RateLimit-Reset',
      new Date(entry.resetAt).toISOString(),
    );

    if (entry.count > apiRateLimitMaxRequests) {
      return reply.status(429).send({
        success: false,
        message: 'Too many requests',
      });
    }
  });

  // Security headers
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    reply.header('X-Request-ID', request.id);

    return payload;
  });

  // JWT
  await app.register(authJwtPlugin);

  // HTTP request logging
  app.addHook('onRequest', async (request) => {
    request.startTime = request.startTime ?? Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = request.startTime ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const statusCode = reply.statusCode;
    const level = getLogLevelForStatusCode(statusCode);
    const url = getRequestUrlForLog(request.url);
    const route = getRouteForLog(request);

    logger[level]('HTTP request completed', {
      requestId: request.requestId ?? request.id,
      method: request.method,
      url,
      route,
      statusCode,
      durationMs,
      environment: config.nodeEnv,
    });
  });

  // Health
  app.get('/health', async () => ({
    success: true,
    status: 'ok',
    service: 'FINQZ PRO API',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Readiness
  app.get('/ready', async (_request, reply) => {
    const timestamp = new Date().toISOString();

    try {
      await prisma.$queryRaw`SELECT 1`;

      return reply.send({
        success: true,
        status: 'ready',
        service: 'FINQZ PRO API',
        database: 'connected',
        timestamp,
      });
    } catch {
      return reply.status(503).send({
        success: false,
        status: 'not_ready',
        service: 'FINQZ PRO API',
        database: 'disconnected',
        timestamp,
      });
    }
  });

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
