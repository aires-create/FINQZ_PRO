import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type {
  PartnerAcquisitionCommandFailureInput,
  PartnerAcquisitionCommandLookup,
  PartnerAcquisitionCommandProgressInput,
  PartnerAcquisitionCommandRecordInput,
  PartnerAcquisitionConversionDecisionLookup,
  PartnerAcquisitionConversionDecisionRecordInput,
  PartnerAcquisitionEventByAggregateQuery,
  PartnerAcquisitionEventLookup,
  PartnerAcquisitionEventRecordInput,
  PartnerAcquisitionLeadCodeLookup,
  PartnerAcquisitionLeadCreateInput,
  PartnerAcquisitionLeadLookup,
  PartnerAcquisitionLeadProspectPromotionInput,
  PartnerAcquisitionOutboxPendingQuery,
  PartnerAcquisitionOutboxProgressInput,
  PartnerAcquisitionOutboxRecordInput,
  PartnerAcquisitionProspectCodeLookup,
  PartnerAcquisitionProspectByLeadLookup,
  PartnerAcquisitionProspectCreateInput,
  PartnerAcquisitionProspectLifecycleUpdateInput,
  PartnerAcquisitionProspectLinkToPartnerInput,
  PartnerAcquisitionProspectLookup,
  PartnerAcquisitionRepositoryContract,
  PartnerAcquisitionLeadSoftDeleteInput,
  PartnerAcquisitionProspectSoftDeleteInput,
  PartnerAcquisitionLeadListQuery,
  PartnerAcquisitionProspectListQuery,
} from '../../../modules/partner-acquisition/repositories/partner-acquisition.repository.contract.js';

const repositoryPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/repositories/partner-acquisition.repository.contract.ts',
);

const repositorySource = readFileSync(repositoryPath, 'utf8');

const repositoryContractShape = {
  createLead: async (_input) => null as never,
  findLeadById: async (_input) => null,
  findLeadByCode: async (_input) => null,
  listLeads: async (_input) => [],
  softDeleteLead: async (_input) => null,
  createProspect: async (_input) => null as never,
  findProspectById: async (_input) => null,
  findProspectByTenantAndLead: async (_input) => null,
  findProspectByCode: async (_input) => null,
  listProspects: async (_input) => [],
  updateProspectLifecycle: async (_input) => null,
  linkProspectToPartner: async (_input) => null,
  softDeleteProspect: async (_input) => null,
  promoteLeadToProspectInTransaction: async (_input) => null,
  recordCommand: async (input) => input,
  findCommandByIdempotencyKey: async (_input) => null,
  markCommandProcessed: async (_input) => null,
  markCommandFailed: async (_input) => null,
  appendEvent: async (input) => input,
  listEventsByAggregate: async (_input) => [],
  findEventByEventId: async (_input) => null,
  enqueueOutboxEvent: async (input) => input,
  listPendingOutboxEvents: async (_input) => [],
  markOutboxProcessed: async (_input) => null,
  markOutboxFailed: async (_input) => null,
  recordConversionDecision: async (_input) => null as never,
  findConversionDecisionByProspectId: async (_input) => null,
} satisfies PartnerAcquisitionRepositoryContract;

describe('partner-acquisition.repository.contract', () => {
  it('exposes the expected repository surface', () => {
    expect(Object.keys(repositoryContractShape)).toEqual([
      'createLead',
      'findLeadById',
      'findLeadByCode',
      'listLeads',
      'softDeleteLead',
      'createProspect',
      'findProspectById',
      'findProspectByTenantAndLead',
      'findProspectByCode',
      'listProspects',
      'updateProspectLifecycle',
      'linkProspectToPartner',
      'softDeleteProspect',
      'promoteLeadToProspectInTransaction',
      'recordCommand',
      'findCommandByIdempotencyKey',
      'markCommandProcessed',
      'markCommandFailed',
      'appendEvent',
      'listEventsByAggregate',
      'findEventByEventId',
      'enqueueOutboxEvent',
      'listPendingOutboxEvents',
      'markOutboxProcessed',
      'markOutboxFailed',
      'recordConversionDecision',
      'findConversionDecisionByProspectId',
    ]);
  });

  it('keeps tenant scope on every input shape that writes or reads data', () => {
    const leadCreateInput = {
      tenantId: 'tenant-1',
      leadCode: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'CAMPAIGN',
    } satisfies PartnerAcquisitionLeadCreateInput;

    const leadLookup = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
    } satisfies PartnerAcquisitionLeadLookup;

    const leadCodeLookup = {
      tenantId: 'tenant-1',
      leadCode: 'lead-1',
    } satisfies PartnerAcquisitionLeadCodeLookup;

    const leadListQuery = {
      tenantId: 'tenant-1',
      includeDeleted: false,
    } satisfies PartnerAcquisitionLeadListQuery;

    const prospectCreateInput = {
      tenantId: 'tenant-1',
      prospectCode: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      channel: 'SDR_IA',
    } satisfies PartnerAcquisitionProspectCreateInput;

    const prospectLookup = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
    } satisfies PartnerAcquisitionProspectLookup;

    const prospectByLeadLookup = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
    } satisfies PartnerAcquisitionProspectByLeadLookup;

    const prospectCodeLookup = {
      tenantId: 'tenant-1',
      prospectCode: 'prospect-1',
    } satisfies PartnerAcquisitionProspectCodeLookup;

    const promotionInput = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectCode: 'prospect-1',
    } satisfies PartnerAcquisitionLeadProspectPromotionInput;

    const prospectListQuery = {
      tenantId: 'tenant-1',
      status: 'NEW',
    } satisfies PartnerAcquisitionProspectListQuery;

    expect(leadCreateInput.tenantId).toBe('tenant-1');
    expect(leadLookup.tenantId).toBe('tenant-1');
    expect(leadCodeLookup.tenantId).toBe('tenant-1');
    expect(leadListQuery.tenantId).toBe('tenant-1');
    expect(prospectCreateInput.tenantId).toBe('tenant-1');
    expect(prospectLookup.tenantId).toBe('tenant-1');
    expect(prospectByLeadLookup.tenantId).toBe('tenant-1');
    expect(prospectCodeLookup.tenantId).toBe('tenant-1');
    expect(promotionInput.tenantId).toBe('tenant-1');
    expect(prospectListQuery.tenantId).toBe('tenant-1');
  });

  it('requires idempotencyKey for command inbox records and preserves append-only event inputs', () => {
    const commandRecord = {
      tenantId: 'tenant-1',
      commandType: 'CreatePartnerLeadCommand',
      aggregateId: 'lead-1',
      aggregateType: 'PARTNER_LEAD',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      receivedAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    } satisfies PartnerAcquisitionCommandRecordInput;

    const commandLookup = {
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
    } satisfies PartnerAcquisitionCommandLookup;

    const commandProgress = {
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
      processedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerAcquisitionCommandProgressInput;

    const commandFailure = {
      tenantId: 'tenant-1',
      idempotencyKey: 'idem-1',
      error: 'failed',
    } satisfies PartnerAcquisitionCommandFailureInput;

    const eventRecord = {
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
    } satisfies PartnerAcquisitionEventRecordInput;

    const eventQuery = {
      tenantId: 'tenant-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
    } satisfies PartnerAcquisitionEventByAggregateQuery;

    const eventLookup = {
      tenantId: 'tenant-1',
      eventId: 'event-1',
    } satisfies PartnerAcquisitionEventLookup;

    expect(commandRecord.idempotencyKey).toBe('idem-1');
    expect(commandLookup.idempotencyKey).toBe('idem-1');
    expect(commandProgress.idempotencyKey).toBe('idem-1');
    expect(commandFailure.idempotencyKey).toBe('idem-1');
    expect(eventRecord.eventId).toBe('event-1');
    expect(eventQuery.aggregateType).toBe('PARTNER_PROSPECT');
    expect(eventLookup.eventId).toBe('event-1');
  });

  it('keeps outbox status separate from event log and requires partner/conversion identifiers where appropriate', () => {
    const outboxRecord = {
      tenantId: 'tenant-1',
      eventId: 'event-1',
      aggregateId: 'prospect-1',
      aggregateType: 'PARTNER_PROSPECT',
      eventType: 'PartnerProspectCreated',
      availableAt: '2026-06-25T00:00:00.000Z',
      payload: {},
    } satisfies PartnerAcquisitionOutboxRecordInput;

    const outboxQuery = {
      tenantId: 'tenant-1',
      status: 'PENDING',
    } satisfies PartnerAcquisitionOutboxPendingQuery;

    const outboxProgress = {
      tenantId: 'tenant-1',
      eventId: 'event-1',
      status: 'PROCESSED',
      processedAt: '2026-06-25T00:00:00.000Z',
      attemptCount: 1,
    } satisfies PartnerAcquisitionOutboxProgressInput;

    const conversionDecision = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      approved: true,
      decidedByUserId: 'user-1',
      decidedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerAcquisitionConversionDecisionRecordInput;

    const conversionLookup = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
    } satisfies PartnerAcquisitionConversionDecisionLookup;

    expect(outboxRecord.availableAt).toBe('2026-06-25T00:00:00.000Z');
    expect(outboxQuery.status).toBe('PENDING');
    expect(outboxProgress.status).toBe('PROCESSED');
    expect(conversionDecision.prospectId).toBe('prospect-1');
    expect(conversionLookup.prospectId).toBe('prospect-1');
  });

  it('keeps the contract surface free from Opportunity, HTTP and Prisma runtime coupling', () => {
    expect(repositorySource).not.toContain('Opportunity');
    expect(repositorySource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|http|controller|service|repository)[^'"]*['"]/i);
    expect(repositorySource).not.toContain('Fastify');
    expect(repositorySource).not.toContain('Prisma');
    expect(repositorySource).not.toContain('HTTP');
  });

  it('requires versioning for lifecycle updates and partner linking by tenant scope', () => {
    const lifecycleUpdate = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      expectedVersion: 3,
      status: 'SIGNED',
      signedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerAcquisitionProspectLifecycleUpdateInput;

    const linkInput = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      expectedVersion: 4,
    } satisfies PartnerAcquisitionProspectLinkToPartnerInput;

    const softDeleteLead = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      deletedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerAcquisitionLeadSoftDeleteInput;

    const softDeleteProspect = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      deletedAt: '2026-06-25T00:00:00.000Z',
      expectedVersion: 5,
    } satisfies PartnerAcquisitionProspectSoftDeleteInput;

    expect(lifecycleUpdate.expectedVersion).toBe(3);
    expect(linkInput.partnerId).toBe('partner-1');
    expect(softDeleteLead.leadId).toBe('lead-1');
    expect(softDeleteProspect.expectedVersion).toBe(5);
  });

  it('keeps the contract source free from Opportunity ownership and direct runtime side effects', () => {
    expect(repositorySource).not.toContain('opportunityId');
    expect(repositorySource).not.toContain('Opportunity');
    expect(repositorySource).not.toContain('fetch(');
  });
});
