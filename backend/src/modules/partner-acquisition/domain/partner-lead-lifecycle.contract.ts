import { PARTNER_LEAD_STATUSES, type PartnerLeadStatus } from './partner-acquisition.contract.js';

export const PARTNER_LEAD_ACTIVE_STATUSES = [
  'NEW',
  'ENRICHED',
  'CONTACTED',
  'QUALIFIED',
] as const satisfies readonly PartnerLeadStatus[];

export const PARTNER_LEAD_TERMINAL_STATUSES = ['DISCARDED'] as const satisfies readonly PartnerLeadStatus[];

export type PartnerLeadTransition = Readonly<{
  from: PartnerLeadStatus;
  to: PartnerLeadStatus;
}>;

export const PARTNER_LEAD_ALLOWED_TRANSITIONS = {
  NEW: ['ENRICHED', 'CONTACTED', 'QUALIFIED', 'DISCARDED'],
  ENRICHED: ['CONTACTED', 'QUALIFIED', 'DISCARDED'],
  CONTACTED: ['QUALIFIED', 'DISCARDED'],
  QUALIFIED: ['DISCARDED'],
  DISCARDED: [],
} as const satisfies Readonly<Record<PartnerLeadStatus, readonly PartnerLeadStatus[]>>;

const PARTNER_LEAD_STATUS_SET = new Set<PartnerLeadStatus>(PARTNER_LEAD_STATUSES);
const PARTNER_LEAD_ACTIVE_STATUS_SET = new Set<PartnerLeadStatus>(PARTNER_LEAD_ACTIVE_STATUSES);
const PARTNER_LEAD_TERMINAL_STATUS_SET = new Set<PartnerLeadStatus>(PARTNER_LEAD_TERMINAL_STATUSES);

export const isPartnerLeadStatus = (status: string): status is PartnerLeadStatus => {
  return PARTNER_LEAD_STATUS_SET.has(status as PartnerLeadStatus);
};

export const isPartnerLeadActiveStatus = (status: string): status is Exclude<PartnerLeadStatus, 'DISCARDED'> => {
  return PARTNER_LEAD_ACTIVE_STATUS_SET.has(status as PartnerLeadStatus);
};

export const isPartnerLeadTerminalStatus = (status: string): status is 'DISCARDED' => {
  return PARTNER_LEAD_TERMINAL_STATUS_SET.has(status as PartnerLeadStatus);
};

export const canTransitionPartnerLead = (from: string, to: string): boolean => {
  if (!isPartnerLeadStatus(from) || !isPartnerLeadStatus(to)) {
    return false;
  }

  return (PARTNER_LEAD_ALLOWED_TRANSITIONS[from] as readonly PartnerLeadStatus[]).includes(to);
};

export const assertCanTransitionPartnerLead = (from: string, to: string): void => {
  if (!isPartnerLeadStatus(from)) {
    throw new TypeError(`Unknown partner lead status: ${from}`);
  }

  if (!isPartnerLeadStatus(to)) {
    throw new TypeError(`Unknown partner lead status: ${to}`);
  }

  if (!canTransitionPartnerLead(from, to)) {
    throw new RangeError(`Transition from ${from} to ${to} is not allowed`);
  }
};
