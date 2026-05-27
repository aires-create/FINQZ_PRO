export const financialProposalStatuses = [
  'RECEIVED',
  'UNDER_REVIEW',
  'PENDING_DOCUMENTS',
  'DIGITATION',
  'FORMALIZATION',
  'AVERBATION',
  'APPROVED',
  'REJECTED',
  'CANCELED',
  'PAID',
  'ERROR',
] as const;

export type FinancialProposalStatus =
  (typeof financialProposalStatuses)[number];