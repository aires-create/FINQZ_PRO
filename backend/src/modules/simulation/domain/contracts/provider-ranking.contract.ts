export type ProviderRankingMode =
  | 'best_for_customer'
  | 'best_for_company'
  | 'balanced';

export type ProviderRankingCandidate = {
  id: string;
  providerId: string;
  providerName: string;
  bankCode?: string;
  bankName?: string;
  productType?: string;
  operationType?: string;
  coefficient?: number;
  monthlyRate?: number;
  cetRate?: number;
  commissionRate?: number;
  approvedAmount?: number;
  installmentAmount?: number;
  totalAmount?: number;
  approvalProbability?: number;
};

export type ProviderRankingResult = ProviderRankingCandidate & {
  customerScore: number;
  companyScore: number;
  balancedScore: number;
  finalScore: number;
  rank: number;
};
