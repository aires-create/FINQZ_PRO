import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  listPartners: vi.fn(),
  getPartnerById: vi.fn(),
  getPartnerByCode: vi.fn(),
  createPartner: vi.fn(),
  updatePartner: vi.fn(),
  softDeletePartner: vi.fn(),
}));

const basePartner = {
  id: '11111111-1111-1111-1111-111111111111',
  tenantId: 'tenant-1',
  code: 'P-001',
  name: 'Partner One',
  type: 'COMPANY',
  status: 'ativo',
  document: null,
  email: null,
  phone: null,
  parentId: null,
  deletedAt: null,
  createdAt: new Date('2026-06-11T12:00:00.000Z'),
  updatedAt: new Date('2026-06-11T12:00:00.000Z'),
};

const basePartnerJson = {
  ...basePartner,
  createdAt: '2026-06-11T12:00:00.000Z',
  updatedAt: '2026-06-11T12:00:00.000Z',
};

vi.mock('../../../core/http/middleware.js', () => ({
  authenticate: async (request: any) => {
    if (!request.headers.authorization) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const permissionsHeader = request.headers['x-user-permissions'];
    const permissions =
      typeof permissionsHeader === 'string' && permissionsHeader.length > 0
        ? permissionsHeader.split(',').map((item) => item.trim())
        : [];

    request.currentUser = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions,
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

vi.mock('../../../modules/partners/services/partner.service.js', () => ({
  partnerService: serviceMock,
  PartnerTenantRequiredError: class PartnerTenantRequiredError extends Error {
    statusCode = 400;
    code = 'BAD_REQUEST';
    constructor() {
      super('Missing tenant context');
    }
  },
}));

import { PartnerNotFoundError } from '../../../modules/partners/services/partner.errors.js';
import { partnerRoutes } from '../../../modules/partners/presentation/http/partner.routes.js';

describe('partner routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      if (statusCode >= 400 && statusCode < 500) {
        reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as any).code ?? (statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'),
            message: error.message,
          },
        });
        return;
      }

      reply.status(statusCode).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    });
    await app.register(partnerRoutes, { prefix: '/api/v1/partners' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('401 sem auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partners',
    });

    expect(response.statusCode).toBe(401);
  });

  it('403 sem permissão partner:read', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partners',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'organization:read',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('GET /partners usa partner:read e injeta tenantId', async () => {
    serviceMock.listPartners.mockResolvedValueOnce({
      data: [basePartner],
      total: 1,
      page: 1,
      limit: 20,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partners?page=1&limit=20&search=Acme',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: [basePartnerJson],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
    expect(serviceMock.listPartners).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        page: 1,
        limit: 20,
        search: 'Acme',
      }),
    );
  });

  it('GET /partners/:id usa partner:read', async () => {
    serviceMock.getPartnerById.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: 'tenant-1',
      code: 'P-001',
      name: 'Partner One',
      type: 'COMPANY',
      status: 'ativo',
      document: null,
      email: null,
      phone: null,
      parentId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-11T12:00:00.000Z'),
      updatedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partners/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(serviceMock.getPartnerById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      partnerId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('POST /partners usa partner:create e injeta tenantId/actorUserId', async () => {
    serviceMock.createPartner.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: 'tenant-1',
      code: 'P-002',
      name: 'Partner Two',
      type: 'COMPANY',
      status: 'ativo',
      document: null,
      email: null,
      phone: null,
      parentId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-11T12:00:00.000Z'),
      updatedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/partners',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:create',
      },
      payload: {
        code: 'P-002',
        name: 'Partner Two',
        type: 'COMPANY',
        status: 'ativo',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(serviceMock.createPartner).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        correlationId: expect.any(String),
        code: 'P-002',
        name: 'Partner Two',
        type: 'COMPANY',
        status: 'ativo',
      }),
    );
  });

  it('PUT /partners/:id usa partner:update e injeta tenantId/actorUserId', async () => {
    serviceMock.updatePartner.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: 'tenant-1',
      code: 'P-003',
      name: 'Partner Three',
      type: 'COMPANY',
      status: 'ativo',
      document: null,
      email: null,
      phone: null,
      parentId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-11T12:00:00.000Z'),
      updatedAt: new Date('2026-06-11T12:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/partners/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:update',
      },
      payload: {
        name: 'Partner Three',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(serviceMock.updatePartner).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        partnerId: '11111111-1111-1111-1111-111111111111',
        name: 'Partner Three',
      }),
    );
  });

  it('DELETE /partners/:id usa partner:delete e injeta tenantId/actorUserId', async () => {
    serviceMock.softDeletePartner.mockResolvedValueOnce(undefined);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/partners/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:delete',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Partner deleted successfully',
    });
    expect(serviceMock.softDeletePartner).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        partnerId: '11111111-1111-1111-1111-111111111111',
      }),
    );
  });

  it('PartnerNotFoundError returns 404', async () => {
    serviceMock.getPartnerById.mockRejectedValueOnce(
      new PartnerNotFoundError('11111111-1111-1111-1111-111111111111'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partners/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner:read',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Partner not found: 11111111-1111-1111-1111-111111111111',
      },
    });
  });
});
