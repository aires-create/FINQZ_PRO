import type { ProviderMetadata } from './margin-inquiry.contract.js';

export type CommissionPayoutInput = {
  commissionExternalIds: string[];
  payoutDate?: string;
  destinationAccountId?: string;
  metadata?: ProviderMetadata;
};

export type CommissionPayoutResult = {
  payoutBatchId: string;
  status: string;
  providerKey: string;
  metadata?: ProviderMetadata;
};

export interface CommissionPayoutProvider {
  createCommissionPayout(input: CommissionPayoutInput): Promise<CommissionPayoutResult>;
}
