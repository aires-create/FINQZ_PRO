export interface RecommendationInput {
  providerName: string;
  bankName: string;

  customerScore: number;
  companyScore: number;
  balancedScore: number;

  cet: number;

  monthlyPayment: number;
  totalAmount: number;

  expectedOperationalValue: number;

  availableMargin?: number;

  portabilitySavings?: number;

  refinancingAmount?: number;

  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}