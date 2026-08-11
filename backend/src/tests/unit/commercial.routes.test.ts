import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const commercialServiceMock = vi.hoisted(() => ({
  listTables: vi.fn(async () => [
    {
      id: 'table-1',
      code: 'PAN-INSS-NOVO',
      name: 'PAN INSS NOVO',
      active: true,
      conditions: [],
    },
  ]),
  getTableDetails: vi.fn(async () => ({
    id: 'table-1',
    code: 'PAN-INSS-NOVO',
    name: 'PAN INSS NOVO',
    active: true,
    conditions: [],
  })),
  createTable: vi.fn(async () => ({
    id: 'table-2',
    code: 'BMG-INSS-NOVO',
    name: 'BMG INSS NOVO',
    active: true,
    conditions: [],
  })),
  updateTable: vi.fn(async () => ({
    id: 'table-1',
    code: 'PAN-INSS-NOVO',
    name: 'PAN INSS NOVO',
    active: true,
    conditions: [],
  })),
  deleteTable: vi.fn(async () => undefined),
  replaceConditions: vi.fn(async () => ({
    id: 'table-1',
    code: 'PAN-INSS-NOVO',
    name: 'PAN INSS NOVO',
    active: true,
    conditions: [],
  })),
}));

vi.mock('../../core/http/middleware.js', () => ({
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

vi.mock('../../modules/auth/repositories/auth.repository.js', () => ({
  authRepository: {
    findUserForTenantContext: vi.fn(async () => null),
  },
}));

vi.mock('../../shared/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
  },
  sanitizeLogText: (value: string) => value,
}));

vi.mock('../../modules/security-events/index.js', () => ({
  recordRequestSecurityEvent: vi.fn(),
}));

vi.mock('../../modules/commercial/services/commercial.service.js', () => ({
  commercialService: commercialServiceMock,
}));

import { commercialRoutes } from '../../modules/commercial/commercial.routes.js';

describe('commercial routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({ message: error.message });
    });
    await app.register(commercialRoutes, { prefix: '/api/v1/commercial' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /tables retorna 401 sem autenticação', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/tables',
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /tables retorna 403 sem sales:view', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/tables',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'opportunity:read',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('GET /tables chama service com sales:view', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/commercial/tables',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'sales:view',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(commercialServiceMock.listTables).toHaveBeenCalledTimes(1);
    expect(response.json()).toMatchObject({
      success: true,
      data: [
        {
          id: 'table-1',
          code: 'PAN-INSS-NOVO',
        },
      ],
    });
  });

  it('POST /tables retorna 403 sem sales:view', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/tables',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'sales:edit',
      },
      payload: {
        providerId: 'provider-1',
        providerCode: 'PAN',
        providerName: 'Banco PAN',
        providerType: 'BANK',
        productId: 'product-1',
        productCode: 'CONSIGNADO',
        productName: 'Consignado',
        subproductId: 'subproduct-1',
        subproductCode: 'INSS',
        subproductName: 'INSS',
        modality: 'NOVO',
        modalityLabel: 'Novo',
        name: 'PAN INSS NOVO',
        code: 'PAN-INSS-NOVO',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST /tables chama service com sales:view', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/tables',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'sales:view',
      },
      payload: {
        providerId: 'provider-2',
        providerCode: 'BMG',
        providerName: 'Banco BMG',
        providerType: 'BANK',
        productId: 'product-1',
        productCode: 'CONSIGNADO',
        productName: 'Consignado',
        subproductId: 'subproduct-1',
        subproductCode: 'INSS',
        subproductName: 'INSS',
        modality: 'NOVO',
        modalityLabel: 'Novo',
        name: 'BMG INSS NOVO',
        code: 'BMG-INSS-NOVO',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(commercialServiceMock.createTable).toHaveBeenCalledTimes(1);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        id: 'table-2',
        code: 'BMG-INSS-NOVO',
      },
    });
  });
});
