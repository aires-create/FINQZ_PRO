import type { DecisionPolicyEvaluationMetadata } from './decision-policy-evaluation-metadata.js';

export interface DecisionPolicyScope {
  tenantId: string;
  tenantScope: string | null;
  domain: string | null;
  commandName: string | null;
  modelType: string | null;
  version: string | null;
}

export interface DecisionPolicyMetadata {
  policyId: string;
  tenantId: string | null;
  correlationId: string;
  requestId: string | null;
  source: string | null;
  version: string | null;
  attributes: Readonly<Record<string, unknown>>;
}

export interface DecisionPolicyState {
  status: string;
  version: string;
  active: boolean;
  label: string | null;
}

export interface DecisionPolicy {
  policyId: string;
  scope: DecisionPolicyScope;
  metadata: DecisionPolicyMetadata;
  state: DecisionPolicyState;
}

export interface DecisionPolicyFactoryInput {
  policyId: string;
  scope: DecisionPolicyScope;
  metadata: DecisionPolicyMetadata;
  state: DecisionPolicyState;
}

export interface DecisionPolicyFactory {
  create(input: DecisionPolicyFactoryInput): DecisionPolicy;
}

export interface DecisionPolicyResult {
  policy: DecisionPolicy;
  metadata: DecisionPolicyEvaluationMetadata;
  state: DecisionPolicyState;
}

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeMetadata = (metadata: DecisionPolicyMetadata): DecisionPolicyMetadata => ({
  policyId: normalizeText(metadata.policyId),
  tenantId: normalizeOptionalText(metadata.tenantId),
  correlationId: normalizeText(metadata.correlationId),
  requestId: normalizeOptionalText(metadata.requestId),
  source: normalizeOptionalText(metadata.source),
  version: normalizeOptionalText(metadata.version),
  attributes: {
    ...(metadata.attributes ?? {}),
  },
});

const normalizeScope = (scope: DecisionPolicyScope): DecisionPolicyScope => ({
  tenantId: normalizeText(scope.tenantId),
  tenantScope: normalizeOptionalText(scope.tenantScope),
  domain: normalizeOptionalText(scope.domain),
  commandName: normalizeOptionalText(scope.commandName),
  modelType: normalizeOptionalText(scope.modelType),
  version: normalizeOptionalText(scope.version),
});

const normalizeState = (state: DecisionPolicyState): DecisionPolicyState => ({
  status: normalizeText(state.status),
  version: normalizeText(state.version),
  active: Boolean(state.active),
  label: normalizeOptionalText(state.label),
});

export const createDecisionPolicyFactory = (): DecisionPolicyFactory => ({
  create(input: DecisionPolicyFactoryInput): DecisionPolicy {
    return {
      policyId: normalizeText(input.policyId),
      scope: normalizeScope(input.scope),
      metadata: normalizeMetadata(input.metadata),
      state: normalizeState(input.state),
    };
  },
});

