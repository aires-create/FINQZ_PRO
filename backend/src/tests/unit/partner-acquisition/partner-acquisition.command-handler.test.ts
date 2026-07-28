import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import type { PartnerAcquisitionCommand } from '../../../modules/partner-acquisition/domain/partner-acquisition.commands.js';
import { PartnerAcquisitionCommandHandler } from '../../../modules/partner-acquisition/handlers/partner-acquisition.command-handler.js';
import type { PartnerAcquisitionServiceContract } from '../../../modules/partner-acquisition/services/partner-acquisition.service.contract.js';

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111'),
}));

const createServiceMock = () =>
  ({
    createLead: vi.fn(),
    findLeadById: vi.fn(),
    findLeadByCode: vi.fn(),
    listLeads: vi.fn(),
    softDeleteLead: vi.fn(),
    createProspect: vi.fn(),
    findProspectById: vi.fn(),
    findProspectByTenantAndLead: vi.fn(),
    findProspectByCode: vi.fn(),
    listProspects: vi.fn(),
    updateProspectLifecycle: vi.fn(),
    linkProspectToPartner: vi.fn(),
    softDeleteProspect: vi.fn(),
    convertProspectToPartner: vi.fn(),
    promoteLeadToProspect: vi.fn(),
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
  }) satisfies PartnerAcquisitionServiceContract;

const handlerPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/handlers/partner-acquisition.command-handler.ts',
);

const handlerSource = readFileSync(handlerPath, 'utf8');

describe('partner-acquisition.command-handler', () => {
  it('maps every supported command to an official event type', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/modules/partner-acquisition/handlers/partner-acquisition.command-handler.contract.ts',
      ),
      'utf8',
    );

    expect(source).toContain('CreatePartnerLeadCommand: \'PartnerLeadCreated\'');
    expect(source).toContain('ConvertPartnerProspectToPartnerCommand: \'PartnerProspectConvertedToPartner\'');
  });

  it('processes a create lead command by recording inbox, calling service, appending event and enqueueing outbox', async () => {
    const service = createServiceMock();
    service.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: null,
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      status: 'RECEIVED',
    });
    service.listEventsByAggregate.mockResolvedValue([]);
    service.createLead.mockResolvedValue({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      leadCode: 'lead-code-1',
      fullName: 'Parceiro Exemplo',
      email: null,
      phone: null,
      companyName: null,
      document: null,
      channel: 'CAMPAIGN',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
      campaignId: null,
      hubContextId: null,
      ownerUserId: 'user-1',
      status: 'NEW',
      score: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    service.appendEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: '11111111-1111-4111-8111-111111111111',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      eventType: 'PartnerLeadCreated',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      occurredAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      version: 1,
    });
    service.enqueueOutboxEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: '11111111-1111-4111-8111-111111111111',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      eventType: 'PartnerLeadCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    });
    service.markCommandProcessed.mockResolvedValue(null);

    const handler = new PartnerAcquisitionCommandHandler(service);
    const command: Extract<PartnerAcquisitionCommand, { commandType: 'CreatePartnerLeadCommand' }> = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'CAMPAIGN',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
      commandType: 'CreatePartnerLeadCommand',
      leadId: 'lead-1',
      leadCode: 'lead-code-1',
      fullName: 'Parceiro Exemplo',
    };

    const result = await handler.handle(command);

    expect(service.recordCommand).toHaveBeenCalledTimes(1);
    expect(service.recordCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: null,
        idempotencyKey: 'idem-1',
      }),
    );
    expect(service.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        leadCode: 'lead-code-1',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      }),
    );
    expect(service.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PartnerLeadCreated',
        eventId: '11111111-1111-4111-8111-111111111111',
        aggregateId: 'lead-1',
      }),
    );
    expect(service.enqueueOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PartnerLeadCreated',
        eventId: '11111111-1111-4111-8111-111111111111',
        aggregateId: 'lead-1',
      }),
    );
    expect(service.markCommandProcessed).toHaveBeenCalledTimes(1);
    expect(result.leadId).toBe('lead-1');
  });

  it('preserves source attribution fields for create prospect commands', async () => {
    const service = createServiceMock();
    service.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerProspectCommand',
      aggregateId: null,
      aggregateType: 'PARTNER_PROSPECT',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-2',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      status: 'RECEIVED',
    });
    service.listEventsByAggregate.mockResolvedValue([]);
    service.createProspect.mockResolvedValue({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      prospectCode: 'prospect-code-1',
      leadId: 'lead-1',
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
    service.appendEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: '11111111-1111-4111-8111-111111111111',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-2',
      occurredAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      version: 1,
    });
    service.enqueueOutboxEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: '11111111-1111-4111-8111-111111111111',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    });
    service.markCommandProcessed.mockResolvedValue(null);

    const handler = new PartnerAcquisitionCommandHandler(service);
    const command: Extract<PartnerAcquisitionCommand, { commandType: 'CreatePartnerProspectCommand' }> = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-2',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'SDR_IA',
      sourceName: 'H16T Smoke',
      sourceReference: 'h16t-smoke',
      commandType: 'CreatePartnerProspectCommand',
      prospectId: 'prospect-1',
      prospectCode: 'prospect-code-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      initialStatus: 'NEW',
    };

    const result = await handler.handle(command);

    expect(service.createProspect).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectCode: 'prospect-code-1',
        sourceName: 'H16T Smoke',
        sourceReference: 'h16t-smoke',
      }),
    );
    expect(result.prospectId).toBe('prospect-1');
  });

  it('short-circuits processed commands without repeating the operation', async () => {
    const service = createServiceMock();
    service.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: null,
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      status: 'PROCESSED',
      result: {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
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
        ownerUserId: null,
        status: 'NEW',
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    });

    const handler = new PartnerAcquisitionCommandHandler(service);
    const command: Extract<PartnerAcquisitionCommand, { commandType: 'CreatePartnerLeadCommand' }> = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'CAMPAIGN',
      commandType: 'CreatePartnerLeadCommand',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
    };

    const result = await handler.handle(command);

    expect(service.createLead).not.toHaveBeenCalled();
    expect(service.appendEvent).not.toHaveBeenCalled();
    expect(service.enqueueOutboxEvent).not.toHaveBeenCalled();
    expect(result.leadId).toBe('lead-1');
  });

  it('returns a controlled error for failed commands', async () => {
    const service = createServiceMock();
    service.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: null,
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      status: 'FAILED',
    });

    const handler = new PartnerAcquisitionCommandHandler(service);
    const command: Extract<PartnerAcquisitionCommand, { commandType: 'CreatePartnerLeadCommand' }> = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'CAMPAIGN',
      commandType: 'CreatePartnerLeadCommand',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
    };

    await expect(handler.handle(command)).rejects.toThrow(/already marked as failed/);
  });

  it('delegates conversion materialization to the acquisition service', async () => {
    const service = createServiceMock();
    service.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'ConvertPartnerProspectToPartnerCommand',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-9',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      status: 'RECEIVED',
    });
    service.listEventsByAggregate.mockResolvedValue([]);
    service.convertProspectToPartner.mockResolvedValue({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
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
      sdrAgentId: null,
      partnerId: 'partner-1',
      status: 'CONVERTED',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    service.markCommandProcessed.mockResolvedValue(null);

    const handler = new PartnerAcquisitionCommandHandler(service);
    const command: Extract<PartnerAcquisitionCommand, { commandType: 'ConvertPartnerProspectToPartnerCommand' }> = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-9',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'SDR_IA',
      commandType: 'ConvertPartnerProspectToPartnerCommand',
      prospectId: 'prospect-1',
      expectedVersion: 1,
      partnerId: 'partner-1',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
      aggregateType: 'PARTNER_PROSPECT',
    };

    const result = await handler.handle(command);

    expect(service.convertProspectToPartner).toHaveBeenCalledTimes(1);
    expect(service.convertProspectToPartner).toHaveBeenCalledWith(
      expect.objectContaining({
        prospectId: 'prospect-1',
        expectedVersion: 1,
      }),
    );
    expect(result.status).toBe('CONVERTED');
  });

  it('keeps handler source free from Opportunity, Prisma, Fastify and HTTP coupling', () => {
    expect(handlerSource).not.toContain('Opportunity');
    expect(handlerSource).not.toContain('PrismaClient');
    expect(handlerSource).not.toContain('Fastify');
    expect(handlerSource).not.toContain('HTTP');
  });
});
