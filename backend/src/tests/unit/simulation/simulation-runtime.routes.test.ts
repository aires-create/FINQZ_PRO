import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticationError, AuthorizationError } from '../../../types/index.js';

const controllerMock = vi.hoisted(() => ({
  simulationRuntimeController: {
    execute: vi.fn(async (_request: any, reply: any) => {
      await reply.send({
        success: true,
        data: {
          executionId: 'exec-1',
          correlationId: 'corr-1',
          tenant: { id: 'tenant-1' },
          product: { id: 'product-1', code: 'PROD', name: 'Produto' },
          subproduct: { id: 'subproduct-1', code: 'SUB', name: 'Subproduto' },
          status: 'CALCULATED',
          decision: { status: 'APPROVED', reasons: [] },
          result: [],
          proposals: [],
          ranking: { candidates: [] },
          warnings: [],
          rejectionReasons: [],
          snapshotReference: { snapshotId: 'snapshot-1', snapshotVersion: '1' },
          auditReference: { auditId: 'audit-1' },
          engineVersion: '3.2.0',
          catalogVersion: '3.1.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          executionTimestamp: '2026-07-09T00:00:00.000Z',
          compatibilityMode: 'CANONICAL',
        },
      });
    }),
  },
}));

vi.mock('../../../core/http/middleware.js', () => ({
  authenticate: async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      throw new AuthenticationError('Authentication required');
    }

    if (request.headers.authorization === 'Bearer invalid-token') {
      throw new AuthenticationError('Invalid or expired access token');
    }

    request.currentUser = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      permissions: ['simulation:execute'],
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

    return async (request: any, reply: any) => {
      const header = request.headers['x-user-permissions'];
      const userPermissions =
        typeof header === 'string' && header.length > 0
          ? header.split(',').map((item) => item.trim())
          : [];

      const allowed = required.every((item) => userPermissions.includes(item));
      if (!allowed) {
        throw new AuthorizationError('Insufficient permissions');
      }
    };
  },
}));

vi.mock('../../../modules/simulation/presentation/http/simulation-runtime.controller.js', () => controllerMock);

import { authenticate } from '../../../core/http/middleware.js';
import { requirePermissions } from '../../../modules/rbac/rbac.guard.js';
import { simulationRuntimeRoutes } from '../../../modules/simulation/presentation/http/simulation-runtime.routes.js';

const buildPayload = () => ({
  product: {
    id: 'product-1',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
  },
  subproduct: {
    id: 'subproduct-1',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
  },
  customer: {
    role: 'customer',
    name: 'Cliente Teste',
  },
  participants: [],
  guarantees: [],
  parameters: {
    requestedAmount: 100000,
    term: 60,
    monthlyRate: 2.09,
  },
  metadata: {
    compatibilityMode: 'CANONICAL',
    createdAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  versioning: {
    version: '3.2.0',
  },
});

describe('simulation runtime routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode =
        error instanceof AuthenticationError || error instanceof AuthorizationError
          ? error.statusCode
          : 500;
      reply.status(statusCode).send({
        success: false,
        requestId: _request.requestId ?? _request.id,
        message: error instanceof Error ? error.message : 'Internal server error',
        ...(error instanceof AuthenticationError
          ? { code: 'UNAUTHORIZED' }
          : error instanceof AuthorizationError
            ? { code: 'FORBIDDEN' }
            : {}),
      });
    });
    await app.register(simulationRuntimeRoutes, {
      prefix: '/api/v1/simulations',
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('authenticate bloqueia sem auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      payload: buildPayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  });

  it('token inválido retorna 401 com envelope global', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: buildPayload(),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Invalid or expired access token',
      code: 'UNAUTHORIZED',
    });
  });

  it('requirePermissions bloqueia sem permissão simulation:execute', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:read',
      },
      payload: buildPayload(),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Insufficient permissions',
      code: 'FORBIDDEN',
    });
  });

  it('POST /runtime chama o renderer oficial', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/simulations/runtime',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'simulation:execute',
      },
      payload: buildPayload(),
    });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.simulationRuntimeController.execute).toHaveBeenCalledTimes(1);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        executionId: 'exec-1',
        correlationId: 'corr-1',
      },
    });
  });
});
