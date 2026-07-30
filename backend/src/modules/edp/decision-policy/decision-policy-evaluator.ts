import type { DecisionModel } from '../composition/decision-model.js';
import type { DecisionPolicy } from './decision-policy.js';
import type { DecisionPolicyEvaluationFactory } from './decision-policy-evaluation-factory.js';
import { createDecisionPolicyEvaluationFactory } from './decision-policy-evaluation-factory.js';
import type { DecisionPolicyEvaluationResult } from './decision-policy-evaluation-result.js';

export interface DecisionPolicyEvaluator {
  evaluate(model: DecisionModel, policy: DecisionPolicy): DecisionPolicyEvaluationResult;
}

const normalizeText = (value: string): string => value.trim();

export const createDecisionPolicyEvaluator = (
  evaluationFactory: DecisionPolicyEvaluationFactory = createDecisionPolicyEvaluationFactory(),
): DecisionPolicyEvaluator => ({
  evaluate(model: DecisionModel, policy: DecisionPolicy): DecisionPolicyEvaluationResult {
    const evaluation = evaluationFactory.create({
      model,
      policy,
    });

    return {
      evaluation,
      state: {
        status: normalizeText('structured'),
        evaluationVersion: '1',
        policyVersion: policy.metadata.version ?? policy.state.version,
        modelVersion: model.state.modelVersion,
      },
      policyState: policy.state,
    };
  },
});
