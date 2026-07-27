import type { PartnerProspectStatus } from './partner-acquisition.contract.js';

export const PARTNER_PROSPECT_LIFECYCLE_STATUSES = [
  'NEW',
  'ENRICHED',
  'CONTACTED',
  'QUALIFIED',
  'NEGOTIATING',
  'DOCUMENTATION',
  'CONTRACT_PENDING',
  'AWAITING_SIGNATURE',
  'SIGNED',
  'CONVERSION_PENDING',
  'CONVERTED',
  'LOST',
  'ARCHIVED',
  'REJECTED',
] as const;

export type PartnerProspectLifecycleStatus = (typeof PARTNER_PROSPECT_LIFECYCLE_STATUSES)[number];

export type PartnerProspectLifecycleTransitionMap = Readonly<Record<
  PartnerProspectLifecycleStatus,
  readonly PartnerProspectLifecycleStatus[]
>>;

export const PARTNER_PROSPECT_LIFECYCLE_TRANSITIONS: PartnerProspectLifecycleTransitionMap = {
  NEW: ['ENRICHED', 'CONTACTED', 'QUALIFIED', 'LOST', 'ARCHIVED'],
  ENRICHED: ['CONTACTED', 'QUALIFIED', 'LOST', 'ARCHIVED'],
  CONTACTED: ['QUALIFIED', 'NEGOTIATING', 'LOST', 'ARCHIVED'],
  QUALIFIED: ['NEGOTIATING', 'DOCUMENTATION', 'LOST', 'ARCHIVED'],
  NEGOTIATING: ['DOCUMENTATION', 'CONTRACT_PENDING', 'LOST', 'ARCHIVED'],
  DOCUMENTATION: ['CONTRACT_PENDING', 'AWAITING_SIGNATURE', 'LOST', 'ARCHIVED'],
  CONTRACT_PENDING: ['AWAITING_SIGNATURE', 'SIGNED', 'LOST', 'ARCHIVED'],
  AWAITING_SIGNATURE: ['SIGNED', 'LOST', 'ARCHIVED'],
  SIGNED: ['CONVERSION_PENDING', 'LOST', 'ARCHIVED'],
  CONVERSION_PENDING: ['CONVERTED', 'REJECTED', 'ARCHIVED'],
  CONVERTED: [],
  LOST: ['CONTACTED', 'QUALIFIED', 'ARCHIVED'],
  ARCHIVED: [],
  REJECTED: [],
} as const;

export const PARTNER_PROSPECT_TERMINAL_STATUSES = [
  'CONVERTED',
  'LOST',
  'ARCHIVED',
  'REJECTED',
] as const;

export type PartnerProspectTerminalStatus = (typeof PARTNER_PROSPECT_TERMINAL_STATUSES)[number];

export const isPartnerProspectTerminalStatus = (
  status: PartnerProspectStatus,
): status is PartnerProspectTerminalStatus => {
  return PARTNER_PROSPECT_TERMINAL_STATUSES.includes(status as PartnerProspectTerminalStatus);
};

