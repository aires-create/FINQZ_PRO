import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  createLead: vi.fn(),
  findLeadById: vi.fn(),
  findLeadByCode: vi.fn(),
  listLeads: vi.fn(),
  softDeleteLead: vi.fn(),
  transitionLead: vi.fn(),
  promoteLeadToProspect: vi.fn(),
  createProspect: vi.fn(),
  findProspectById: vi.fn(),
  findProspectByCode: vi.fn(),
  listProspects: vi.fn(),
  updateProspectLifecycle: vi.fn(),
  linkProspectToPartner: vi.fn(),
  softDeleteProspect: vi.fn(),
  recordCommand: vi.fn(),
  findCommandByIdempotencyKey: vi.fn(),
  markCommandProcessed: vi.fn(),
  markCommandFailed: vi.fn(),
  appendEvent: vi.fn(),
  listEventsByAggregate: vi.fn(),
  findEventByEventId: vi.fn(),
  enqueueOutboxEvent: vi.fn(),
  listPendingOutboxEvents: vi.fn(),
  markOutboxProcessed: vi.fn(),
  markOutboxFailed: vi.fn(),
  recordConversionDecision: vi.fn(),
  findConversionDecisionByProspectId: vi.fn(),
}));

const handlerMock = vi.hoisted(() => ({
  handle: vi.fn(),
}));

const tenantId = '11111111-1111-1111-1111-111111111111';
const leadId = '22222222-2222-2222-2222-222222222222';
const prospectId = '33333333-3333-3333-3333-333333333333';
const userId = '44444444-4444-4444-4444-444444444444';
const partnerId = '55555555-5555-5555-5555-555555555555';

vi.mock('../../../core/http/middleware.js', () => ({
  authenticate: async (request: any) => {
    if (!request.headers.authorization) {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    request.currentUser = {
      userId,
      tenantId,
      permissions: ['partner_acquisition:read', 'partner_acquisition:create', 'partner_prospect:convert'],
    };
  },
  tenantContextMiddleware: async (request: any) => {
    request.currentTenant = {
      tenantId,
      userId,
    };
  },
}));

vi.mock('../../../modules/rbac/rbac.guard.js', () => ({
  requirePermissions: (permission: string | string[]) => {
    const required = Array.isArray(permission) ? permission : [permission];

    return async (request: any) => {
      const header = request.headers['x-user-permissions'];
      const permissions =
        typeof header === 'string' && header.length > 0
          ? header.split(',').map((item) => item.trim())
          : request.currentUser?.permissions ?? [];

      const allowed = required.every((item) => permissions.includes(item));
      if (!allowed) {
        const error: any = new Error('Insufficient permissions');
        error.statusCode = 403;
        throw error;
      }
    };
  },
}));

vi.mock('../../../modules/partner-acquisition/services/partner-acquisition.service.js', () => ({
  partnerAcquisitionService: serviceMock,
}));

vi.mock('../../../modules/partner-acquisition/handlers/partner-acquisition.command-handler.js', () => ({
  partnerAcquisitionCommandHandler: handlerMock,
}));

import { partnerAcquisitionRoutes } from '../../../modules/partner-acquisition/http/partner-acquisition.routes.js';

describe('partner-acquisition routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
      const statusCode = (error as any).statusCode ?? 500;
      reply.status(statusCode).send({
        success: false,
        error: {
          code: (error as any).code ?? 'INTERNAL_ERROR',
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      });
    });

    await app.register(partnerAcquisitionRoutes, { prefix: '/api/v1/partner-acquisition' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthorized requests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partner-acquisition/leads',
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects requests without the required permissions with 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/leads',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read',
        'idempotency-key': 'idem-403',
      },
      payload: {
        leadCode: 'lead-403',
        fullName: 'Parceiro Sem Permissão',
        source: 'CAMPAIGN',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('rejects promote requests without the dedicated permission with 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/promote-to-prospect`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create',
        'idempotency-key': 'idem-promote-403',
      },
      payload: {
        source: 'CAMPAIGN',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('rejects transition requests without the dedicated permission with 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/transition`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create',
        'idempotency-key': 'idem-transition-403',
      },
      payload: {
        nextStatus: 'QUALIFIED',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('lists leads with tenant scoped filters and pagination', async () => {
    serviceMock.listLeads.mockResolvedValueOnce([
      {
        tenantId,
        leadId,
        fullName: 'Parceiro Exemplo',
        email: 'parceiro@example.com',
        phone: null,
        companyName: null,
        document: null,
        channel: 'CAMPAIGN',
        sourceName: null,
        sourceReference: null,
        campaignId: null,
        hubContextId: null,
        ownerUserId: userId,
        status: 'NEW',
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/partner-acquisition/leads?page=1&limit=20&search=Parceiro',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_prospect:convert',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: [
        {
          tenantId,
          leadId,
          leadCode: leadId,
          fullName: 'Parceiro Exemplo',
          email: 'parceiro@example.com',
          phone: null,
          companyName: null,
          document: null,
          source: 'CAMPAIGN',
          sourceName: null,
          sourceReference: null,
          campaignId: null,
          hubContextId: null,
          ownerUserId: userId,
          status: 'NEW',
          score: null,
          createdAt: '2026-06-25T00:00:00.000Z',
          updatedAt: '2026-06-25T00:00:00.000Z',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(serviceMock.listLeads).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
      }),
    );
  });

  it('creates a lead through the command handler with idempotency and tenant context', async () => {
    handlerMock.handle.mockResolvedValueOnce({
      tenantId,
      leadId,
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      channel: 'CAMPAIGN',
      sourceName: null,
      sourceReference: null,
      campaignId: null,
      hubContextId: null,
      ownerUserId: userId,
      status: 'NEW',
      score: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/leads',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_prospect:create,partner_prospect:convert',
        'idempotency-key': 'idem-1',
      },
      payload: {
        leadCode: 'lead-1',
        fullName: 'Parceiro Exemplo',
        source: 'CAMPAIGN',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(handlerMock.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-1',
        commandType: 'CreatePartnerLeadCommand',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      }),
    );
  });

  it('creates a prospect preserving source attribution fields', async () => {
    handlerMock.handle.mockResolvedValueOnce({
      tenantId,
      prospectId,
      leadId,
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      channel: 'SDR_IA',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'NEW',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/partner-acquisition/prospects',
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_prospect:create,partner_prospect:convert',
        'idempotency-key': 'idem-1',
      },
      payload: {
        prospectCode: 'prospect-1',
        leadId,
        fullName: 'Parceiro Exemplo',
        source: 'SDR_IA',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(handlerMock.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-1',
        commandType: 'CreatePartnerProspectCommand',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      }),
    );
  });

  it('promotes a lead to prospect through the service with tenant and idempotency context', async () => {
    serviceMock.promoteLeadToProspect.mockResolvedValueOnce({
      tenantId,
      leadId,
      prospectId,
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
      created: true,
      replayed: false,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/promote-to-prospect`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:promote',
        'idempotency-key': 'idem-promote-1',
      },
      payload: {
        source: 'CAMPAIGN',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(serviceMock.promoteLeadToProspect).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-promote-1',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId,
        source: 'CAMPAIGN',
      }),
    );
    expect(handlerMock.handle).not.toHaveBeenCalled();
    expect(response.json()).toEqual({
      success: true,
      data: {
        tenantId,
        leadId,
        prospectId,
        leadStatus: 'QUALIFIED',
        prospectStatus: 'NEW',
        created: true,
        replayed: false,
      },
    });
  });

  it('transitions a lead through the service with tenant and idempotency context', async () => {
    serviceMock.transitionLead.mockResolvedValueOnce({
      tenantId,
      leadId,
      leadCode: leadId,
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      source: 'CAMPAIGN',
      sourceName: null,
      sourceReference: null,
      campaignId: null,
      hubContextId: null,
      ownerUserId: null,
      status: 'QUALIFIED',
      score: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/transition`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:transition',
        'idempotency-key': 'idem-transition-1',
      },
      payload: {
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(serviceMock.transitionLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-transition-1',
        commandType: 'TransitionPartnerLeadCommand',
        leadId,
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      }),
    );
    expect(handlerMock.handle).not.toHaveBeenCalled();
    expect(response.json()).toEqual({
      success: true,
      data: {
        tenantId,
        leadId,
        leadCode: leadId,
        fullName: 'Parceiro Exemplo',
        email: null,
        phone: null,
        companyName: null,
        document: null,
        source: 'CAMPAIGN',
        sourceName: null,
        sourceReference: null,
        campaignId: null,
        hubContextId: null,
        ownerUserId: null,
        status: 'QUALIFIED',
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    });
  });

  it('rejects transition requests without idempotency-key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/transition`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:transition',
      },
      payload: {
        nextStatus: 'QUALIFIED',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects transition requests with invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/transition`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:transition',
        'idempotency-key': 'idem-transition-invalid',
      },
      payload: {
        nextStatus: 'QUALIFIED',
        unexpectedField: true,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects promote requests without idempotency-key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/promote-to-prospect`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:promote',
      },
      payload: {
        source: 'CAMPAIGN',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects promote requests with invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/leads/${leadId}/promote-to-prospect`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_acquisition:promote',
        'idempotency-key': 'idem-promote-invalid',
      },
      payload: {
        source: 'CAMPAIGN',
        unexpectedField: true,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('converts a prospect and returns the conversion decision envelope', async () => {
    serviceMock.findProspectById.mockResolvedValueOnce({
      tenantId,
      prospectId,
      leadId,
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      channel: 'SDR_IA',
      sourceName: null,
      sourceReference: null,
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'SIGNED',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    handlerMock.handle.mockResolvedValueOnce({
      tenantId,
      prospectId,
      leadId,
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      channel: 'SDR_IA',
      sourceName: null,
      sourceReference: null,
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'CONVERTED',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    serviceMock.findConversionDecisionByProspectId.mockResolvedValueOnce({
      tenantId,
      prospectId,
      partnerId,
      approved: true,
      decidedByUserId: userId,
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/partner-acquisition/prospects/${prospectId}/convert`,
      headers: {
        authorization: 'Bearer token',
        'x-user-permissions': 'partner_acquisition:read,partner_acquisition:create,partner_prospect:create,partner_prospect:convert',
        'idempotency-key': 'idem-2',
      },
      payload: {
        expectedVersion: 1,
        partnerId,
        partnerCode: 'P-001',
        partnerName: 'Parceiro Exemplo LTDA',
        partnerType: 'COMPANY',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(serviceMock.findProspectById).toHaveBeenCalledWith({
      tenantId,
      prospectId,
    });
    expect(handlerMock.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-2',
        commandType: 'ConvertPartnerProspectToPartnerCommand',
      }),
    );
    expect(response.json()).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          prospect: expect.objectContaining({
            prospectId,
            status: 'CONVERTED',
          }),
          conversionDecision: expect.objectContaining({
            partnerId,
            approved: true,
          }),
        }),
      }),
    );
  });
});
