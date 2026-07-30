import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
  },
  operation: {
    aggregate: vi.fn(),
  },
  securityEventLog: {
    create: vi.fn(),
  },
}));

const operationRepositoryMock = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByOperationNumber: vi.fn(),
  listByTenant: vi.fn(),
  listByOpportunity: vi.fn(),
  listByStatus: vi.fn(),
  updateStatus: vi.fn(),
  appendMetadata: vi.fn(),
  getTimeline: vi.fn(),
  getFinancialSummary: vi.fn(),
}));

const operationNumberGeneratorMock = vi.hoisted(() => ({
  next: vi.fn(),
}));

vi.mock('../../database/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../modules/security-events/index.js', () => ({
  hasRecordedSecurityEvent: vi.fn(() => false),
  recordRequestSecurityEvent: vi.fn(),
}));

vi.mock('../../modules/operation/repositories/operation.prisma.repository.js', () => ({
  operationPrismaRepository: operationRepositoryMock,
}));

vi.mock('../../modules/operation/services/operation-number.generator.js', () => ({
  operationNumberGenerator: operationNumberGeneratorMock,
}));

let app: FastifyInstance | undefined;

const basePayload: Omit<JWTPayload, 'iat' | 'exp'> = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  roleId: 'role-1',
  role: 'ROLE_ADMIN_SISTEMA',
  email: 'admin@finqz.com.br',
  permissions: [],
};

const buildTenantContextUser = () => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  organizationId: null,
  partnerId: null,
  userRoles: [
    {
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
      },
    },
  ],
});

const getApp = async () => {
  app = await createApp();
  await app.ready();

  return app;
};

const getToken = (permissions: string[]) =>
  generateAccessToken({
    ...basePayload,
    permissions,
  });

beforeEach(() => {
  prismaMock.user.findFirst.mockReset();
  prismaMock.operation.aggregate.mockReset();
  prismaMock.securityEventLog.create.mockReset();
  operationRepositoryMock.create.mockReset();
  operationRepositoryMock.findById.mockReset();
  operationRepositoryMock.findByOperationNumber.mockReset();
  operationRepositoryMock.listByTenant.mockReset();
  operationRepositoryMock.listByOpportunity.mockReset();
  operationRepositoryMock.listByStatus.mockReset();
  operationRepositoryMock.updateStatus.mockReset();
  operationRepositoryMock.appendMetadata.mockReset();
  operationRepositoryMock.getTimeline.mockReset();
  operationRepositoryMock.getFinancialSummary.mockReset();
  operationNumberGeneratorMock.next.mockReset();

  prismaMock.user.findFirst.mockResolvedValue(buildTenantContextUser());
  prismaMock.securityEventLog.create.mockResolvedValue(undefined);
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Operation routes registration and protection', () => {
  it('GET /api/v1/operations sem auth retorna 401 e confirma endpoint registrado', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/operations',
    });

    expect(response.statusCode).toBe(401);
    expect(response.statusCode).not.toBe(404);
  });

  it('GET /api/v1/operations com auth mas sem operation:read retorna 403 e passa pelo tenant middleware', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/operations',
      headers: {
        authorization: `Bearer ${getToken(['customer:read'])}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        tenantId: 'tenant-1',
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        tenantId: true,
        organizationId: true,
        partnerId: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
          },
        },
      },
    });
  });

  it('POST /api/v1/operations com auth mas sem operation:create retorna 403', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/operations',
      headers: {
        authorization: `Bearer ${getToken(['operation:read'])}`,
      },
      payload: {
        opportunityId: '22222222-2222-2222-2222-222222222222',
        createdById: 'user-1',
        amount: 1500,
        currency: 'BRL',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST /api/v1/operations cria com sucesso e gera operationNumber/year/sequence no backend', async () => {
    const createdOperation = {
      id: 'op-1',
      tenantId: 'tenant-1',
      operationNumber: 'OP-2026-000001',
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
    };

    operationNumberGeneratorMock.next.mockResolvedValueOnce({
      operationNumber: 'OP-2026-000001',
      year: 2026,
      sequence: 1,
    });
    operationRepositoryMock.create.mockResolvedValueOnce(createdOperation);

    const requestPayload = {
      opportunityId: '22222222-2222-2222-2222-222222222222',
      createdById: '44444444-4444-4444-4444-444444444444',
      amount: 1500,
      currency: 'BRL',
      bankProposalId: null,
      metadata: { source: 'http-test' },
      notes: 'smoke create',
      correlationId: 'corr-1',
    };

    expect(requestPayload).not.toHaveProperty('operationNumber');
    expect(requestPayload).not.toHaveProperty('year');
    expect(requestPayload).not.toHaveProperty('sequence');

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/operations',
      headers: {
        authorization: `Bearer ${getToken(['operation:create'])}`,
      },
      payload: requestPayload,
    });

    const payload = response.json();

    expect(response.statusCode).toBe(201);
    expect(payload).toEqual({
      success: true,
      message: 'Operation created successfully',
      data: createdOperation,
    });
    expect(operationRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        operationNumber: 'OP-2026-000001',
        year: 2026,
        sequence: 1,
        opportunityId: '22222222-2222-2222-2222-222222222222',
        createdById: '44444444-4444-4444-4444-444444444444',
        amount: 1500,
        currency: 'BRL',
        bankProposalId: null,
        metadata: { source: 'http-test' },
        notes: 'smoke create',
        correlationId: 'corr-1',
      }),
    );
    expect(operationNumberGeneratorMock.next).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      requestedAt: expect.any(Date),
    });
  });
});
