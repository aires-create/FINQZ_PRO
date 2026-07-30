import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handlerMock = vi.hoisted(() => ({
  createOperationHandler: {
    handle: vi.fn(),
  },
  getOperationByIdHandler: {
    handle: vi.fn(),
  },
  getOperationByNumberHandler: {
    handle: vi.fn(),
  },
  listOperationsHandler: {
    handle: vi.fn(),
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
      permissions: ['operation:create', 'operation:read'],
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

vi.mock('../../../modules/operation/orchestration/operation.handlers.js', () => handlerMock);

import { operationRoutes } from '../../../modules/operation/presentation/http/operation.routes.js';

describe('operation routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({ message: error.message });
    });
    await app.register(operationRoutes, { prefix: '/api/v1/operations' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('401 sem auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operations',
    });

    expect(response.statusCode).toBe(401);
  });

  it('403 sem permissão', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operations',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:read',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST /operations chama create handler', async () => {
    handlerMock.createOperationHandler.handle.mockResolvedValueOnce({
      id: 'op-1',
      tenantId: 'tenant-1',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: null,
      createdById: 'user-1',
      amount: 1500,
      currency: 'BRL',
      status: 'CREATED',
      executedAt: null,
      referenceDate: null,
      providerOperationId: null,
      externalReference: null,
      metadata: null,
      notes: null,
      correlationId: null,
      deletedAt: null,
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/operations',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:create,operation:read',
      },
      payload: {
        opportunityId: '22222222-2222-2222-2222-222222222222',
        bankProposalId: '33333333-3333-3333-3333-333333333333',
        createdById: '44444444-4444-4444-4444-444444444444',
        amount: 1500,
        currency: 'BRL',
        referenceDate: '2026-06-10T12:00:00.000Z',
        metadata: { source: 'http-test' },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(handlerMock.createOperationHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        opportunityId: '22222222-2222-2222-2222-222222222222',
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorId: 'user-1',
      }),
    );
  });

  it('POST /operations rejeita operationNumber/year/sequence no body publico', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/operations',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:create,operation:read',
      },
      payload: {
        opportunityId: '22222222-2222-2222-2222-222222222222',
        bankProposalId: '33333333-3333-3333-3333-333333333333',
        createdById: '44444444-4444-4444-4444-444444444444',
        amount: 1500,
        currency: 'BRL',
        operationNumber: 'OP-2026-000001',
        year: 2026,
        sequence: 1,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(handlerMock.createOperationHandler.handle).not.toHaveBeenCalled();
  });

  it('GET /operations chama list handler', async () => {
    handlerMock.listOperationsHandler.handle.mockResolvedValueOnce({
      items: [
        {
          id: 'op-1',
          tenantId: 'tenant-1',
          operationNumber: 'OP-2026-0001',
          year: 2026,
          sequence: 1,
          opportunityId: 'opp-1',
          bankProposalId: null,
          createdById: 'user-1',
          amount: 1500,
          currency: 'BRL',
          status: 'CREATED',
          executedAt: null,
          referenceDate: null,
          providerOperationId: null,
          externalReference: null,
          metadata: null,
          notes: null,
          correlationId: null,
          deletedAt: null,
          createdAt: '2026-06-11T12:00:00.000Z',
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operations?page=1&limit=20',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(handlerMock.listOperationsHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        page: 1,
        limit: 20,
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorId: 'user-1',
      }),
    );
  });

  it('GET /operations/:id chama get by id handler', async () => {
    handlerMock.getOperationByIdHandler.handle.mockResolvedValueOnce({
      id: 'op-1',
      tenantId: 'tenant-1',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: null,
      createdById: 'user-1',
      amount: 1500,
      currency: 'BRL',
      status: 'CREATED',
      executedAt: null,
      referenceDate: null,
      providerOperationId: null,
      externalReference: null,
      metadata: null,
      notes: null,
      correlationId: null,
      deletedAt: null,
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operations/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(handlerMock.getOperationByIdHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        operationId: '11111111-1111-1111-1111-111111111111',
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorId: 'user-1',
      }),
    );
  });

  it('GET /operations/number/:operationNumber chama get by number handler', async () => {
    handlerMock.getOperationByNumberHandler.handle.mockResolvedValueOnce({
      id: 'op-1',
      tenantId: 'tenant-1',
      operationNumber: 'OP-2026-0001',
      year: 2026,
      sequence: 1,
      opportunityId: 'opp-1',
      bankProposalId: null,
      createdById: 'user-1',
      amount: 1500,
      currency: 'BRL',
      status: 'CREATED',
      executedAt: null,
      referenceDate: null,
      providerOperationId: null,
      externalReference: null,
      metadata: null,
      notes: null,
      correlationId: null,
      deletedAt: null,
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:00:00.000Z',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/operations/number/OP-2026-0001',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'operation:read',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(handlerMock.getOperationByNumberHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        operationNumber: 'OP-2026-0001',
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorId: 'user-1',
      }),
    );
  });
});
