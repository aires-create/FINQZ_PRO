import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
      return reply.status(401).send({ message: 'Unauthorized' });
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
        return reply.status(403).send({ message: 'Insufficient permissions' });
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
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({ message: error.message });
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
    const request = {
      headers: {},
    } as never;
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as never;

    await authenticate(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(401);
  });

  it('requirePermissions bloqueia sem permissão simulation:execute', async () => {
    const guard = requirePermissions('simulation:execute');
    const request = {
      headers: {
        'x-user-permissions': 'opportunity:read',
      },
    } as never;
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as never;

    await guard(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(403);
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
