export interface DecisionPolicyEvaluationMetadata {
  evaluationId: string;
  tenantId: string | null;
  correlationId: string;
  requestId: string | null;
  source: string | null;
  policyId: string;
  modelId: string;
  attributes: Readonly<Record<string, unknown>>;
}

