import type { FinancialProposal } from './financial-proposal.contract.js';

export interface FinancialProposalReader {
  listFinancialProposals(): Promise<FinancialProposal[]>;
}

export const hasFinancialProposalReader = (
  value: unknown,
): value is FinancialProposalReader => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'listFinancialProposals' in value &&
    typeof value.listFinancialProposals === 'function'
  );
};