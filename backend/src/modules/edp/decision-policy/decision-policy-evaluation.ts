import type { DecisionModel } from '../composition/decision-model.js';
import type { DecisionPolicy } from './decision-policy.js';
import type { DecisionPolicyEvaluationMetadata } from './decision-policy-evaluation-metadata.js';

export interface DecisionPolicyEvaluation {
  model: DecisionModel;
  policy: DecisionPolicy;
  metadata: DecisionPolicyEvaluationMetadata;
}

