import type { RecommendationInput } from './recommendation-input.contract.js';
import type { RecommendationResult } from './recommendation-result.contract.js';

export interface RecommendationEngineContract {
  recommend(input: RecommendationInput): RecommendationResult;
}