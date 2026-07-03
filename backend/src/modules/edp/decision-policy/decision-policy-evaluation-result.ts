import type { DecisionPolicyEvaluation } from './decision-policy-evaluation.js';
import type { DecisionPolicyState } from './decision-policy.js';

export interface DecisionPolicyEvaluationResultState {
  status: string;
  evaluationVersion: string;
  policyVersion: string | null;
  modelVersion: string | null;
}

export interface DecisionPolicyEvaluationResult {
  evaluation: DecisionPolicyEvaluation;
  state: DecisionPolicyEvaluationResultState;
  policyState: DecisionPolicyState;
}

