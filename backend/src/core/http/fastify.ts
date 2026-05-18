import Fastify from 'fastify';
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';

import { config } from '../../config/app.js';
import { swaggerSpec } from '../../config/swagger.js';
import { logger, sanitizeLogText } from '../../shared/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { prisma } from '../prisma/client.js';
import { connectRedis } from '../redis/index.js';
import {
  getPrometheusMetrics,
  initializeObservability,
  recordHttpRequestMetrics,
} from '../../infra/observability/index.js';

import { authJwtPlugin } from '../../modules/auth/jwt.plugin.js';
import authRoutes from '../../modules/auth/auth.routes.js';
import { enterpriseRateLimitPlugin } from './plugins/rate-limit.plugin.js';
import {
  hasRecordedSecurityEvent,
  recordRequestSecurityEvent,
} from '../../modules/security-events/index.js';

import { crmRoutes } from '../../modules/crm/routes.js';
import { auditRoutes } from '../../modules/audit/routes.js';
import {
  applyRequestSanitization,
  baselineSecurityHeaders,
  buildContentSecurityPolicy,
  buildSwaggerContentSecurityPolicy,
  createCspNonce,
  enforceRequestSizeGovernance,
  requestBodyLimits,
  trustProxy,
} from './security-governance.js';
import { applyRequestCorrelation } from './request-correlation.js';

const developmentCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

type OperationalError = Error & {
  code?: string;
  errors?: unknown;
  isOperational?: boolean;
  statusCode?: number;
};

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

const getRouteForLog = (request: FastifyRequest) => {
  return request.routeOptions?.url ?? request.url;
};

const getRequestIp = (request: FastifyRequest) => {
  return request.normalizedIp ?? request.ip;
};

const getRequestUserAgent = (request: FastifyRequest) => {
  return getHeaderValue(request.headers['user-agent']);
};

const getRequestTenantId = (request: FastifyRequest) => {
  return request.currentTenant?.tenantId ?? request.currentUser?.tenantId;
};

const getRequestUserId = (request: FastifyRequest) => {
  return request.currentUser?.userId;
};

const getRequestLatencyMs = (request: FastifyRequest) => {
  if (!request.startTime) {
    return undefined;
  }

  return Date.now() - request.startTime;
};

const getRequestLogContext = (
  request: FastifyRequest,
  statusCode?: number,
) => ({
  requestId: request.requestId ?? request.id,
  method: request.method,
  url: getRequestUrlForLog(request.url),
  route: getRouteForLog(request),
  ...(statusCode ? { statusCode } : {}),
  tenantId: getRequestTenantId(request),
  userId: getRequestUserId(request),
  ip: getRequestIp(request),
  userAgent: getRequestUserAgent(request),
  environment: config.nodeEnv,
});

const getLogLevelForStatusCode = (statusCode: number) => {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'http';
};

const buildSwaggerHtml = (specUrl: string, nonce: string) => `<!doctype html>
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
    <script nonce="${nonce}">
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>`;

const registerSwaggerDocs = (app: FastifyInstance) => {
  const docsPath = config.swagger.path;
  const specPath = `${docsPath}/json`;
  const sendSwaggerHtml = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const nonce = createCspNonce();

    return reply
      .header(
        'Content-Security-Policy',
        buildSwaggerContentSecurityPolicy(nonce),
      )
      .type('text/html; charset=utf-8')
      .send(buildSwaggerHtml(specPath, nonce));
  };

  app.get(docsPath, sendSwaggerHtml);
  app.get(`${docsPath}/`, sendSwaggerHtml);

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

const getErrorStatusCode = (error: OperationalError) => {
  const statusCode = Number(error.statusCode);

  return Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
    ? statusCode
    : 500;
};

const getErrorResponseErrors = (error: OperationalError) => {
  return Array.isArray(error.errors) &&
    error.errors.every((item) => typeof item === 'string')
    ? error.errors.map((item) => sanitizeLogText(item))
    : undefined;
};

const getErrorMessageForLog = (
  error: Error,
  statusCode: number,
  isKnownOperationalError: boolean,
) => {
  if (config.nodeEnv === 'production' && statusCode >= 500) {
    return isKnownOperationalError
      ? sanitizeLogText(error.message)
      : 'Internal server error';
  }

  return sanitizeLogText(error.message);
};

const getErrorLogMeta = (
  error: FastifyError,
  request: FastifyRequest,
  statusCode: number,
  isKnownOperationalError: boolean,
) => {
  const meta: Record<string, unknown> = {
    ...getRequestLogContext(request, statusCode),
    latencyMs: getRequestLatencyMs(request),
    errorName: error.name,
    errorMessage: getErrorMessageForLog(
      error,
      statusCode,
      isKnownOperationalError,
    ),
    errorCode: getErrorCode(error),
  };

  if (config.nodeEnv !== 'production' && error.stack) {
    meta.stack = sanitizeLogText(error.stack);
  }

  return meta;
};

const recordUnclassifiedForbiddenEvent = (
  error: FastifyError,
  request: FastifyRequest,
  statusCode: number,
) => {
  if (statusCode !== 403 || hasRecordedSecurityEvent(request)) {
    return;
  }

  recordRequestSecurityEvent(request, {
    eventType: 'ACCESS_FORBIDDEN',
    severity: 'MEDIUM',
    outcome: 'BLOCKED',
    metadata: {
      reason: 'unclassified_forbidden',
      errorName: error.name,
      errorMessage: sanitizeLogText(error.message),
    },
  });
};

const getReadinessErrorLogMeta = (
  request: FastifyRequest,
  component: 'database' | 'redis',
  error: unknown,
) => {
  const meta: Record<string, unknown> = {
    ...getRequestLogContext(request, 503),
    component,
    status: 'not_ready',
    errorName: 'UnknownError',
    errorCode: getErrorCode(error),
  };

  if (error instanceof Error) {
    meta.errorName = error.name;
    meta.errorMessage =
      config.nodeEnv === 'production'
        ? 'Readiness check failed'
        : sanitizeLogText(error.message);

    if (config.nodeEnv !== 'production' && error.stack) {
      meta.stack = sanitizeLogText(error.stack);
    }
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

  recordUnclassifiedForbiddenEvent(error, _request, statusCode);

  logger[getLogLevelForStatusCode(statusCode)](
    isKnownOperationalError
      ? 'Operational API error'
      : 'Unexpected API error',
    getErrorLogMeta(error, _request, statusCode, isKnownOperationalError),
  );

  if (operationalError) {
    const response: {
      success: false;
      requestId: string;
      message: string;
      code?: string;
      errors?: string[];
    } = {
      success: false,
      requestId: _request.requestId ?? _request.id,
      message: sanitizeLogText(operationalError.message),
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
    requestId: _request.requestId ?? _request.id,
    message: 'Internal server error',
  });
};

export async function buildFastifyApp(): Promise<FastifyInstance> {
  initializeObservability();

  const app = Fastify({
    bodyLimit: requestBodyLimits.jsonBytes,
    logger: false,
    trustProxy,
  });

  // Request correlation must run before CORS, auth, rate-limit and routes.
  app.addHook('onRequest', async (request, reply) => {
    applyRequestCorrelation(request, reply);
  });

  // CORS
  app.addHook('onRequest', async (request, reply) => {
    applyRequestSanitization(request);

    const sizeLimitResponse = enforceRequestSizeGovernance(request, reply);

    if (sizeLimitResponse) {
      return sizeLimitResponse;
    }

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

  // Security headers
  app.addHook('onSend', async (request, reply, payload) => {
    if (!reply.getHeader('Content-Security-Policy')) {
      reply.header('Content-Security-Policy', buildContentSecurityPolicy());
    }

    reply.header(
      'X-Content-Type-Options',
      baselineSecurityHeaders.contentTypeOptions,
    );
    reply.header('X-Frame-Options', baselineSecurityHeaders.frameOptions);
    reply.header('Referrer-Policy', baselineSecurityHeaders.referrerPolicy);
    reply.header(
      'Permissions-Policy',
      baselineSecurityHeaders.permissionsPolicy,
    );
    reply.header('X-Request-ID', request.requestId ?? request.id);

    return payload;
  });

  // JWT
  await app.register(authJwtPlugin);

  // Distributed rate limit
  await app.register(enterpriseRateLimitPlugin);

  // HTTP request logging
  app.addHook('onRequest', async (request) => {
    request.startTime = request.startTime ?? Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = request.startTime ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const statusCode = reply.statusCode;
    const level = getLogLevelForStatusCode(statusCode);
    const route = getRouteForLog(request);

    logger[level]('HTTP request completed', {
      ...getRequestLogContext(request, statusCode),
      durationMs,
      latencyMs: durationMs,
    });

    recordHttpRequestMetrics({
      method: request.method,
      route,
      statusCode,
      durationMs,
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
  app.get('/ready', async (request, reply) => {
    const timestamp = new Date().toISOString();
    let database: 'connected' | 'disconnected' = 'connected';
    let redis: 'connected' | 'disconnected' = 'connected';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      database = 'disconnected';
      logger.warn(
        'Database readiness failure',
        getReadinessErrorLogMeta(request, 'database', error),
      );
    }

    try {
      const redisClient = await connectRedis();
      await redisClient.ping();
    } catch (error) {
      redis = 'disconnected';
      logger.warn(
        'Redis readiness failure',
        getReadinessErrorLogMeta(request, 'redis', error),
      );
    }

    const isReady = database === 'connected' && redis === 'connected';

    return reply.status(isReady ? 200 : 503).send({
      success: isReady,
      status: isReady ? 'ready' : 'not_ready',
      service: 'FINQZ PRO API',
      database,
      redis,
      timestamp,
    });
  });

  // Metrics
  app.get('/metrics', async (_request, reply) => {
    const metrics = await getPrometheusMetrics();

    return reply
      .type(metrics.contentType)
      .send(metrics.body);
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
