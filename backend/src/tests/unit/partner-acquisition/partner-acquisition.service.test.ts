import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { PartnerAcquisitionService } from '../../../modules/partner-acquisition/services/partner-acquisition.service.js';
import type { PartnerAcquisitionRepositoryContract } from '../../../modules/partner-acquisition/repositories/partner-acquisition.repository.contract.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';

const createRepositoryMock = () =>
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
    promoteLeadToProspectInTransaction: vi.fn(),
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
  }) satisfies PartnerAcquisitionRepositoryContract;

const servicePath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/services/partner-acquisition.service.ts',
);

const serviceSource = readFileSync(servicePath, 'utf8');

describe('partner-acquisition.service', () => {
  it('delegates lead operations to the repository using tenant-scoped inputs', async () => {
    const repository = createRepositoryMock();
    repository.createLead.mockResolvedValue({
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
    });
    repository.findLeadById.mockResolvedValue(null);
    repository.findLeadByCode.mockResolvedValue(null);
    repository.listLeads.mockResolvedValue([]);
    repository.softDeleteLead.mockResolvedValue(null);

    const service = new PartnerAcquisitionService(repository);

    const input = {
      tenantId: 'tenant-1',
      leadCode: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'CAMPAIGN',
    } as const;

    await service.createLead(input);
    await service.findLeadById({ tenantId: 'tenant-1', leadId: 'lead-1' });
    await service.findLeadByCode({ tenantId: 'tenant-1', leadCode: 'lead-1' });
    await service.listLeads({ tenantId: 'tenant-1' });
    await service.softDeleteLead({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      deletedAt: '2026-06-25T10:00:00.000Z',
    });

    expect(repository.createLead).toHaveBeenCalledWith(input);
    expect(repository.findLeadById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
    });
    expect(repository.findLeadByCode).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadCode: 'lead-1',
    });
    expect(repository.listLeads).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    expect(repository.softDeleteLead).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      deletedAt: '2026-06-25T10:00:00.000Z',
    });
  });

  it('delegates prospect lifecycle, linking and soft delete with expected version', async () => {
    const repository = createRepositoryMock();
    repository.createProspect.mockResolvedValue({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
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
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    repository.findProspectById.mockResolvedValue(null);
    repository.findProspectByCode.mockResolvedValue(null);
    repository.listProspects.mockResolvedValue([]);
    repository.updateProspectLifecycle.mockResolvedValue(null);
    repository.linkProspectToPartner.mockResolvedValue(null);
    repository.softDeleteProspect.mockResolvedValue(null);

    const service = new PartnerAcquisitionService(repository);

    const createInput = {
      tenantId: 'tenant-1',
      prospectCode: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'SDR_IA',
    } as const;

    await service.createProspect(createInput);
    await service.findProspectById({ tenantId: 'tenant-1', prospectId: 'prospect-1' });
    await service.findProspectByCode({ tenantId: 'tenant-1', prospectCode: 'prospect-1' });
    await service.listProspects({ tenantId: 'tenant-1' });
    await service.updateProspectLifecycle({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      expectedVersion: 2,
      status: 'QUALIFIED',
    });
    await service.linkProspectToPartner({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      expectedVersion: 3,
    });
    await service.softDeleteProspect({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      deletedAt: '2026-06-25T10:00:00.000Z',
      expectedVersion: 4,
    });

    expect(repository.createProspect).toHaveBeenCalledWith(createInput);
    expect(repository.findProspectById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
    });
    expect(repository.findProspectByCode).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      prospectCode: 'prospect-1',
    });
    expect(repository.listProspects).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    expect(repository.updateProspectLifecycle).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      expectedVersion: 2,
      status: 'QUALIFIED',
    });
    expect(repository.linkProspectToPartner).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      expectedVersion: 3,
    });
    expect(repository.softDeleteProspect).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      deletedAt: '2026-06-25T10:00:00.000Z',
      expectedVersion: 4,
    });
  });

  it('delegates command, event, outbox and conversion orchestration only', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
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
    repository.findCommandByIdempotencyKey.mockResolvedValue(null);
    repository.markCommandProcessed.mockResolvedValue(null);
    repository.markCommandFailed.mockResolvedValue(null);
    repository.appendEvent.mockResolvedValue({
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
      version: 1,
    });
    repository.listEventsByAggregate.mockResolvedValue([]);
    repository.findEventByEventId.mockResolvedValue(null);
    repository.enqueueOutboxEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    });
    repository.listPendingOutboxEvents.mockResolvedValue([]);
    repository.markOutboxProcessed.mockResolvedValue(null);
    repository.markOutboxFailed.mockResolvedValue(null);
    repository.recordConversionDecision.mockResolvedValue({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });
    repository.findConversionDecisionByProspectId.mockResolvedValue(null);

    const service = new PartnerAcquisitionService(repository);

    await service.recordCommand({
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
    await service.findCommandByIdempotencyKey({
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
    });
    await service.markCommandProcessed({
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
      processedAt: '2026-06-25T01:00:00.000Z',
      result: { ok: true },
    });
    await service.markCommandFailed({
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
      error: 'falha',
    });
    await service.appendEvent({
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
      version: 1,
    });
    await service.listEventsByAggregate({
      tenantId: 'tenant-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
    });
    await service.findEventByEventId({
      tenantId: 'tenant-1',
      eventId: 'event-1',
    });
    await service.enqueueOutboxEvent({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    });
    await service.listPendingOutboxEvents({ tenantId: 'tenant-1' });
    await service.markOutboxProcessed({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      status: 'PROCESSED',
      processedAt: '2026-06-25T01:00:00.000Z',
    });
    await service.markOutboxFailed({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      status: 'FAILED',
      processedAt: '2026-06-25T01:00:00.000Z',
      lastError: 'falha',
    });
    await service.recordConversionDecision({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });
    await service.findConversionDecisionByProspectId({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
    });

    expect(repository.recordCommand).toHaveBeenCalledTimes(1);
    expect(repository.appendEvent).toHaveBeenCalledTimes(1);
    expect(repository.enqueueOutboxEvent).toHaveBeenCalledTimes(1);
    expect(repository.recordConversionDecision).toHaveBeenCalledTimes(1);
  });

  it('keeps the service source free from runtime coupling', async () => {
    expect(serviceSource).not.toContain('opportunityId');
    expect(serviceSource).not.toContain('PrismaClient');
    expect(serviceSource).not.toContain('Fastify');
    expect(serviceSource).not.toContain('HTTP');
  });

  it('promotes a qualified lead through the transactional repository and returns a canonical result', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue({
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
      status: 'QUALIFIED',
      score: 87,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    repository.findProspectByTenantAndLead.mockResolvedValue(null);
    repository.promoteLeadToProspectInTransaction.mockResolvedValue({
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
      status: 'NEW',
      pipelineCode: null,
      stageCode: null,
      score: 87,
      qualificationReason: null,
      assignedUserId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    repository.markCommandProcessed.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'PROCESSED',
      result: {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        prospectId: 'prospect-1',
        leadStatus: 'QUALIFIED',
        prospectStatus: 'NEW',
        created: true,
        replayed: false,
      },
    });

    const service = new PartnerAcquisitionService(repository);
    const result = await service.promoteLeadToProspect({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'CAMPAIGN',
      commandType: 'PromotePartnerLeadToProspectCommand',
      leadId: 'lead-1',
    });

    expect(repository.recordCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        idempotencyKey: 'idem-1',
        aggregateId: 'lead-1',
      }),
    );
    expect(repository.findLeadById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
    });
    expect(repository.findProspectByTenantAndLead).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
    });
    expect(repository.promoteLeadToProspectInTransaction).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectCode: 'lead-1',
    });
    expect(repository.markCommandProcessed).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectId: 'prospect-1',
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
      created: true,
      replayed: false,
    });
  });

  it.each(['NEW', 'ENRICHED', 'CONTACTED', 'DISCARDED'] as const)(
    'rejects non-qualifying lead status %s',
    async (status) => {
      const repository = createRepositoryMock();
      repository.recordCommand.mockResolvedValue({
        tenantId: 'tenant-1',
        commandType: 'PromotePartnerLeadToProspectCommand',
        aggregateId: 'lead-1',
        aggregateType: 'PARTNER_LEAD',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        receivedAt: '2026-06-25T00:00:00.000Z',
        payload: {
          commandType: 'PromotePartnerLeadToProspectCommand',
          leadId: 'lead-1',
          source: 'CAMPAIGN',
        },
        status: 'RECEIVED',
      });
      repository.findLeadById.mockResolvedValue({
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
        status,
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      });

      const service = new PartnerAcquisitionService(repository);

      await expect(
        service.promoteLeadToProspect({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          requestId: 'req-1',
          correlationId: 'corr-1',
          idempotencyKey: 'idem-1',
          requestedAt: '2026-06-25T00:00:00.000Z',
          source: 'CAMPAIGN',
          commandType: 'PromotePartnerLeadToProspectCommand',
          leadId: 'lead-1',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(repository.markCommandFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          idempotencyKey: 'idem-1',
          error: `Partner lead cannot be promoted from status ${status}`,
        }),
      );
      expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
    },
  );

  it('throws not found when the lead does not exist or is not visible in the tenant scope', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue(null);

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.promoteLeadToProspect({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        source: 'CAMPAIGN',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.markCommandFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        idempotencyKey: 'idem-1',
        error: 'Partner lead not found',
      }),
    );
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
  });

  it('replays a failed command with the stored not found error', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'FAILED',
      result: {
        error: 'Partner lead not found',
      },
    });

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.promoteLeadToProspect({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        source: 'CAMPAIGN',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
  });

  it('replays a failed command with the stored conflict error', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'FAILED',
      result: {
        error: 'Partner lead cannot be promoted from status NEW',
      },
    });

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.promoteLeadToProspect({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        source: 'CAMPAIGN',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
  });

  it('returns the stored replay result when the idempotency key was already processed', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'CAMPAIGN',
      },
      status: 'PROCESSED',
      result: {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        prospectId: 'prospect-1',
        leadStatus: 'QUALIFIED',
        prospectStatus: 'NEW',
        created: true,
        replayed: false,
      },
    });

    const service = new PartnerAcquisitionService(repository);
    const result = await service.promoteLeadToProspect({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'CAMPAIGN',
      commandType: 'PromotePartnerLeadToProspectCommand',
      leadId: 'lead-1',
    });

    expect(result).toEqual({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectId: 'prospect-1',
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
      created: true,
      replayed: false,
    });
    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
  });

  it('fails fast on divergent payload for the same idempotency key', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'PromotePartnerLeadToProspectCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
        source: 'SDR_IA',
      },
      status: 'RECEIVED',
    });

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.promoteLeadToProspect({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        source: 'CAMPAIGN',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
    expect(repository.markCommandFailed).not.toHaveBeenCalled();
  });
});
