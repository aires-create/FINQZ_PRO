import type { DecisionModel } from '../composition/decision-model.js';
import type { DecisionPolicy } from './decision-policy.js';
import type { DecisionPolicyEvaluation } from './decision-policy-evaluation.js';
import type { DecisionPolicyEvaluationMetadata } from './decision-policy-evaluation-metadata.js';

export interface DecisionPolicyEvaluationFactoryInput {
  model: DecisionModel;
  policy: DecisionPolicy;
  metadata?: Pick<DecisionPolicyEvaluationMetadata, 'requestId' | 'source' | 'attributes'> & {
    evaluationId?: string | null;
  };
}

export interface DecisionPolicyEvaluationFactory {
  create(input: DecisionPolicyEvaluationFactoryInput): DecisionPolicyEvaluation;
}

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeAttributes = (attributes?: Record<string, unknown>): Readonly<Record<string, unknown>> => ({
  ...(attributes ?? {}),
});

export const createDecisionPolicyEvaluationFactory = (): DecisionPolicyEvaluationFactory => ({
  create(input: DecisionPolicyEvaluationFactoryInput): DecisionPolicyEvaluation {
    const evaluationId = normalizeOptionalText(input.metadata?.evaluationId) ?? `${input.model.metadata.modelId}:${input.policy.policyId}`;

    return {
      model: input.model,
      policy: input.policy,
      metadata: {
        evaluationId: normalizeText(evaluationId),
        tenantId: input.policy.metadata.tenantId ?? input.model.metadata.tenantId,
        correlationId: input.policy.metadata.correlationId,
        requestId: normalizeOptionalText(input.metadata?.requestId) ?? input.policy.metadata.requestId ?? input.model.metadata.requestId,
        source: normalizeOptionalText(input.metadata?.source) ?? input.policy.metadata.source ?? input.model.metadata.source,
        policyId: input.policy.policyId,
        modelId: input.model.metadata.modelId,
        attributes: normalizeAttributes(input.metadata?.attributes),
      },
    };
  },
});

