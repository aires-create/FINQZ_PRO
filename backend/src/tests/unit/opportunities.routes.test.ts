import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  moveStage: vi.fn(),
  archive: vi.fn(),
}));

vi.mock('../../core/http/middleware.js', () => ({
  authenticate: async (request: any) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    request.currentUser = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: [],
    };
  },
  tenantContextMiddleware: async (request: any) => {
    request.currentTenant = {
      tenantId: 'tenant-1',
      userId: 'user-1',
    };
  },
}));

vi.mock('../../modules/rbac/rbac.guard.js', () => ({
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

vi.mock('../../modules/opportunities/services/opportunities.service.js', () => ({
  opportunitiesService: serviceMock,
  OpportunityNotFoundError: class OpportunityNotFoundError extends Error {},
  InvalidPipelineError: class InvalidPipelineError extends Error {},
  InvalidStageError: class InvalidStageError extends Error {},
  InvalidCustomerError: class InvalidCustomerError extends Error {},
  InvalidLeadError: class InvalidLeadError extends Error {},
  TenantScopeViolationError: class TenantScopeViolationError extends Error {},
}));

import { opportunitiesRoutes } from '../../modules/opportunities/routes.js';

describe('opportunities routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({ message: error.message });
    });
    await app.register(opportunitiesRoutes, { prefix: '/api/v1/opportunities' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('401 sem auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/opportunities',
    });

    expect(response.statusCode).toBe(401);
  });

  it('403 sem permissão', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/opportunities',
      headers: {
        authorization: 'Bearer token',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('GET list com opportunity:read', async () => {
    serviceMock.list.mockResolvedValueOnce({
      data: [{ id: 'opp-1' }],
      total: 1,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/opportunities?page=2&limit=10',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: [{ id: 'opp-1' }],
      total: 1,
      page: 2,
      limit: 10,
    });
    expect(serviceMock.list).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        page: 2,
        limit: 10,
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    );
  });

  it('POST com payload inválido retorna 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/opportunities',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:create',
      },
      payload: {
        title: 'Opp without amount',
        pipelineId: '11111111-1111-1111-1111-111111111111',
        stageId: '22222222-2222-2222-2222-222222222222',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('PATCH stage sem opportunity:move_stage retorna 403', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/opportunities/opp-1/stage',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:update',
      },
      payload: {
        stageId: '22222222-2222-2222-2222-222222222222',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('DELETE sem opportunity:delete retorna 403', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/opportunities/opp-1',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:read',
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
