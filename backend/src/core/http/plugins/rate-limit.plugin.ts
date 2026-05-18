import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync, FastifyRequest, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'node:crypto';

import { getRedisClient, disconnectRedis } from '../../redis/index.js';
import { recordRateLimitExceeded } from '../../../infra/observability/index.js';
import { logger } from '../../../shared/logger.js';
import type { JWTPayload } from '../../../shared/types/index.js';
import { recordSecurityEvent } from '../../../modules/security-events/index.js';

type RateLimitPolicyName =
  | 'global_api'
  | 'auth_login'
  | 'auth_refresh'
  | 'audit_api';

type RouteOptionsWithMutableConfig = RouteOptions & {
  path?: string;
  prefix?: string;
  url?: string;
  config?: {
    rateLimit?: unknown;
    [key: string]: unknown;
  };
};

const rateLimitPolicies = {
  global_api: {
    max: 100,
    timeWindow: '1 minute',
  },
  auth_login: {
    max: 5,
    timeWindow: '5 minutes',
  },
  auth_refresh: {
    max: 10,
    timeWindow: '5 minutes',
  },
  audit_api: {
    max: 60,
    timeWindow: '1 minute',
  },
} as const;

const redisRateLimitNamespace = 'finqz:rate-limit:';
const rateLimitLogWindowMs = 60_000;
const maxTrackedLogKeys = 5_000;
const exceededLogWindow = new Map<string, number>();

const hashValue = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const normalizeRoute = (route: string) => {
  const path = route.split('?')[0] || '/';

  return path
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
};

const getRequestRoute = (request: FastifyRequest) => {
  const route = request.routeOptions?.url ?? request.url;

  return normalizeRoute(route);
};

const getRouteCandidates = (routeOptions: RouteOptionsWithMutableConfig) => {
  const url = String(routeOptions.url ?? routeOptions.path ?? '');
  const prefix = String(routeOptions.prefix ?? '');
  const prefixedUrl = prefix && url.startsWith('/') ? `${prefix}${url}` : url;

  return [...new Set([url, prefixedUrl].filter(Boolean))];
};

const isHealthRoute = (route: string) => route === '/health' || route === '/ready';

const isLoginRoute = (route: string) => route === '/api/v1/auth/login';

const isRefreshRoute = (route: string) => route === '/api/v1/auth/refresh';

const isAuditRoute = (route: string) => route.startsWith('/api/v1/audit');

const getRoutePolicy = (
  routeOptions: RouteOptionsWithMutableConfig,
): RateLimitPolicyName | false | undefined => {
  const candidates = getRouteCandidates(routeOptions);

  if (candidates.some(isHealthRoute)) {
    return false;
  }

  if (candidates.some(isLoginRoute)) {
    return 'auth_login';
  }

  if (candidates.some(isRefreshRoute)) {
    return 'auth_refresh';
  }

  if (candidates.some(isAuditRoute)) {
    return 'audit_api';
  }

  return undefined;
};

const shouldLogExceeded = (policy: RateLimitPolicyName, key: string) => {
  const logKey = `${policy}:${hashValue(key)}`;
  const now = Date.now();
  const lastLoggedAt = exceededLogWindow.get(logKey);

  if (lastLoggedAt && now - lastLoggedAt < rateLimitLogWindowMs) {
    return false;
  }

  if (exceededLogWindow.size > maxTrackedLogKeys) {
    exceededLogWindow.clear();
  }

  exceededLogWindow.set(logKey, now);
  return true;
};

const recordExceeded = (policy: RateLimitPolicyName) => (
  request: FastifyRequest,
  key: string,
) => {
  const route = getRequestRoute(request);
  const keyHash = hashValue(key);
  const tenantId =
    request.currentTenant?.tenantId ?? request.currentUser?.tenantId;
  const userId = request.currentUser?.userId;
  const ip = request.normalizedIp ?? request.ip;
  const userAgent = getHeaderValue(request.headers['user-agent']);

  recordRateLimitExceeded({
    policy,
    route,
  });

  void recordSecurityEvent({
    ...(tenantId ? { tenantId } : {}),
    ...(userId ? { userId } : {}),
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: policy === 'auth_login' ? 'HIGH' : 'MEDIUM',
    outcome: 'BLOCKED',
    ipAddress: ip,
    ...(userAgent ? { userAgent } : {}),
    requestId: request.requestId ?? request.id,
    route,
    method: request.method,
    metadata: {
      policy,
      keyHash,
    },
  });

  if (!shouldLogExceeded(policy, key)) {
    return;
  }

  logger.warn('Rate limit exceeded', {
    requestId: request.requestId ?? request.id,
    tenantId,
    userId,
    method: request.method,
    route,
    statusCode: 429,
    ip,
    userAgent,
    policy,
    keyHash,
  });
};

const buildRateLimitOptions = (policy: RateLimitPolicyName) => ({
  ...rateLimitPolicies[policy],
  onExceeded: recordExceeded(policy),
});

const applyRoutePolicy = (routeOptions: RouteOptionsWithMutableConfig) => {
  const policy = getRoutePolicy(routeOptions);

  if (policy === undefined) {
    return;
  }

  routeOptions.config = {
    ...routeOptions.config,
    rateLimit: policy === false ? false : buildRateLimitOptions(policy),
  };
};

const isJwtPayload = (payload: unknown): payload is JWTPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<JWTPayload>;

  return Boolean(candidate.userId || candidate.tenantId);
};

const getVerifiedJwtPayload = async (
  request: FastifyRequest,
): Promise<JWTPayload | undefined> => {
  try {
    const payload = await request.jwtVerify<JWTPayload>();

    return isJwtPayload(payload) ? payload : undefined;
  } catch {
    return undefined;
  }
};

const buildRateLimitKey = async (request: FastifyRequest) => {
  const payload = request.currentUser ?? (await getVerifiedJwtPayload(request));
  const tenantId = request.currentTenant?.tenantId ?? payload?.tenantId;
  const userId = payload?.userId;
  const ip = request.ip || 'unknown';

  if (userId) {
    return `user:${hashValue(userId)}`;
  }

  if (tenantId) {
    return `tenant-ip:${hashValue(`${tenantId}:${ip}`)}`;
  }

  return `ip:${hashValue(ip)}`;
};

const buildRateLimitResponse = (
  _request: FastifyRequest,
  context: { after: string; max: number; ttl: number },
) => ({
  success: false,
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests. Please retry later.',
  retryAfter: context.after,
  limit: context.max,
});

const isRateLimitAllowListed = (request: FastifyRequest) => {
  const path = request.url.split('?')[0] || '/';

  return request.method === 'OPTIONS' || isHealthRoute(path);
};

const enterpriseRateLimitPluginHandler: FastifyPluginAsync = async (app) => {
  app.addHook('onRoute', (routeOptions) => {
    applyRoutePolicy(routeOptions as unknown as RouteOptionsWithMutableConfig);
  });

  await app.register(rateLimit, {
    global: true,
    redis: getRedisClient(),
    nameSpace: redisRateLimitNamespace,
    skipOnError: true,
    max: rateLimitPolicies.global_api.max,
    timeWindow: rateLimitPolicies.global_api.timeWindow,
    keyGenerator: buildRateLimitKey,
    allowList: isRateLimitAllowListed,
    onExceeded: recordExceeded('global_api'),
    errorResponseBuilder: buildRateLimitResponse,
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  app.addHook('onClose', async () => {
    await disconnectRedis();
  });
};

export const enterpriseRateLimitPlugin = fp(enterpriseRateLimitPluginHandler, {
  name: 'finqz-enterprise-rate-limit',
  dependencies: ['finqz-auth-jwt'],
});
