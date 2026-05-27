import type { FinancialProposalStatus } from './financial-proposal-status.js';

export type FinancialProposal = {
  proposalId: string;
  providerKey: string;
  externalProposalId: string;

  customerDocument: string;

  bank: string;
  product: string;

  status: FinancialProposalStatus;

  amount?: number;
  installments?: number;

  createdAt?: Date;
  updatedAt?: Date;

  metadata?: Record<string, unknown>;
};