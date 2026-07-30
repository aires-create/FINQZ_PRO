import { describe, expect, it, vi } from 'vitest';

import { PartnerAcquisitionController } from '../../../modules/partner-acquisition/http/partner-acquisition.controller.js';
import type { PartnerAcquisitionServiceContract } from '../../../modules/partner-acquisition/services/partner-acquisition.service.contract.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const leadId = '22222222-2222-2222-2222-222222222222';
const prospectId = '33333333-3333-3333-3333-333333333333';
const userId = '44444444-4444-4444-4444-444444444444';

const createServiceMock = () =>
  ({
    promoteLeadToProspect: vi.fn(),
    transitionLead: vi.fn(),
  }) as unknown as PartnerAcquisitionServiceContract;

describe('partner-acquisition.controller', () => {
  it('promotes a lead to prospect through the service only', async () => {
    const service = createServiceMock();
    const commandHandler = { handle: vi.fn() };
    const controller = new PartnerAcquisitionController(service, commandHandler as never);
    const request = {
      id: 'req-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      headers: {
        'idempotency-key': 'idem-1',
      },
      currentTenant: {
        tenantId,
        userId,
      },
      currentUser: {
        userId,
        tenantId,
      },
      params: {
        leadId,
      },
      body: {
        source: 'CAMPAIGN',
      },
    } as never;
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as never;

    service.promoteLeadToProspect = vi.fn().mockResolvedValue({
      tenantId,
      leadId,
      prospectId,
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
      created: true,
      replayed: false,
    });

    await controller.promoteLeadToProspect(request, reply);

    expect(service.promoteLeadToProspect).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        actorUserId: userId,
        idempotencyKey: 'idem-1',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId,
        source: 'CAMPAIGN',
      }),
    );
    expect(commandHandler.handle).not.toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({
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

  it('transitions a lead through the service only', async () => {
    const service = createServiceMock();
    const commandHandler = { handle: vi.fn() };
    const controller = new PartnerAcquisitionController(service, commandHandler as never);
    const request = {
      id: 'req-2',
      requestId: 'req-2',
      correlationId: 'corr-2',
      headers: {
        'idempotency-key': 'idem-transition-1',
      },
      currentTenant: {
        tenantId,
        userId,
      },
      currentUser: {
        userId,
        tenantId,
      },
      params: {
        leadId,
      },
      body: {
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      },
    } as never;
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as never;

    service.transitionLead = vi.fn().mockResolvedValue({
      tenantId,
      leadId,
      leadCode: 'lead-001',
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

    await controller.transitionLead(request, reply);

    expect(service.transitionLead).toHaveBeenCalledWith(
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
    expect(commandHandler.handle).not.toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      data: {
        tenantId,
        leadId,
        leadCode: 'lead-001',
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
});
