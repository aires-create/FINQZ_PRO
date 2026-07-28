import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartnerAcquisitionService, isSamePayload } from '../../../modules/partner-acquisition/services/partner-acquisition.service.js';
import type { PartnerAcquisitionRepositoryContract } from '../../../modules/partner-acquisition/repositories/partner-acquisition.repository.contract.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';
import { PartnerNotFoundError } from '../../../modules/partners/services/partner.errors.js';

const partnerServiceMock = vi.hoisted(() => ({
  getPartnerById: vi.fn(),
  getPartnerByCode: vi.fn(),
  createPartner: vi.fn(),
}));

const partnerAcquisitionTransactionRepositoryMock = vi.hoisted(() => ({
  findProspectById: vi.fn(),
  linkProspectToPartner: vi.fn(),
  recordConversionDecision: vi.fn(),
  updateProspectLifecycle: vi.fn(),
}));

vi.mock('../../../modules/partners/services/partner.service.js', () => ({
  PartnerService: vi.fn(function PartnerService() {
    return partnerServiceMock;
  }),
}));

vi.mock('../../../modules/partner-acquisition/repositories/partner-acquisition.prisma.repository.js', () => ({
  partnerAcquisitionPrismaRepository: partnerAcquisitionTransactionRepositoryMock,
  PartnerAcquisitionPrismaRepository: vi.fn(function PartnerAcquisitionPrismaRepository() {
    return partnerAcquisitionTransactionRepositoryMock;
  }),
}));

vi.mock('../../../modules/partners/repositories/partner.prisma.repository.js', () => ({
  PartnerPrismaRepository: vi.fn(function PartnerPrismaRepository() {
    return partnerAcquisitionTransactionRepositoryMock;
  }),
}));

const createRepositoryMock = () =>
  ({
    createLead: vi.fn(),
    findLeadById: vi.fn(),
    findLeadByCode: vi.fn(),
    listLeads: vi.fn(),
    softDeleteLead: vi.fn(),
    updateLeadLifecycle: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compares JSON-like payloads semantically regardless of object key order', () => {
    expect(isSamePayload(
      { leadId: 'lead-1', source: 'CAMPAIGN', commandType: 'PromotePartnerLeadToProspectCommand' },
      { commandType: 'PromotePartnerLeadToProspectCommand', source: 'CAMPAIGN', leadId: 'lead-1' },
    )).toBe(true);
    expect(isSamePayload(
      { leadId: 'lead-1', source: 'CAMPAIGN' },
      { leadId: 'lead-1', source: 'MANUAL' },
    )).toBe(false);
    expect(isSamePayload(
      { leadId: 'lead-1', source: 'CAMPAIGN' },
      { leadId: 'lead-1', source: 'CAMPAIGN', extra: true },
    )).toBe(false);
    expect(isSamePayload(
      { steps: ['A', 'B'] },
      { steps: ['B', 'A'] },
    )).toBe(false);
  });

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
      leadCode: 'lead-code-1',
      fullName: 'Parceiro Exemplo',
      channel: 'CAMPAIGN',
    } as const;

    await service.createLead(input);
    await service.findLeadById({ tenantId: 'tenant-1', leadId: 'lead-1' });
    await service.findLeadByCode({ tenantId: 'tenant-1', leadCode: 'lead-code-1' });
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
      leadCode: 'lead-code-1',
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
      prospectCode: 'prospect-code-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'SDR_IA',
    } as const;

    await service.createProspect(createInput);
    await service.findProspectById({ tenantId: 'tenant-1', prospectId: 'prospect-1' });
    await service.findProspectByCode({ tenantId: 'tenant-1', prospectCode: 'prospect-code-1' });
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
      prospectCode: 'prospect-code-1',
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

  it.each([
    ['NEW', 'ENRICHED'],
    ['NEW', 'QUALIFIED'],
    ['ENRICHED', 'CONTACTED'],
    ['CONTACTED', 'QUALIFIED'],
    ['QUALIFIED', 'DISCARDED'],
  ] as const)('transitions lead from %s to %s and records the command lifecycle', async (status, nextStatus) => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus,
        reason: 'H17S smoke qualification',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      leadCode: 'lead-code-1',
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
    repository.updateLeadLifecycle.mockResolvedValue({
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
      status: nextStatus,
      score: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    repository.listEventsByAggregate.mockResolvedValue([]);
    repository.appendEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      eventType: 'PartnerLeadStatusChanged',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      occurredAt: '2026-06-25T00:00:00.000Z',
      payload: {
        leadId: 'lead-1',
        previousStatus: status,
        nextStatus,
        reason: 'H17S smoke qualification',
      },
      metadata: null,
      version: 1,
    });
    repository.enqueueOutboxEvent.mockResolvedValue({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      eventType: 'PartnerLeadStatusChanged',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {
        leadId: 'lead-1',
        previousStatus: status,
        nextStatus,
        reason: 'H17S smoke qualification',
      },
    });
    repository.markCommandProcessed.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus,
        reason: 'H17S smoke qualification',
      },
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
        status: nextStatus,
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    });

    const service = new PartnerAcquisitionService(repository);
    const result = await service.transitionLead({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      commandType: 'TransitionPartnerLeadCommand',
      leadId: 'lead-1',
      nextStatus,
      reason: 'H17S smoke qualification',
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
    expect(repository.updateLeadLifecycle).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      status: nextStatus,
    });
    expect(repository.appendEvent).toHaveBeenCalledTimes(1);
    expect(repository.enqueueOutboxEvent).toHaveBeenCalledTimes(1);
    expect(repository.markCommandProcessed).toHaveBeenCalledTimes(1);
    expect(repository.createProspect).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
    expect(result.status).toBe(nextStatus);
  });

  it.each([
    ['DISCARDED', 'QUALIFIED'],
    ['QUALIFIED', 'NEW'],
  ] as const)('blocks invalid lead transitions from %s to %s and marks the inbox failed', async (status, nextStatus) => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus,
        reason: 'H17S smoke qualification',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      leadCode: 'lead-code-1',
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
      service.transitionLead({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus,
        reason: 'H17S smoke qualification',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(repository.updateLeadLifecycle).not.toHaveBeenCalled();
    expect(repository.appendEvent).not.toHaveBeenCalled();
    expect(repository.markCommandFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        idempotencyKey: 'idem-1',
        error: `Partner lead cannot transition from status ${status} to ${nextStatus}`,
      }),
    );
    expect(repository.createProspect).not.toHaveBeenCalled();
    expect(repository.promoteLeadToProspectInTransaction).not.toHaveBeenCalled();
  });

  it('marks the inbox failed when the lead does not exist', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue(null);

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.transitionLead({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(repository.updateLeadLifecycle).not.toHaveBeenCalled();
    expect(repository.appendEvent).not.toHaveBeenCalled();
    expect(repository.markCommandFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        idempotencyKey: 'idem-1',
        error: 'Partner lead not found',
      }),
    );
  });

  it('replays a processed transition command without touching lead state again', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      },
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
        status: 'QUALIFIED',
        score: null,
        createdAt: '2026-06-25T00:00:00.000Z',
        updatedAt: '2026-06-25T00:00:00.000Z',
      },
    });

    const service = new PartnerAcquisitionService(repository);
    const result = await service.transitionLead({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      commandType: 'TransitionPartnerLeadCommand',
      leadId: 'lead-1',
      nextStatus: 'QUALIFIED',
      reason: 'H17S smoke qualification',
    });

    expect(result.status).toBe('QUALIFIED');
    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.updateLeadLifecycle).not.toHaveBeenCalled();
    expect(repository.appendEvent).not.toHaveBeenCalled();
    expect(repository.enqueueOutboxEvent).not.toHaveBeenCalled();
  });

  it('returns payload mismatch when the idempotency command payload changes', async () => {
    const repository = createRepositoryMock();
    repository.recordCommand.mockResolvedValue({
      tenantId: 'tenant-1',
      commandType: 'TransitionPartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus: 'ENRICHED',
        reason: 'H17S smoke qualification',
      },
      status: 'RECEIVED',
    });

    const service = new PartnerAcquisitionService(repository);

    await expect(
      service.transitionLead({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        idempotencyKey: 'idem-1',
        requestedAt: '2026-06-25T00:00:00.000Z',
        commandType: 'TransitionPartnerLeadCommand',
        leadId: 'lead-1',
        nextStatus: 'QUALIFIED',
        reason: 'H17S smoke qualification',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(repository.findLeadById).not.toHaveBeenCalled();
    expect(repository.updateLeadLifecycle).not.toHaveBeenCalled();
    expect(repository.markCommandFailed).not.toHaveBeenCalled();
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
        source: 'CAMPAIGN',
        leadId: 'lead-1',
        commandType: 'PromotePartnerLeadToProspectCommand',
      },
      status: 'RECEIVED',
    });
    repository.findLeadById.mockResolvedValue({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      leadCode: 'lead-code-1',
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
      prospectCode: 'prospect-code-1',
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
      prospectCode: 'lead-code-1',
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

  it('accepts semantically equal promotion payloads even when the inbox JSON key order differs', async () => {
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
        source: 'CAMPAIGN',
        commandType: 'PromotePartnerLeadToProspectCommand',
        leadId: 'lead-1',
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

  it('materializes a Partner through the official PartnerService when converting a Prospect', async () => {
    const repository = createRepositoryMock();
    const transactionRepository = partnerAcquisitionTransactionRepositoryMock;

    transactionRepository.findProspectById.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
      phone: '+5511999999999',
      companyName: 'Parceiro Exemplo LTDA',
      document: '12345678000190',
      channel: 'SDR_IA',
      sourceName: 'H19 Smoke',
      sourceReference: 'h19-smoke',
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'SIGNED',
      pipelineCode: null,
      stageCode: null,
      score: 92,
      qualificationReason: 'Aderente ao fluxo oficial',
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: null,
      partnerId: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    transactionRepository.linkProspectToPartner.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
      phone: '+5511999999999',
      companyName: 'Parceiro Exemplo LTDA',
      document: '12345678000190',
      channel: 'SDR_IA',
      sourceName: 'H19 Smoke',
      sourceReference: 'h19-smoke',
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'SIGNED',
      pipelineCode: null,
      stageCode: null,
      score: 92,
      qualificationReason: 'Aderente ao fluxo oficial',
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: null,
      partnerId: 'partner-1',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    transactionRepository.recordConversionDecision.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });
    transactionRepository.updateProspectLifecycle.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      email: 'partner@example.com',
      phone: '+5511999999999',
      companyName: 'Parceiro Exemplo LTDA',
      document: '12345678000190',
      channel: 'SDR_IA',
      sourceName: 'H19 Smoke',
      sourceReference: 'h19-smoke',
      campaignId: null,
      hubContextId: null,
      sdrAgentId: null,
      status: 'CONVERTED',
      pipelineCode: null,
      stageCode: null,
      score: 92,
      qualificationReason: 'Aderente ao fluxo oficial',
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: '2026-06-25T00:00:00.000Z',
      lostAt: null,
      lostReason: null,
      partnerId: 'partner-1',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    vi.mocked(partnerServiceMock.getPartnerById).mockRejectedValueOnce(new PartnerNotFoundError('partner-1'));
    vi.mocked(partnerServiceMock.getPartnerByCode).mockRejectedValueOnce(new PartnerNotFoundError('P-001'));
    vi.mocked(partnerServiceMock.createPartner).mockResolvedValueOnce({
      id: 'partner-1',
      tenantId: 'tenant-1',
      code: 'P-001',
      name: 'Parceiro Exemplo LTDA',
      type: 'COMPANY',
      document: '12345678000190',
      email: 'partner@example.com',
      phone: '+5511999999999',
      status: 'ativo',
      parentId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });

    const service = new PartnerAcquisitionService(
      repository,
      async (action) => action({} as never),
    );

    const result = await service.convertProspectToPartner({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'SDR_IA',
      commandType: 'ConvertPartnerProspectToPartnerCommand',
      aggregateType: 'PARTNER_PROSPECT',
      prospectId: 'prospect-1',
      expectedVersion: 4,
      partnerId: 'partner-1',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
    });

    expect(partnerServiceMock.createPartner).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        correlationId: 'corr-1',
        code: 'P-001',
        name: 'Parceiro Exemplo LTDA',
        type: 'COMPANY',
        document: '12345678000190',
        email: 'partner@example.com',
        phone: '+5511999999999',
        status: 'ativo',
      }),
    );
    expect(transactionRepository.linkProspectToPartner).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectId: 'prospect-1',
        partnerId: 'partner-1',
        expectedVersion: 4,
      }),
    );
    expect(transactionRepository.recordConversionDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectId: 'prospect-1',
        partnerId: 'partner-1',
      }),
    );
    expect(transactionRepository.updateProspectLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectId: 'prospect-1',
        expectedVersion: 4,
        status: 'CONVERTED',
      }),
    );
    expect(result.status).toBe('CONVERTED');
  });

  it('reuses an already materialized Partner without creating a duplicate', async () => {
    const repository = createRepositoryMock();
    const transactionRepository = partnerAcquisitionTransactionRepositoryMock;

    transactionRepository.findProspectById.mockResolvedValueOnce({
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
      status: 'SIGNED',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: null,
      partnerId: 'partner-1',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    transactionRepository.recordConversionDecision.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
      reason: null,
    });
    transactionRepository.updateProspectLifecycle.mockResolvedValueOnce({
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
      status: 'CONVERTED',
      pipelineCode: null,
      stageCode: null,
      score: null,
      qualificationReason: null,
      assignedUserId: null,
      nextActionAt: null,
      signedAt: null,
      convertedAt: '2026-06-25T00:00:00.000Z',
      lostAt: null,
      lostReason: null,
      partnerId: 'partner-1',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    });
    vi.mocked(partnerServiceMock.getPartnerById).mockResolvedValueOnce({
      id: 'partner-1',
      tenantId: 'tenant-1',
      code: 'P-001',
      name: 'Parceiro Exemplo LTDA',
      type: 'COMPANY',
      document: null,
      email: null,
      phone: null,
      status: 'ativo',
      parentId: null,
      deletedAt: null,
      createdAt: new Date('2026-06-25T00:00:00.000Z'),
      updatedAt: new Date('2026-06-25T00:00:00.000Z'),
    });

    const service = new PartnerAcquisitionService(
      repository,
      async (action) => action({} as never),
    );

    const result = await service.convertProspectToPartner({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-25T00:00:00.000Z',
      source: 'SDR_IA',
      commandType: 'ConvertPartnerProspectToPartnerCommand',
      aggregateType: 'PARTNER_PROSPECT',
      prospectId: 'prospect-1',
      expectedVersion: 4,
      partnerId: 'partner-1',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
    });

    expect(partnerServiceMock.createPartner).not.toHaveBeenCalled();
    expect(partnerServiceMock.getPartnerByCode).not.toHaveBeenCalled();
    expect(transactionRepository.linkProspectToPartner).not.toHaveBeenCalled();
    expect(transactionRepository.recordConversionDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectId: 'prospect-1',
        partnerId: 'partner-1',
      }),
    );
    expect(transactionRepository.updateProspectLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prospectId: 'prospect-1',
        expectedVersion: 4,
        status: 'CONVERTED',
      }),
    );
    expect(result.partnerId).toBe('partner-1');
    expect(result.status).toBe('CONVERTED');
  });
});
