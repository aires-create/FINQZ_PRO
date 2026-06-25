import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_ACQUISITION_EVENT_TYPES,
  PARTNER_ACQUISITION_PERMISSION_CODES,
  PARTNER_LEAD_CHANNELS,
  PARTNER_LEAD_STATUSES,
  PARTNER_PROSPECT_STATUSES,
  type PartnerAcquisitionAuditEvent,
  type PartnerAcquisitionCommandContext,
  type PartnerLead,
  type PartnerProspect,
} from '../../../modules/partner-acquisition/domain/partner-acquisition.contract.js';
import {
  PARTNER_PROSPECT_LIFECYCLE_STATUSES,
  PARTNER_PROSPECT_LIFECYCLE_TRANSITIONS,
  isPartnerProspectTerminalStatus,
} from '../../../modules/partner-acquisition/domain/partner-prospect-lifecycle.contract.js';

const contractPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-acquisition.contract.ts',
);

const lifecyclePath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-prospect-lifecycle.contract.ts',
);

const contractSource = readFileSync(contractPath, 'utf8');
const lifecycleSource = readFileSync(lifecyclePath, 'utf8');

describe('partner-acquisition.contract', () => {
  it('exposes the partner lead channels needed by the acquisition domain', () => {
    expect(PARTNER_LEAD_CHANNELS).toEqual([
      'SOCIAL_MEDIA',
      'MAILING',
      'BASE',
      'REFERRAL',
      'CAMPAIGN',
      'SDR_IA',
      'LANDING_PAGE',
      'MANUAL',
      'PARTNER_REFERRAL',
      'OUTBOUND',
      'EVENT',
      'OTHER',
    ]);
  });

  it('keeps partner lead statuses limited to the intake surface', () => {
    expect(PARTNER_LEAD_STATUSES).toEqual(['NEW', 'ENRICHED', 'CONTACTED', 'QUALIFIED', 'DISCARDED']);
    expect(PARTNER_LEAD_STATUSES).not.toContain('SIGNED');
    expect(PARTNER_LEAD_STATUSES).not.toContain('CONVERTED');
  });

  it('defines a distinct partner prospect lifecycle that is not the same as opportunity flow', () => {
    expect(PARTNER_PROSPECT_STATUSES).toContain('CONVERSION_PENDING');
    expect(PARTNER_PROSPECT_STATUSES).toContain('CONVERTED');
    expect(PARTNER_PROSPECT_STATUSES).not.toContain('OPEN');
    expect(PARTNER_PROSPECT_STATUSES).not.toContain('WON');
  });

  it('supports audit-ready command context and audit event shape', () => {
    const context: PartnerAcquisitionCommandContext = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      correlationId: 'corr-1',
      requestId: 'req-1',
      idempotencyKey: 'idem-1',
      source: 'SDR_IA',
    };

    const auditEvent: PartnerAcquisitionAuditEvent = {
      tenantId: context.tenantId,
      actorUserId: context.actorUserId,
      correlationId: context.correlationId,
      requestId: context.requestId,
      idempotencyKey: context.idempotencyKey,
      eventType: 'partner_acquisition.prospect_created',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      partnerId: null,
      fromStatus: 'NEW',
      toStatus: 'CONTACTED',
      occurredAt: '2026-06-25T00:00:00.000Z',
      metadata: { source: context.source },
    };

    expect(auditEvent).toMatchObject({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      eventType: 'partner_acquisition.prospect_created',
      fromStatus: 'NEW',
      toStatus: 'CONTACTED',
    });
  });

  it('allows a pure PartnerLead and PartnerProspect shape without runtime dependencies', () => {
    const lead = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      email: 'parceiro@example.com',
      phone: '+5511999999999',
      companyName: 'Parceiro Exemplo LTDA',
      document: '12345678000190',
      channel: 'CAMPAIGN',
      sourceName: 'Campanha Junho',
      sourceReference: 'campaign-2026-06',
      campaignId: 'campaign-1',
      hubContextId: 'hub-1',
      ownerUserId: 'user-1',
      status: 'QUALIFIED',
      score: 87,
      enrichedAt: '2026-06-25T00:00:00.000Z',
      contactedAt: '2026-06-25T00:00:00.000Z',
      qualifiedAt: '2026-06-25T00:00:00.000Z',
      discardedAt: null,
      discardReason: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerLead;

    const prospect = {
      tenantId: 'tenant-1',
      prospectId: 'prospect-1',
      leadId: lead.leadId,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      document: lead.document,
      channel: lead.channel,
      sourceName: lead.sourceName,
      sourceReference: lead.sourceReference,
      campaignId: lead.campaignId,
      hubContextId: lead.hubContextId,
      sdrAgentId: 'agent-1',
      status: 'CONTRACT_PENDING',
      pipelineCode: 'parceiros_comerciais',
      stageCode: 'documentacao',
      score: 92,
      qualificationReason: 'Perfil comercial aderente',
      assignedUserId: 'user-1',
      nextActionAt: '2026-06-26T00:00:00.000Z',
      signedAt: null,
      convertedAt: null,
      lostAt: null,
      lostReason: null,
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    } satisfies PartnerProspect;

    expect(lead.status).toBe('QUALIFIED');
    expect(prospect.pipelineCode).toBe('parceiros_comerciais');
    expect(prospect.status).toBe('CONTRACT_PENDING');
  });

  it('keeps the contract surface free from runtime imports and Opportunity ownership', () => {
    expect(contractSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http|opportunity)[^'"]*['"]/i);
    expect(contractSource).not.toContain('Opportunity');
    expect(contractSource).not.toContain('Fastify');
    expect(contractSource).not.toContain('Prisma');
    expect(contractSource).not.toContain('Repository');
  });

  it('keeps the lifecycle contract pure and guarantees terminal-state semantics', () => {
    expect(PARTNER_PROSPECT_LIFECYCLE_STATUSES).toContain('CONVERTED');
    expect(PARTNER_PROSPECT_LIFECYCLE_STATUSES).toContain('REJECTED');
    expect(PARTNER_PROSPECT_LIFECYCLE_TRANSITIONS.CONVERTED).toHaveLength(0);
    expect(PARTNER_PROSPECT_LIFECYCLE_TRANSITIONS.ARCHIVED).toHaveLength(0);
    expect(PARTNER_PROSPECT_LIFECYCLE_TRANSITIONS.SIGNED).toEqual(['CONVERSION_PENDING', 'LOST', 'ARCHIVED']);
    expect(isPartnerProspectTerminalStatus('CONVERTED')).toBe(true);
    expect(isPartnerProspectTerminalStatus('CONTACTED')).toBe(false);
  });

  it('keeps the lifecycle contract free from runtime imports and Opportunity coupling', () => {
    expect(lifecycleSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http)[^'"]*['"]/i);
    expect(lifecycleSource).not.toContain('Opportunity');
    expect(lifecycleSource).not.toContain('Partner ');
  });

  it('exports the official event and RBAC codes for the future runtime contract', () => {
    expect(PARTNER_ACQUISITION_EVENT_TYPES).toContain('partner_acquisition.contract_signed');
    expect(PARTNER_ACQUISITION_EVENT_TYPES).toContain('partner_acquisition.partner_created');
    expect(PARTNER_ACQUISITION_PERMISSION_CODES).toContain('partner_acquisition:convert');
    expect(PARTNER_ACQUISITION_PERMISSION_CODES).toContain('partner_prospect:transition');
  });
});
