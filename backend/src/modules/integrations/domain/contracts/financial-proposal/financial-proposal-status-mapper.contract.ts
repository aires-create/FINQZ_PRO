import type { FinancialProposalStatus } from './financial-proposal-status.js';

export type FinancialProposalStatusMappingResult = {
  status: FinancialProposalStatus;
  rawStatus: string;
  confidence: 'high' | 'medium' | 'low';
};

export interface FinancialProposalStatusMapper {
  mapStatus(rawStatus: string): FinancialProposalStatusMappingResult;
}