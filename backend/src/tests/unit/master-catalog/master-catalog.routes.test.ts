import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const controllerMock = vi.hoisted(() => ({
  masterCatalogController: {
    getTree: vi.fn(async (_request: any, reply: any) => {
      await reply.send({ success: true, data: {} });
    }),
    listSegments: vi.fn(async (_request: any, reply: any) => {
      await reply.send({ success: true, data: [] });
    }),
    listProducts: vi.fn(async (_request: any, reply: any) => {
      await reply.send({ success: true, data: [] });
    }),
    listSubproductsByProduct: vi.fn(async (_request: any, reply: any) => {
      await reply.send({ success: true, data: [] });
    }),
    listModalitiesBySubproduct: vi.fn(async (_request: any, reply: any) => {
      await reply.send({ success: true, data: [] });
    }),
  },
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
      permissions: ['master-catalog:read'],
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

vi.mock('../../../modules/master-catalog/presentation/http/master-catalog.controller.js', () => controllerMock);

import { masterCatalogRoutes } from '../../../modules/master-catalog/presentation/http/master-catalog.routes.js';

describe('master catalog routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({ message: error.message });
    });
    await app.register(masterCatalogRoutes, { prefix: '/api/v1/master-catalog' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('401 sem auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/tree',
    });

    expect(response.statusCode).toBe(401);
  });

  it('403 sem permissão master-catalog:read', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/tree',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:read',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('GET /tree chama controller', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/tree?status=ACTIVE',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'master-catalog:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.masterCatalogController.getTree).toHaveBeenCalledTimes(1);
  });

  it('GET /segments chama controller', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/segments?status=ACTIVE',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'master-catalog:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.masterCatalogController.listSegments).toHaveBeenCalledTimes(1);
  });

  it('GET /products chama controller', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/products?status=ACTIVE',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'master-catalog:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.masterCatalogController.listProducts).toHaveBeenCalledTimes(1);
  });

  it('GET /products/:productId/subproducts chama controller', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/products/11111111-1111-1111-1111-111111111111/subproducts?status=ACTIVE',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'master-catalog:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.masterCatalogController.listSubproductsByProduct).toHaveBeenCalledTimes(1);
  });

  it('GET /subproducts/:subproductId/modalities chama controller', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/master-catalog/subproducts/22222222-2222-2222-2222-222222222222/modalities?status=ACTIVE',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'master-catalog:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.masterCatalogController.listModalitiesBySubproduct).toHaveBeenCalledTimes(1);
  });

  it('não existe POST/PUT/PATCH/DELETE', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const response = await app.inject({
        method,
        url: '/api/v1/master-catalog/tree',
        headers: {
          authorization: 'Bearer token',
          'x-user-permissions': 'master-catalog:read',
        },
      });

      expect([404, 405]).toContain(response.statusCode);
    }
  });
});
