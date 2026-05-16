import Fastify from 'fastify';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { config } from '../../config/app.js';
import { swaggerSpec } from '../../config/swagger.js';
import { logger } from '../../shared/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { prisma } from '../prisma/client.js';

import { authJwtPlugin } from '../../modules/auth/jwt.plugin.js';
import authRoutes from '../../modules/auth/auth.routes.js';

import { crmRoutes } from '../../modules/crm/routes.js';
import { auditRoutes } from '../../modules/audit/routes.js';

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

type OperationalError = Error & {
  code?: string;
  errors?: unknown;
  isOperational?: boolean;
  statusCode?: number;
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
  return request.routeOptions?.url ?? request.url;
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

const buildSwaggerHtml = (specUrl: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${config.swagger.title}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>`;

const registerSwaggerDocs = (app: any) => {
  const docsPath = config.swagger.path;
  const specPath = `${docsPath}/json`;

  app.get(docsPath, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .type('text/html; charset=utf-8')
      .send(buildSwaggerHtml(specPath));
  });

  app.get(`${docsPath}/`, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .type('text/html; charset=utf-8')
      .send(buildSwaggerHtml(specPath));
  });

  app.get(specPath, async () => swaggerSpec);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isOperationalError = (error: unknown): error is OperationalError => {
  if (error instanceof AppError) {
    return true;
  }

  return (
    error instanceof Error &&
    isRecord(error) &&
    error.isOperational === true &&
    typeof error.statusCode === 'number'
  );
};

const getErrorStatusCode = (error: OperationalError) => {
  const statusCode = Number(error.statusCode);

  return Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
    ? statusCode
    : 500;
};

const getErrorResponseErrors = (error: OperationalError) => {
  return Array.isArray(error.errors) && error.errors.every((item) => typeof item === 'string')
    ? error.errors
    : undefined;
};

const redactSensitiveText = (value: string) => {
  return value.replace(
    /\b(password|senha|token|authorization|cookie)\b\s*[:=]\s*[^,\s}]+/gi,
    '$1=[REDACTED]',
  );
};

const getErrorLogMeta = (
  error: FastifyError,
  request: FastifyRequest,
  statusCode: number,
) => {
  const url = getRequestUrlForLog(request.url);
  const route = getRouteForLog(request);
  const errorMessage = redactSensitiveText(error.message);
  const meta: Record<string, unknown> = {
    requestId: request.requestId ?? request.id,
    method: request.method,
    url,
    route,
    statusCode,
    errorName: error.name,
    errorMessage,
    environment: config.nodeEnv,
  };

  if (config.nodeEnv !== 'production' && error.stack) {
    meta.stack = redactSensitiveText(error.stack);
  }

  return meta;
};

const sendErrorResponse = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  const isKnownOperationalError = isOperationalError(error);
  const operationalError = isKnownOperationalError ? error : undefined;
  const statusCode = operationalError
    ? getErrorStatusCode(operationalError)
    : 500;

  logger[getLogLevelForStatusCode(statusCode)](
    isKnownOperationalError
      ? 'Operational API error'
      : 'Unexpected API error',
    getErrorLogMeta(error, _request, statusCode),
  );

  if (operationalError) {
    const response: {
      success: false;
      message: string;
      code?: string;
      errors?: string[];
    } = {
      success: false,
      message: operationalError.message,
    };

    if (typeof operationalError.code === 'string') {
      response.code = operationalError.code;
    }

    const errors = getErrorResponseErrors(operationalError);

    if (errors) {
      response.errors = errors;
    }

    reply.status(statusCode).send(response);
    return;
  }

  reply.status(500).send({
    success: false,
    message: 'Internal server error',
  });
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

  // API docs
  registerSwaggerDocs(app);

  // Auth routes
  await authRoutes(app);

  // Protected module routes
  await app.register(crmRoutes, { prefix: '/api/v1/crm' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit' });

  // Error handler
  app.setErrorHandler(sendErrorResponse);

  return app;
}
