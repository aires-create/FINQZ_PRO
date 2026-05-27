import type { FinancialProposal } from './financial-proposal.contract.js';

export interface FinancialProposalMapper<TProviderPayload = unknown> {
  map(payload: TProviderPayload): FinancialProposal;
}