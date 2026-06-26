import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_LEAD_PROMOTION_IDEMPOTENCY_RULES,
  PARTNER_LEAD_PROMOTION_POLICY,
  PARTNER_LEAD_PROMOTION_REJECTION_REASONS,
  PARTNER_LEAD_PROMOTABLE_STATUSES,
  assertCanPromotePartnerLeadToProspect,
  canPromotePartnerLeadToProspect,
  type PartnerLeadPromotedToProspectEvent,
  type PartnerLeadPromotionDecision,
  type PartnerLeadPromotionEligibility,
  type PartnerLeadPromotionHandOff,
  type PartnerProspectCreatedFromLeadEvent,
  type PromotePartnerLeadToProspectCommand,
  type PromotePartnerLeadToProspectResult,
} from '../../../modules/partner-acquisition/domain/partner-lead-prospect-handoff.contract.js';
import { isPartnerLeadStatus } from '../../../modules/partner-acquisition/domain/partner-lead-lifecycle.contract.js';

const handoffPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-lead-prospect-handoff.contract.ts',
);

const handoffSource = readFileSync(handoffPath, 'utf8');

describe('partner-lead-prospect-handoff.contract', () => {
  it('exposes the canonical lead-to-prospect promotion surface', () => {
    expect(PARTNER_LEAD_PROMOTABLE_STATUSES).toEqual(['QUALIFIED']);
    expect(PARTNER_LEAD_PROMOTION_POLICY).toEqual({
      promotionRequiresQualifiedLead: true,
      promotionDoesNotCreatePartner: true,
      promotionDoesNotUseParceiros: true,
      oneProspectPerLeadPerTenant: true,
    });
    expect(PARTNER_LEAD_PROMOTION_REJECTION_REASONS).toEqual([
      'NOT_FOUND',
      'TENANT_MISMATCH',
      'NOT_QUALIFIED',
      'DISCARDED',
      'IDEMPOTENCY_CONFLICT',
    ]);
  });

  it('declares the idempotency rules as pure contract documentation', () => {
    expect(PARTNER_LEAD_PROMOTION_IDEMPOTENCY_RULES).toEqual([
      'same idempotencyKey and same payload is replay-safe',
      'same idempotencyKey and different payload is a conflict',
      'same lead and tenant resolves to the existing prospect',
    ]);
  });

  it('allows only QUALIFIED leads to be promoted', () => {
    expect(canPromotePartnerLeadToProspect('QUALIFIED')).toBe(true);
    expect(canPromotePartnerLeadToProspect('NEW')).toBe(false);
    expect(canPromotePartnerLeadToProspect('ENRICHED')).toBe(false);
    expect(canPromotePartnerLeadToProspect('CONTACTED')).toBe(false);
    expect(canPromotePartnerLeadToProspect('DISCARDED')).toBe(false);
    expect(canPromotePartnerLeadToProspect('CONVERTED')).toBe(false);
  });

  it('asserts promotion eligibility for the canonical lead handoff', () => {
    expect(() => assertCanPromotePartnerLeadToProspect('QUALIFIED')).not.toThrow();
    expect(() => assertCanPromotePartnerLeadToProspect('NEW')).toThrow(RangeError);
    expect(() => assertCanPromotePartnerLeadToProspect('DISCARDED')).toThrow(RangeError);
  });

  it('preserves tenant scope and idempotency in the command/result contract', () => {
    const command: PromotePartnerLeadToProspectCommand = {
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      requestId: 'req-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      requestedAt: '2026-06-26T00:00:00.000Z',
      source: 'SDR_IA',
      commandType: 'PromotePartnerLeadToProspectCommand',
      leadId: 'lead-1',
      sourceName: 'SDR IA',
      sourceReference: 'sdr-ia-001',
      metadata: {
        source: 'SDR_IA',
        pipelineCode: 'parceiros_comerciais',
      },
      references: [
        {
          kind: 'FEEDER',
          refType: 'SDR_IA',
          refId: 'hub-1',
          refLabel: 'SDR IA',
        },
      ],
    };

    const eligibility: PartnerLeadPromotionEligibility = {
      tenantId: command.tenantId,
      leadId: command.leadId,
      leadStatus: 'QUALIFIED',
      eligible: true,
    };

    const decision: PartnerLeadPromotionDecision = {
      ...eligibility,
      prospectId: 'prospect-1',
      replaySafe: true,
    };

    const result: PromotePartnerLeadToProspectResult = {
      tenantId: command.tenantId,
      leadId: command.leadId,
      prospectId: 'prospect-1',
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
      replayed: false,
      created: true,
    };

    const handoff: PartnerLeadPromotionHandOff = {
      command,
      decision,
      leadPromotedEvent: {
        eventId: 'evt-1',
        tenantId: command.tenantId,
        aggregateId: command.leadId,
        aggregateType: 'PARTNER_LEAD',
        eventType: 'partnerLead.promotedToProspect',
        actorUserId: command.actorUserId,
        requestId: command.requestId,
        correlationId: command.correlationId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.requestedAt,
        source: command.source,
        references: command.references,
        metadata: {
          ...command.metadata,
          previousStatus: 'QUALIFIED',
          nextStatus: 'QUALIFIED',
        },
        leadId: command.leadId,
        prospectId: result.prospectId,
        leadStatus: 'QUALIFIED',
        prospectStatus: 'NEW',
      } satisfies PartnerLeadPromotedToProspectEvent,
      prospectCreatedEvent: {
        eventId: 'evt-2',
        tenantId: command.tenantId,
        aggregateId: result.prospectId,
        aggregateType: 'PARTNER_PROSPECT',
        eventType: 'partnerProspect.createdFromLead',
        actorUserId: command.actorUserId,
        requestId: command.requestId,
        correlationId: command.correlationId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.requestedAt,
        source: command.source,
        references: command.references,
        metadata: {
          ...command.metadata,
          previousStatus: 'QUALIFIED',
          nextStatus: 'NEW',
        },
        leadId: command.leadId,
        prospectId: result.prospectId,
        sourceLeadStatus: 'QUALIFIED',
        status: 'NEW',
      } satisfies PartnerProspectCreatedFromLeadEvent,
      source: command.source,
      references: command.references,
      metadata: {
        source: command.source,
      },
    };

    expect(command.tenantId).toBe('tenant-1');
    expect(command.leadId).toBe('lead-1');
    expect(eligibility.eligible).toBe(true);
    expect(decision.replaySafe).toBe(true);
    expect(result.created).toBe(true);
    expect(result.replayed).toBe(false);
    expect(handoff.leadPromotedEvent).toMatchObject({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectId: 'prospect-1',
      leadStatus: 'QUALIFIED',
      prospectStatus: 'NEW',
    });
    expect(handoff.prospectCreatedEvent).toMatchObject({
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      prospectId: 'prospect-1',
      sourceLeadStatus: 'QUALIFIED',
      status: 'NEW',
    });
  });

  it('documents the future runtime behavior for idempotency and replays', () => {
    expect(PARTNER_LEAD_PROMOTION_POLICY.oneProspectPerLeadPerTenant).toBe(true);
    expect(PARTNER_LEAD_PROMOTION_POLICY.promotionDoesNotCreatePartner).toBe(true);
    expect(PARTNER_LEAD_PROMOTION_POLICY.promotionDoesNotUseParceiros).toBe(true);
    expect(isPartnerLeadStatus('CONVERTED')).toBe(false);
  });

  it('keeps the contract pure and free from runtime imports', () => {
    expect(handoffSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http|opportunity|parceiros)[^'"]*['"]/i);
    expect(handoffSource).not.toContain('Fastify');
    expect(handoffSource).not.toContain('Prisma');
    expect(handoffSource).not.toContain('Repository');
    expect(handoffSource).not.toContain('Service');
    expect(handoffSource).not.toContain('Controller');
  });
});
