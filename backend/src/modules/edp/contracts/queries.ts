export const EDP_QUERY_NAMES = [
  'GetSimulation',
  'ListSimulations',
  'GetOfferRanking',
  'GetRecommendation',
  'GetDecision',
  'GetDecisionExplanation',
  'GetProposal',
  'ListProposalsByOpportunity',
  'GetProposalTimeline',
  'GetDecisionTimeline',
  'GetProviderCapabilities',
  'GetDecisionPolicies',
  'GetDecisionStrategies',
  'GetPolicyVersion',
  'GetStrategyVersion',
  'GetOperationCandidate',
  'GetAuditTimeline',
] as const;

export type EdpQueryName = (typeof EDP_QUERY_NAMES)[number];

export interface EdpQueryDefinition {
  name: EdpQueryName;
  readModel: string;
  owner: string;
}

export const EDP_QUERY_CATALOG = [
  { name: 'GetSimulation', readModel: 'Simulation Read Model', owner: 'Simulation' },
  { name: 'ListSimulations', readModel: 'Simulation List Read Model', owner: 'Simulation' },
  { name: 'GetOfferRanking', readModel: 'Ranking Read Model', owner: 'Ranking' },
  { name: 'GetRecommendation', readModel: 'Recommendation Read Model', owner: 'Recommendation' },
  { name: 'GetDecision', readModel: 'Decision Read Model', owner: 'Decision' },
  { name: 'GetDecisionExplanation', readModel: 'Explanation Read Model', owner: 'DecisionExplanation' },
  { name: 'GetProposal', readModel: 'Proposal Read Model', owner: 'Proposal' },
  { name: 'ListProposalsByOpportunity', readModel: 'Proposal List Read Model', owner: 'Proposal' },
  { name: 'GetProposalTimeline', readModel: 'Timeline Read Model', owner: 'Proposal' },
  { name: 'GetDecisionTimeline', readModel: 'Timeline Read Model', owner: 'AuditTimeline' },
  { name: 'GetProviderCapabilities', readModel: 'Provider Capability Read Model', owner: 'ProviderCapability' },
  { name: 'GetDecisionPolicies', readModel: 'Decision Policy Read Model', owner: 'DecisionPolicy' },
  { name: 'GetDecisionStrategies', readModel: 'Decision Strategy Read Model', owner: 'DecisionStrategy' },
  { name: 'GetPolicyVersion', readModel: 'Policy Version Read Model', owner: 'DecisionPolicy' },
  { name: 'GetStrategyVersion', readModel: 'Strategy Version Read Model', owner: 'DecisionStrategy' },
  { name: 'GetOperationCandidate', readModel: 'Operation Candidate Read Model', owner: 'OperationCandidate' },
  { name: 'GetAuditTimeline', readModel: 'Audit Timeline Read Model', owner: 'AuditTimeline' },
] as const satisfies readonly EdpQueryDefinition[];
