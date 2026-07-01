import type {
  AuditTimelineState,
  DecisionPolicyState,
  DecisionState,
  DecisionStrategyState,
  DecisionExplanationState,
  OperationCandidateState,
  ProposalState,
  ProviderCapabilityState,
  ProviderExecutionState,
  RecommendationState,
  SimulationState,
  WorkflowState,
} from './aggregates.js';

export interface LifecycleMachine<TState extends string> {
  initialState: TState;
  terminalStates: readonly TState[];
  transitions: Readonly<Record<TState, readonly TState[]>>;
}

const createMachine = <TState extends string>(
  initialState: TState,
  terminalStates: readonly TState[],
  transitions: Readonly<Record<TState, readonly TState[]>>,
): LifecycleMachine<TState> => ({
  initialState,
  terminalStates,
  transitions,
});

export const EDP_LIFECYCLES = {
  decision: createMachine<DecisionState>('drafted', ['archived'], {
    drafted: ['recommended'],
    recommended: ['overridden', 'finalized', 'archived'],
    overridden: ['finalized', 'archived'],
    finalized: ['archived'],
    archived: [],
  }),
  decisionPolicy: createMachine<DecisionPolicyState>('draft', ['archived'], {
    draft: ['created'],
    created: ['approved', 'archived'],
    approved: ['active', 'archived'],
    active: ['inactive', 'rolled_back', 'archived'],
    inactive: ['rolled_back', 'archived'],
    rolled_back: ['archived'],
    archived: [],
  }),
  decisionStrategy: createMachine<DecisionStrategyState>('draft', ['archived'], {
    draft: ['created'],
    created: ['approved', 'archived'],
    approved: ['active', 'archived'],
    active: ['inactive', 'rolled_back', 'archived'],
    inactive: ['rolled_back', 'archived'],
    rolled_back: ['archived'],
    archived: [],
  }),
  simulation: createMachine<SimulationState>('draft', ['archived'], {
    draft: ['input_updated', 'requesting_calculation', 'archived'],
    input_updated: ['requesting_calculation', 'archived'],
    requesting_calculation: ['calculating', 'failed', 'archived'],
    calculating: ['calculated', 'failed'],
    calculated: ['archived'],
    failed: ['archived'],
    archived: [],
  }),
  proposal: createMachine<ProposalState>('draft', ['archived'], {
    draft: ['generated', 'archived'],
    generated: ['versioned', 'sent', 'revoked', 'expired', 'archived'],
    versioned: ['sent', 'revoked', 'expired', 'archived'],
    sent: ['viewed', 'accepted', 'rejected', 'revoked', 'expired', 'archived'],
    viewed: ['accepted', 'rejected', 'revoked', 'expired', 'archived'],
    accepted: ['superseded', 'archived'],
    rejected: ['archived'],
    revoked: ['archived'],
    expired: ['archived'],
    superseded: ['archived'],
    archived: [],
  }),
  recommendation: createMachine<RecommendationState>('generated', ['archived'], {
    generated: ['overridden', 'accepted_by_proposal', 'archived'],
    overridden: ['accepted_by_proposal', 'archived'],
    accepted_by_proposal: ['archived'],
    archived: [],
  }),
  providerCapability: createMachine<ProviderCapabilityState>('registered', ['retired'], {
    registered: ['sandbox_certified', 'deprecated', 'retired'],
    sandbox_certified: ['production_certified', 'deprecated', 'retired'],
    production_certified: ['healthy', 'degraded', 'unhealthy', 'deprecated', 'retired'],
    healthy: ['degraded', 'unhealthy', 'deprecated', 'retired'],
    degraded: ['healthy', 'unhealthy', 'deprecated', 'retired'],
    unhealthy: ['healthy', 'deprecated', 'retired'],
    deprecated: ['retired'],
    retired: [],
  }),
  providerExecution: createMachine<ProviderExecutionState>('attempted', ['archived'], {
    attempted: ['succeeded', 'failed', 'fallback_used', 'archived'],
    succeeded: ['archived'],
    failed: ['fallback_used', 'archived'],
    fallback_used: ['archived'],
    archived: [],
  }),
  operationCandidate: createMachine<OperationCandidateState>('created', ['archived'], {
    created: ['pending', 'validated', 'materialized', 'cancelled', 'archived'],
    pending: ['validated', 'cancelled', 'archived'],
    validated: ['materialized', 'cancelled', 'archived'],
    materialized: ['archived'],
    cancelled: ['archived'],
    archived: [],
  }),
  workflow: createMachine<WorkflowState>('started', ['completed', 'failed'], {
    started: ['running', 'failed'],
    running: ['completed', 'failed'],
    completed: [],
    failed: [],
  }),
  auditTimeline: createMachine<AuditTimelineState>('recorded', ['purged_by_policy'], {
    recorded: ['indexed', 'retained', 'archived'],
    indexed: ['retained', 'archived'],
    retained: ['archived', 'purged_by_policy'],
    archived: ['purged_by_policy'],
    purged_by_policy: [],
  }),
  decisionExplanation: createMachine<DecisionExplanationState>('drafted', ['archived'], {
    drafted: ['attached', 'archived'],
    attached: ['archived'],
    archived: [],
  }),
} as const;

