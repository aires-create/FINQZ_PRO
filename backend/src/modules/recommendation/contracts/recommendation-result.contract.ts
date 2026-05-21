export interface RecommendationResult {
  recommendedProvider: string;
  recommendedBank: string;

  confidenceScore: number;

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  reasons: string[];
  warnings: string[];
  opportunities: string[];
}