import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { PartnerAcquisitionPrismaRepository } from '../../../modules/partner-acquisition/repositories/partner-acquisition.prisma.repository.js';

const repositoryPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/repositories/partner-acquisition.prisma.repository.ts',
);

const repositorySource = readFileSync(repositoryPath, 'utf8');

const createMockClient = () => {
  return {
    partnerAcquisitionLead: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    partnerAcquisitionProspect: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    partnerAcquisitionCommandInbox: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    partnerAcquisitionEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    partnerAcquisitionOutbox: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    partnerAcquisitionConversionDecision: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (action: (tx: unknown) => Promise<unknown>) => action(mockClient)),
  } as const;
};

const mockClient = createMockClient();

describe('partner-acquisition.prisma.repository', () => {
  it('keeps the implementation free from Opportunity and HTTP coupling', () => {
    expect(repositorySource).not.toContain('Opportunity');
    expect(repositorySource).not.toMatch(/from\s+['"][^'"]*(fastify|http|controller|service|routes)[^'"]*['"]/i);
  });

  it('creates leads and respects tenant scope on reads and soft delete', async () => {
    const client = createMockClient();
    client.partnerAcquisitionLead.create.mockResolvedValue({
      id: 'lead-1',
      tenantId: 'tenant-1',
      leadCode: 'lead-001',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
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
      version: 0,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionLead.findMany.mockResolvedValue([]);
    client.partnerAcquisitionLead.findFirst.mockResolvedValue({
      id: 'lead-1',
      tenantId: 'tenant-1',
      leadCode: 'lead-001',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
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
      version: 0,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionLead.updateMany.mockResolvedValue({ count: 1 });

    const repository = new PartnerAcquisitionPrismaRepository(client as never);

    const lead = await repository.createLead({
      tenantId: 'tenant-1',
      leadCode: 'lead-001',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
      channel: 'CAMPAIGN',
    });

    expect(client.partnerAcquisitionLead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          leadCode: 'lead-001',
        }),
      }),
    );
    expect(lead.leadId).toBe('lead-1');
    expect(lead.createdAt).toBe('2026-06-25T00:00:00.000Z');

    await repository.listLeads({
      tenantId: 'tenant-1',
      includeDeleted: false,
    });

    expect(client.partnerAcquisitionLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          deletedAt: null,
        }),
      }),
    );

    await repository.softDeleteLead({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      deletedAt: '2026-06-25T10:00:00.000Z',
    });

    expect(client.partnerAcquisitionLead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          id: 'lead-1',
        }),
        data: expect.objectContaining({
          deletedAt: new Date('2026-06-25T10:00:00.000Z'),
        }),
      }),
    );
  });

  it('creates and updates prospects with optimistic locking and partner linking', async () => {
    const client = createMockClient();
    client.partnerAcquisitionProspect.create.mockResolvedValue({
      id: 'prospect-1',
      tenantId: 'tenant-1',
      prospectCode: 'prospect-001',
      leadId: 'lead-1',
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
      status: 'NEW',
      pipelineId: null,
      stageId: null,
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: null,
      partnerId: null,
      version: 0,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionProspect.findFirst.mockResolvedValue({
      id: 'prospect-1',
      tenantId: 'tenant-1',
      prospectCode: 'prospect-001',
      leadId: 'lead-1',
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
      pipelineId: null,
      stageId: null,
      pipelineCode: null,
      stageCode: null,
      score: 90,
      qualificationReason: 'Qualificado',
      assignedUserId: null,
      nextActionAt: null,
      signedAt: new Date('2026-06-25T11:00:00.000Z'),
      convertedAt: null,
      partnerId: 'partner-1',
      version: 1,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T11:00:00.000Z'),
    });
    client.partnerAcquisitionProspect.findMany.mockResolvedValue([]);
    client.partnerAcquisitionProspect.updateMany.mockResolvedValue({ count: 1 });

    const repository = new PartnerAcquisitionPrismaRepository(client as never);

    const prospect = await repository.createProspect({
      tenantId: 'tenant-1',
      prospectCode: 'prospect-001',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'SDR_IA',
    });

    expect(client.partnerAcquisitionProspect.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          leadId: 'lead-1',
        }),
      }),
    );
    expect(prospect.prospectId).toBe('prospect-1');
    expect(prospect.createdAt).toBe('2026-06-25T00:00:00.000Z');

    await repository.updateProspectLifecycle({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      expectedVersion: 0,
      status: 'SIGNED',
      score: 90,
      signedAt: '2026-06-25T11:00:00.000Z',
    });

    expect(client.partnerAcquisitionProspect.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          id: 'prospect-1',
          version: 0,
        }),
        data: expect.objectContaining({
          status: 'SIGNED',
          version: { increment: 1 },
        }),
      }),
    );

    await repository.linkProspectToPartner({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      expectedVersion: 0,
    });

    expect(client.partnerAcquisitionProspect.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          partnerId: 'partner-1',
          version: { increment: 1 },
        }),
      }),
    );

    await repository.softDeleteProspect({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      deletedAt: '2026-06-25T12:00:00.000Z',
      expectedVersion: 0,
    });

    expect(client.partnerAcquisitionProspect.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deletedAt: new Date('2026-06-25T12:00:00.000Z'),
        }),
      }),
    );
  });

  it('manages command inbox, event log, outbox and conversion decision independently', async () => {
    const client = createMockClient();
    client.partnerAcquisitionCommandInbox.upsert.mockResolvedValue({
      id: 'command-1',
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      status: 'RECEIVED',
      receivedAt: new Date('2026-06-25T00:00:00.000Z'),
      processedAt: null,
      payload: {},
      result: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionCommandInbox.findFirst.mockResolvedValue({
      id: 'command-1',
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      status: 'PROCESSED',
      receivedAt: new Date('2026-06-25T00:00:00.000Z'),
      processedAt: new Date('2026-06-25T01:00:00.000Z'),
      payload: {},
      result: { ok: true },
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T01:00:00.000Z'),
    });
    client.partnerAcquisitionCommandInbox.updateMany.mockResolvedValue({ count: 1 });
    client.partnerAcquisitionEvent.create.mockResolvedValue({
      id: 'event-1',
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      occurredAt: new Date('2026-06-25T00:00:00.000Z'),
      payload: {},
      metadata: null,
      version: 1,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionEvent.findMany.mockResolvedValue([
      {
        id: 'event-1',
        tenantId: 'tenant-1',
        eventId: 'event-1',
        aggregateId: 'prospect-1',
        aggregateType: 'PARTNER_PROSPECT',
        eventType: 'PartnerProspectCreated',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        occurredAt: new Date('2026-06-25T00:00:00.000Z'),
        payload: {},
        metadata: null,
        version: 1,
        createdAt: new Date('2026-06-25T00:00:00.000Z'),
      },
      {
        id: 'event-2',
        tenantId: 'tenant-1',
        eventId: 'event-2',
        aggregateId: 'prospect-1',
        aggregateType: 'PARTNER_PROSPECT',
        eventType: 'PartnerProspectQualified',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-2',
        occurredAt: new Date('2026-06-25T01:00:00.000Z'),
        payload: {},
        metadata: null,
        version: 2,
        createdAt: new Date('2026-06-25T01:00:00.000Z'),
      },
    ]);
    client.partnerAcquisitionEvent.findFirst.mockResolvedValue({
      id: 'event-1',
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      occurredAt: new Date('2026-06-25T00:00:00.000Z'),
      payload: {},
      metadata: null,
      version: 1,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionOutbox.create.mockResolvedValue({
      id: 'outbox-1',
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      status: 'PENDING',
      attemptCount: 0,
      availableAt: new Date('2026-06-25T00:00:00.000Z'),
      processedAt: null,
      lastError: null,
      payload: {},
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionOutbox.findMany.mockResolvedValue([
      {
        id: 'outbox-1',
        tenantId: 'tenant-1',
        eventId: 'event-1',
        aggregateId: 'prospect-1',
        aggregateType: 'PARTNER_PROSPECT',
        eventType: 'PartnerProspectCreated',
        status: 'PENDING',
        attemptCount: 0,
        availableAt: new Date('2026-06-25T00:00:00.000Z'),
        processedAt: null,
        lastError: null,
        payload: {},
        createdAt: new Date('2026-06-25T00:00:00.000Z'),
        updatedAt: new Date('2026-06-25T00:00:00.000Z'),
      },
    ]);
    client.partnerAcquisitionOutbox.updateMany.mockResolvedValue({ count: 1 });
    client.partnerAcquisitionConversionDecision.upsert.mockResolvedValue({
      id: 'decision-1',
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: new Date('2026-06-25T00:00:00.000Z'),
      reason: null,
      version: 0,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });
    client.partnerAcquisitionConversionDecision.findFirst.mockResolvedValue({
      id: 'decision-1',
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: new Date('2026-06-25T00:00:00.000Z'),
      reason: null,
      version: 0,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });

    const repository = new PartnerAcquisitionPrismaRepository(client as never);

    const command = await repository.recordCommand({
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
    });

    expect(client.partnerAcquisitionCommandInbox.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId_idempotencyKey: {
            tenantId: 'tenant-1',
            idempotencyKey: 'idem-1',
          },
        }),
      }),
    );
    expect(command.idempotencyKey).toBe('idem-1');

    await repository.markCommandProcessed({
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
      processedAt: '2026-06-25T01:00:00.000Z',
      result: { ok: true },
    });

    expect(client.partnerAcquisitionCommandInbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PROCESSED',
          result: { ok: true },
        }),
      }),
    );

    const event = await repository.appendEvent({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      occurredAt: '2026-06-25T00:00:00.000Z',
      payload: {},
      metadata: null,
      version: 1,
    });

    expect(client.partnerAcquisitionEvent.create).toHaveBeenCalledTimes(1);
    expect(event.eventId).toBe('event-1');

    await repository.listEventsByAggregate({
      tenantId: 'tenant-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
    });

    expect(client.partnerAcquisitionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { occurredAt: 'asc' },
          { version: 'asc' },
        ],
      }),
    );

    const outbox = await repository.enqueueOutboxEvent({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    });

    expect(client.partnerAcquisitionOutbox.create).toHaveBeenCalledTimes(1);
    expect(client.partnerAcquisitionEvent.create).toHaveBeenCalledTimes(1);
    expect(outbox.eventId).toBe('event-1');

    await repository.listPendingOutboxEvents({
      tenantId: 'tenant-1',
      status: 'PENDING',
      availableAtBefore: '2026-06-25T01:00:00.000Z',
    });

    expect(client.partnerAcquisitionOutbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: 'PENDING',
        }),
      }),
    );

    await repository.markOutboxProcessed({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      status: 'PROCESSED',
      processedAt: '2026-06-25T02:00:00.000Z',
    });

    expect(client.partnerAcquisitionOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PROCESSED',
        }),
      }),
    );

    const decision = await repository.recordConversionDecision({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });

    expect(client.partnerAcquisitionConversionDecision.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId_prospectId: {
            tenantId: 'tenant-1',
            prospectId: 'prospect-1',
          },
        }),
      }),
    );
    expect(decision.prospectId).toBe('prospect-1');
  });

  it('keeps the runtime source free from Opportunity coupling', () => {
    expect(repositorySource).not.toContain('Opportunity');
    expect(repositorySource).not.toContain('opportunityId');
  });
});
