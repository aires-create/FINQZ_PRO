import Fastify from 'fastify';
import { ZodError } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  listActiveByTenant: vi.fn(),
}));

vi.mock('../../../core/http/middleware.js', () => ({
  authenticate: async (request: any) => {
    if (!request.headers.authorization) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    request.currentUser = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['pipeline:read'],
    };
  },
  tenantContextMiddleware: async (request: any) => {
    request.currentTenant = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
  },
}));

vi.mock('../../../modules/rbac/rbac.guard.js', () => ({
  requirePermissions: (permission: string | string[]) => {
    const required = Array.isArray(permission) ? permission : [permission];

    return async (request: any) => {
      const header = request.headers['x-user-permissions'];
      const userPermissions =
        typeof header === 'string' && header.length > 0
          ? header.split(',').map((item) => item.trim())
          : [];

      const allowed = required.every((item) => userPermissions.includes(item));
      if (!allowed) {
        const error: any = new Error('Insufficient permissions');
        error.statusCode = 403;
        throw error;
      }
    };
  },
}));

const opportunitiesServiceMock = vi.hoisted(() => ({
  TenantScopeViolationError: class TenantScopeViolationError extends Error {},
}));

vi.mock('../../../modules/opportunities/services/opportunities.service.js', () => opportunitiesServiceMock);

vi.mock('../../../modules/pipelines/service.js', () => ({
  pipelinesService: serviceMock,
}));

import { pipelinesRoutes } from '../../../modules/pipelines/routes.js';

describe('pipelines routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    await app.register(pipelinesRoutes, { prefix: '/api/v1/pipelines' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / returns success/data', async () => {
    serviceMock.listActiveByTenant.mockResolvedValueOnce([{ id: 'pipeline-1' }]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: [{ id: 'pipeline-1' }],
    });
    expect(serviceMock.listActiveByTenant).toHaveBeenCalledWith('tenant-1');
  });

  it('TenantScopeViolationError returns 403', async () => {
    serviceMock.listActiveByTenant.mockRejectedValueOnce(
      new opportunitiesServiceMock.TenantScopeViolationError('tenant missing'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:read',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'tenant missing',
      },
    });
  });

  it('ZodError returns 400 if handled by route error handler', async () => {
    serviceMock.listActiveByTenant.mockRejectedValueOnce(
      new ZodError([
        {
          code: 'custom',
          message: 'Validation failed',
          path: ['name'],
        },
      ]),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:read',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: expect.any(Object),
      },
    });
  });

  it('unexpected error returns 500', async () => {
    serviceMock.listActiveByTenant.mockRejectedValueOnce(new Error('boom'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:read',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });

  it('no write routes were registered in this phase', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const response = await app.inject({
        method,
        url: '/api/v1/pipelines',
        headers: {
          authorization: 'Bearer token',
          'x-user-permissions': 'pipeline:read',
        },
      });

      expect([404, 405]).toContain(response.statusCode);
    }
  });
});
