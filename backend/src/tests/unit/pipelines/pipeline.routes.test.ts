import Fastify from 'fastify';
import { ZodError } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  listActiveByTenant: vi.fn(),
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
  deactivatePipeline: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deactivateStage: vi.fn(),
  reorderStages: vi.fn(),
}));

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
    const missingActor = request.headers['x-missing-actor'] === '1';

    request.currentUser = {
      userId: missingActor ? undefined : 'user-1',
      tenantId: 'tenant-1',
      permissions,
    };
  },
  tenantContextMiddleware: async (request: any) => {
    const missingActor = request.headers['x-missing-actor'] === '1';

    request.currentTenant = {
      tenantId: 'tenant-1',
      userId: missingActor ? undefined : 'user-1',
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

  it.each([
    ['POST', '/api/v1/pipelines', 'pipeline:create'],
    ['PUT', '/api/v1/pipelines/11111111-1111-1111-1111-111111111111', 'pipeline:update'],
    ['DELETE', '/api/v1/pipelines/11111111-1111-1111-1111-111111111111', 'pipeline:delete'],
    ['POST', '/api/v1/pipelines/11111111-1111-1111-1111-111111111111/stages', 'stage:create'],
    ['PUT', '/api/v1/pipelines/stages/11111111-1111-1111-1111-111111111111', 'stage:update'],
    ['DELETE', '/api/v1/pipelines/stages/11111111-1111-1111-1111-111111111111', 'stage:delete'],
    ['PATCH', '/api/v1/pipelines/11111111-1111-1111-1111-111111111111/stages/reorder', 'stage:update'],
  ])('%s %s requires %s', async (method, url, permission) => {
    const response = await app.inject({
      method,
      url,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:read',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(serviceMock.listActiveByTenant).not.toHaveBeenCalled();
    expect(permission).toBeTruthy();
  });

  it('POST / requires pipeline:create and calls service with tenantId/actorUserId', async () => {
    serviceMock.createPipeline.mockResolvedValueOnce({
      id: 'pipeline-1',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:create',
      },
      payload: {
        name: 'Pipeline A',
        description: 'First pipeline',
        isDefault: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      success: true,
      message: 'Pipeline created successfully',
      data: { id: 'pipeline-1' },
    });
    expect(serviceMock.createPipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      name: 'Pipeline A',
      description: 'First pipeline',
      isDefault: true,
    });
  });

  it('PUT /:pipelineId requires pipeline:update and validates params/body', async () => {
    serviceMock.updatePipeline.mockResolvedValueOnce({
      id: 'pipeline-1',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/pipelines/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:update',
      },
      payload: {
        name: 'Pipeline B',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Pipeline updated successfully',
      data: { id: 'pipeline-1' },
    });
    expect(serviceMock.updatePipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Pipeline B',
    });
  });

  it('DELETE /:pipelineId requires pipeline:delete and returns deleted id envelope', async () => {
    serviceMock.deactivatePipeline.mockResolvedValueOnce(undefined);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/pipelines/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:delete',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Pipeline deleted successfully',
      data: {
        id: '11111111-1111-1111-1111-111111111111',
      },
    });
    expect(serviceMock.deactivatePipeline).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pipelineId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('POST /:pipelineId/stages requires stage:create and validates body', async () => {
    serviceMock.createStage.mockResolvedValueOnce({
      id: 'stage-1',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines/11111111-1111-1111-1111-111111111111/stages',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'stage:create',
      },
      payload: {
        name: 'Stage A',
        order: 1,
        isWon: false,
        isLost: false,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      success: true,
      message: 'Stage created successfully',
      data: { id: 'stage-1' },
    });
    expect(serviceMock.createStage).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pipelineId: '11111111-1111-1111-1111-111111111111',
      name: 'Stage A',
      order: 1,
      isWon: false,
      isLost: false,
    });
  });

  it('PUT /stages/:stageId requires stage:update and validates body', async () => {
    serviceMock.updateStage.mockResolvedValueOnce({
      id: 'stage-1',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/pipelines/stages/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'stage:update',
      },
      payload: {
        name: 'Stage B',
        isWon: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Stage updated successfully',
      data: { id: 'stage-1' },
    });
    expect(serviceMock.updateStage).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      id: '11111111-1111-1111-1111-111111111111',
      pipelineId: '11111111-1111-1111-1111-111111111111',
      name: 'Stage B',
      isWon: true,
    });
  });

  it('DELETE /stages/:stageId requires stage:delete and returns deleted id envelope', async () => {
    serviceMock.deactivateStage.mockResolvedValueOnce(undefined);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/pipelines/stages/11111111-1111-1111-1111-111111111111',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'stage:delete',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Stage deleted successfully',
      data: {
        id: '11111111-1111-1111-1111-111111111111',
      },
    });
    expect(serviceMock.deactivateStage).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      stageId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('PATCH /:pipelineId/stages/reorder requires stage:update and validates array body', async () => {
    serviceMock.reorderStages.mockResolvedValueOnce([{ id: 'stage-1' }]);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/pipelines/11111111-1111-1111-1111-111111111111/stages/reorder',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'stage:update',
      },
      payload: {
        stages: [
          {
            stageId: '22222222-2222-2222-2222-222222222222',
            order: 1,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: 'Stages reordered successfully',
      data: [{ id: 'stage-1' }],
    });
    expect(serviceMock.reorderStages).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pipelineId: '11111111-1111-1111-1111-111111111111',
      stages: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          order: 1,
        },
      ],
    });
  });

  it('validation errors return 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:create',
      },
      payload: {
        name: '',
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
    expect(serviceMock.createPipeline).not.toHaveBeenCalled();
  });

  it('write routes return 403 when actor is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'pipeline:create',
        'x-missing-actor': '1',
      },
      payload: {
        name: 'Pipeline C',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'user',
      },
    });
    expect(serviceMock.createPipeline).not.toHaveBeenCalled();
  });
});
