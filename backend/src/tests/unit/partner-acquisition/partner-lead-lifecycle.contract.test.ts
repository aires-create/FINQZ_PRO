import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_LEAD_ACTIVE_STATUSES,
  PARTNER_LEAD_ALLOWED_TRANSITIONS,
  PARTNER_LEAD_TERMINAL_STATUSES,
  assertCanTransitionPartnerLead,
  canTransitionPartnerLead,
  isPartnerLeadActiveStatus,
  isPartnerLeadStatus,
  isPartnerLeadTerminalStatus,
} from '../../../modules/partner-acquisition/domain/partner-lead-lifecycle.contract.js';

const lifecyclePath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-lead-lifecycle.contract.ts',
);

const lifecycleSource = readFileSync(lifecyclePath, 'utf8');

describe('partner-lead-lifecycle.contract', () => {
  it('accepts only the canonical lead statuses and rejects non-canonical ones', () => {
    expect(isPartnerLeadStatus('NEW')).toBe(true);
    expect(isPartnerLeadStatus('ENRICHED')).toBe(true);
    expect(isPartnerLeadStatus('CONTACTED')).toBe(true);
    expect(isPartnerLeadStatus('QUALIFIED')).toBe(true);
    expect(isPartnerLeadStatus('DISCARDED')).toBe(true);

    expect(isPartnerLeadStatus('DISQUALIFIED')).toBe(false);
    expect(isPartnerLeadStatus('CONVERTED')).toBe(false);
    expect(isPartnerLeadStatus('ARCHIVED')).toBe(false);
  });

  it('exposes the active and terminal state surface for the lead lifecycle', () => {
    expect(PARTNER_LEAD_ACTIVE_STATUSES).toEqual(['NEW', 'ENRICHED', 'CONTACTED', 'QUALIFIED']);
    expect(PARTNER_LEAD_TERMINAL_STATUSES).toEqual(['DISCARDED']);

    for (const status of PARTNER_LEAD_ACTIVE_STATUSES) {
      expect(isPartnerLeadActiveStatus(status)).toBe(true);
      expect(isPartnerLeadTerminalStatus(status)).toBe(false);
    }

    expect(isPartnerLeadActiveStatus('DISCARDED')).toBe(false);
    expect(isPartnerLeadTerminalStatus('DISCARDED')).toBe(true);
    expect(isPartnerLeadTerminalStatus('ARCHIVED')).toBe(false);
  });

  it('defines the canonical lead transition matrix', () => {
    expect(PARTNER_LEAD_ALLOWED_TRANSITIONS).toEqual({
      NEW: ['ENRICHED', 'CONTACTED', 'QUALIFIED', 'DISCARDED'],
      ENRICHED: ['CONTACTED', 'QUALIFIED', 'DISCARDED'],
      CONTACTED: ['QUALIFIED', 'DISCARDED'],
      QUALIFIED: ['DISCARDED'],
      DISCARDED: [],
    });
  });

  it('allows the approved transitions and blocks forbidden ones', () => {
    expect(canTransitionPartnerLead('NEW', 'ENRICHED')).toBe(true);
    expect(canTransitionPartnerLead('NEW', 'CONTACTED')).toBe(true);
    expect(canTransitionPartnerLead('NEW', 'QUALIFIED')).toBe(true);
    expect(canTransitionPartnerLead('NEW', 'DISCARDED')).toBe(true);

    expect(canTransitionPartnerLead('ENRICHED', 'CONTACTED')).toBe(true);
    expect(canTransitionPartnerLead('ENRICHED', 'QUALIFIED')).toBe(true);
    expect(canTransitionPartnerLead('ENRICHED', 'DISCARDED')).toBe(true);

    expect(canTransitionPartnerLead('CONTACTED', 'QUALIFIED')).toBe(true);
    expect(canTransitionPartnerLead('CONTACTED', 'DISCARDED')).toBe(true);

    expect(canTransitionPartnerLead('QUALIFIED', 'DISCARDED')).toBe(true);

    expect(canTransitionPartnerLead('DISCARDED', 'NEW')).toBe(false);
    expect(canTransitionPartnerLead('DISCARDED', 'ENRICHED')).toBe(false);
    expect(canTransitionPartnerLead('DISCARDED', 'CONTACTED')).toBe(false);
    expect(canTransitionPartnerLead('DISCARDED', 'QUALIFIED')).toBe(false);
    expect(canTransitionPartnerLead('NEW', 'CONVERTED')).toBe(false);
    expect(canTransitionPartnerLead('NEW', 'ARCHIVED')).toBe(false);
    expect(canTransitionPartnerLead('NEW', 'DISQUALIFIED')).toBe(false);
  });

  it('asserts on invalid lead lifecycle transitions', () => {
    expect(() => assertCanTransitionPartnerLead('NEW', 'ENRICHED')).not.toThrow();
    expect(() => assertCanTransitionPartnerLead('QUALIFIED', 'DISCARDED')).not.toThrow();

    expect(() => assertCanTransitionPartnerLead('DISCARDED', 'NEW')).toThrow(RangeError);
    expect(() => assertCanTransitionPartnerLead('NEW', 'CONVERTED')).toThrow(TypeError);
    expect(() => assertCanTransitionPartnerLead('ARCHIVED', 'NEW')).toThrow(TypeError);
    expect(() => assertCanTransitionPartnerLead('NEW', 'DISQUALIFIED')).toThrow(TypeError);
  });

  it('keeps the lifecycle contract pure and free from runtime imports', () => {
    expect(lifecycleSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http|opportunity)[^'"]*['"]/i);
    expect(lifecycleSource).not.toContain('Opportunity');
    expect(lifecycleSource).not.toContain('Fastify');
    expect(lifecycleSource).not.toContain('Prisma');
    expect(lifecycleSource).not.toContain('Repository');
  });
});
