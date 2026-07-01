import type { EdpEventName } from './events.js';

export const EDP_COMMAND_NAMES = [
  'CreateSimulation',
  'UpdateSimulationInput',
  'CalculateSimulation',
  'SelectOffer',
  'GenerateProposal',
  'SendProposal',
  'RevokeProposal',
  'AcceptProposal',
  'RejectProposal',
  'ExpireProposal',
  'RecommendDecision',
  'OverrideDecision',
  'MaterializeOpportunity',
  'CreateOperationCandidate',
  'CreateDecisionPolicy',
  'ApproveDecisionPolicy',
  'ActivateDecisionPolicy',
  'RollbackDecisionPolicy',
  'CreateDecisionStrategy',
  'ApproveDecisionStrategy',
  'ActivateDecisionStrategy',
  'RollbackDecisionStrategy',
  'RegisterProviderCapability',
  'DeprecateProviderCapability',
] as const;

export type EdpCommandName = (typeof EDP_COMMAND_NAMES)[number];

export interface EdpCommandDefinition {
  name: EdpCommandName;
  aggregateType: string;
  owner: string;
  primaryEvent: EdpEventName;
  emittedEvents: readonly EdpEventName[];
  querySideEffect?: string | null;
}

export const EDP_COMMAND_CATALOG = [
  {
    name: 'CreateSimulation',
    aggregateType: 'Simulation Aggregate',
    owner: 'Simulation',
    primaryEvent: 'simulation.created',
    emittedEvents: ['simulation.created'],
  },
  {
    name: 'UpdateSimulationInput',
    aggregateType: 'Simulation Aggregate',
    owner: 'Simulation',
    primaryEvent: 'simulation.input.updated',
    emittedEvents: ['simulation.input.updated'],
  },
  {
    name: 'CalculateSimulation',
    aggregateType: 'Simulation Aggregate',
    owner: 'Simulation',
    primaryEvent: 'simulation.calculation.requested',
    emittedEvents: ['simulation.calculation.requested', 'simulation.calculated'],
  },
  {
    name: 'SelectOffer',
    aggregateType: 'Ranking / Decision Aggregate',
    owner: 'Ranking',
    primaryEvent: 'simulation.offer.selected',
    emittedEvents: ['simulation.offer.selected'],
  },
  {
    name: 'GenerateProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.generated',
    emittedEvents: ['proposal.generated'],
  },
  {
    name: 'SendProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.sent',
    emittedEvents: ['proposal.sent'],
  },
  {
    name: 'RevokeProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.revoked',
    emittedEvents: ['proposal.revoked'],
  },
  {
    name: 'AcceptProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.accepted',
    emittedEvents: ['proposal.accepted'],
  },
  {
    name: 'RejectProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.rejected',
    emittedEvents: ['proposal.rejected'],
  },
  {
    name: 'ExpireProposal',
    aggregateType: 'Proposal Aggregate',
    owner: 'Proposal',
    primaryEvent: 'proposal.expired',
    emittedEvents: ['proposal.expired'],
  },
  {
    name: 'RecommendDecision',
    aggregateType: 'Decision Aggregate',
    owner: 'Decision',
    primaryEvent: 'decision.recommended',
    emittedEvents: ['decision.recommended'],
  },
  {
    name: 'OverrideDecision',
    aggregateType: 'Decision Aggregate',
    owner: 'Decision',
    primaryEvent: 'decision.overridden',
    emittedEvents: ['decision.overridden'],
  },
  {
    name: 'MaterializeOpportunity',
    aggregateType: 'OperationCandidate Aggregate',
    owner: 'OperationCandidate',
    primaryEvent: 'operation_candidate.created',
    emittedEvents: ['operation_candidate.created'],
  },
  {
    name: 'CreateOperationCandidate',
    aggregateType: 'OperationCandidate Aggregate',
    owner: 'OperationCandidate',
    primaryEvent: 'operation_candidate.created',
    emittedEvents: ['operation_candidate.created'],
  },
  {
    name: 'CreateDecisionPolicy',
    aggregateType: 'DecisionPolicy Aggregate',
    owner: 'DecisionPolicy',
    primaryEvent: 'policy.version.created',
    emittedEvents: ['policy.version.created'],
  },
  {
    name: 'ApproveDecisionPolicy',
    aggregateType: 'DecisionPolicy Aggregate',
    owner: 'DecisionPolicy',
    primaryEvent: 'policy.version.approved',
    emittedEvents: ['policy.version.approved'],
  },
  {
    name: 'ActivateDecisionPolicy',
    aggregateType: 'DecisionPolicy Aggregate',
    owner: 'DecisionPolicy',
    primaryEvent: 'policy.version.activated',
    emittedEvents: ['policy.version.activated'],
  },
  {
    name: 'RollbackDecisionPolicy',
    aggregateType: 'DecisionPolicy Aggregate',
    owner: 'DecisionPolicy',
    primaryEvent: 'policy.version.rollbacked',
    emittedEvents: ['policy.version.rollbacked'],
  },
  {
    name: 'CreateDecisionStrategy',
    aggregateType: 'DecisionStrategy Aggregate',
    owner: 'DecisionStrategy',
    primaryEvent: 'strategy.version.created',
    emittedEvents: ['strategy.version.created'],
  },
  {
    name: 'ApproveDecisionStrategy',
    aggregateType: 'DecisionStrategy Aggregate',
    owner: 'DecisionStrategy',
    primaryEvent: 'strategy.version.approved',
    emittedEvents: ['strategy.version.approved'],
  },
  {
    name: 'ActivateDecisionStrategy',
    aggregateType: 'DecisionStrategy Aggregate',
    owner: 'DecisionStrategy',
    primaryEvent: 'strategy.version.activated',
    emittedEvents: ['strategy.version.activated'],
  },
  {
    name: 'RollbackDecisionStrategy',
    aggregateType: 'DecisionStrategy Aggregate',
    owner: 'DecisionStrategy',
    primaryEvent: 'strategy.version.rollbacked',
    emittedEvents: ['strategy.version.rollbacked'],
  },
  {
    name: 'RegisterProviderCapability',
    aggregateType: 'ProviderCapability Aggregate',
    owner: 'ProviderCapability',
    primaryEvent: 'provider.capability.registered',
    emittedEvents: ['provider.capability.registered'],
  },
  {
    name: 'DeprecateProviderCapability',
    aggregateType: 'ProviderCapability Aggregate',
    owner: 'ProviderCapability',
    primaryEvent: 'provider.capability.deprecated',
    emittedEvents: ['provider.capability.deprecated'],
  },
] as const satisfies readonly EdpCommandDefinition[];
