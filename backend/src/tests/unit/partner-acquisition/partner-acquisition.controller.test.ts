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
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
        metadata: {
          source: 'CAMPAIGN',
        },
        references: [
          {
            kind: 'SOURCE',
            refType: 'CAMPAIGN',
            refId: 'camp-1',
          },
        ],
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
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
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
});
