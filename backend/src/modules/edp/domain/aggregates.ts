export const EDP_AGGREGATE_NAMES = [
  'Decision',
  'DecisionPolicy',
  'DecisionStrategy',
  'Simulation',
  'Proposal',
  'Recommendation',
  'ProviderCapability',
  'ProviderExecution',
  'OperationCandidate',
  'Workflow',
  'AuditTimeline',
  'DecisionExplanation',
] as const;

export type EdpAggregateName = (typeof EDP_AGGREGATE_NAMES)[number];

export interface EdpAggregateRoot<TName extends EdpAggregateName, TState extends string> {
  id: string;
  tenantId: string;
  name: TName;
  version: number;
  state: TState;
  createdAt: string;
  updatedAt: string;
}

export type DecisionState = 'drafted' | 'recommended' | 'overridden' | 'finalized' | 'archived';
export type DecisionPolicyState = 'draft' | 'created' | 'approved' | 'active' | 'inactive' | 'rolled_back' | 'archived';
export type DecisionStrategyState = 'draft' | 'created' | 'approved' | 'active' | 'inactive' | 'rolled_back' | 'archived';
export type SimulationState = 'draft' | 'input_updated' | 'requesting_calculation' | 'calculating' | 'calculated' | 'failed' | 'archived';
export type ProposalState = 'draft' | 'generated' | 'versioned' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'revoked' | 'expired' | 'superseded' | 'archived';
export type RecommendationState = 'generated' | 'overridden' | 'accepted_by_proposal' | 'archived';
export type ProviderCapabilityState = 'registered' | 'sandbox_certified' | 'production_certified' | 'healthy' | 'degraded' | 'unhealthy' | 'deprecated' | 'retired';
export type ProviderExecutionState = 'attempted' | 'succeeded' | 'failed' | 'fallback_used' | 'archived';
export type OperationCandidateState = 'created' | 'pending' | 'validated' | 'materialized' | 'cancelled' | 'archived';
export type WorkflowState = 'started' | 'running' | 'completed' | 'failed';
export type AuditTimelineState = 'recorded' | 'indexed' | 'retained' | 'archived' | 'purged_by_policy';
export type DecisionExplanationState = 'drafted' | 'attached' | 'archived';

export type DecisionAggregate = EdpAggregateRoot<'Decision', DecisionState> & {
  policyVersion?: string | null;
  strategyVersion?: string | null;
  selectedOfferId?: string | null;
};

export type DecisionPolicyAggregate = EdpAggregateRoot<'DecisionPolicy', DecisionPolicyState> & {
  policyVersionLabel?: string | null;
};

export type DecisionStrategyAggregate = EdpAggregateRoot<'DecisionStrategy', DecisionStrategyState> & {
  strategyVersionLabel?: string | null;
};

export type SimulationAggregate = EdpAggregateRoot<'Simulation', SimulationState> & {
  policyVersion?: string | null;
  strategyVersion?: string | null;
};

export type ProposalAggregate = EdpAggregateRoot<'Proposal', ProposalState> & {
  decisionId?: string | null;
  strategyVersion?: string | null;
};

export type RecommendationAggregate = EdpAggregateRoot<'Recommendation', RecommendationState> & {
  decisionId?: string | null;
};

export type ProviderCapabilityAggregate = EdpAggregateRoot<'ProviderCapability', ProviderCapabilityState> & {
  providerId?: string | null;
};

export type ProviderExecutionAggregate = EdpAggregateRoot<'ProviderExecution', ProviderExecutionState> & {
  providerId?: string | null;
  capabilityId?: string | null;
};

export type OperationCandidateAggregate = EdpAggregateRoot<'OperationCandidate', OperationCandidateState> & {
  opportunityId?: string | null;
  proposalId?: string | null;
};

export type WorkflowAggregate = EdpAggregateRoot<'Workflow', WorkflowState> & {
  workflowType?: string | null;
};

export type AuditTimelineAggregate = EdpAggregateRoot<'AuditTimeline', AuditTimelineState> & {
  correlationId?: string | null;
};

export type DecisionExplanationAggregate = EdpAggregateRoot<'DecisionExplanation', DecisionExplanationState> & {
  decisionId?: string | null;
};

