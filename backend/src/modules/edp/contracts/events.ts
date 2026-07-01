export const EDP_EVENT_NAMES = [
  'simulation.created',
  'simulation.input.updated',
  'simulation.calculation.requested',
  'simulation.calculated',
  'simulation.offer.generated',
  'simulation.offer.selected',
  'decision.recommended',
  'decision.overridden',
  'proposal.generated',
  'proposal.sent',
  'proposal.revoked',
  'proposal.accepted',
  'proposal.rejected',
  'proposal.expired',
  'policy.version.created',
  'policy.version.approved',
  'policy.version.activated',
  'policy.version.rollbacked',
  'strategy.version.created',
  'strategy.version.approved',
  'strategy.version.activated',
  'strategy.version.rollbacked',
  'provider.capability.registered',
  'provider.capability.deprecated',
  'provider.attempted',
  'provider.succeeded',
  'provider.failed',
  'operation_candidate.created',
  'audit.event.recorded',
] as const;

export type EdpEventName = (typeof EDP_EVENT_NAMES)[number];

export interface EdpEventDefinition {
  name: EdpEventName;
  domainOwner: string;
  aggregateOwner: string;
  version: string;
  trigger: string;
  aggregateType: string;
}

export const EDP_EVENT_CATALOG = [
  { name: 'simulation.created', domainOwner: 'Simulation', aggregateOwner: 'Simulation Aggregate', version: '1', trigger: 'Simulation request accepted', aggregateType: 'Simulation Aggregate' },
  { name: 'simulation.input.updated', domainOwner: 'Simulation', aggregateOwner: 'Simulation Aggregate', version: '1', trigger: 'Simulation input updated', aggregateType: 'Simulation Aggregate' },
  { name: 'simulation.calculation.requested', domainOwner: 'Simulation', aggregateOwner: 'Simulation Aggregate', version: '1', trigger: 'Simulation calculation requested', aggregateType: 'Simulation Aggregate' },
  { name: 'simulation.calculated', domainOwner: 'Simulation', aggregateOwner: 'Simulation Aggregate', version: '1', trigger: 'Simulation calculation completed', aggregateType: 'Simulation Aggregate' },
  { name: 'simulation.offer.generated', domainOwner: 'Simulation', aggregateOwner: 'Simulation Aggregate', version: '1', trigger: 'Offer derived from simulation', aggregateType: 'Simulation Aggregate' },
  { name: 'simulation.offer.selected', domainOwner: 'Ranking', aggregateOwner: 'Ranking Aggregate', version: '1', trigger: 'Ranking finalized', aggregateType: 'Ranking Aggregate' },
  { name: 'decision.recommended', domainOwner: 'Decision', aggregateOwner: 'Decision Aggregate', version: '1', trigger: 'Decision core produced recommendation', aggregateType: 'Decision Aggregate' },
  { name: 'decision.overridden', domainOwner: 'Decision', aggregateOwner: 'Decision Aggregate', version: '1', trigger: 'Authorized override applied', aggregateType: 'Decision Aggregate' },
  { name: 'proposal.generated', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal snapshot created', aggregateType: 'Proposal Aggregate' },
  { name: 'proposal.sent', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal shared through safe channel', aggregateType: 'Proposal Aggregate' },
  { name: 'proposal.revoked', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal revoked', aggregateType: 'Proposal Aggregate' },
  { name: 'proposal.accepted', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal accepted', aggregateType: 'Proposal Aggregate' },
  { name: 'proposal.rejected', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal rejected', aggregateType: 'Proposal Aggregate' },
  { name: 'proposal.expired', domainOwner: 'Proposal', aggregateOwner: 'Proposal Aggregate', version: '1', trigger: 'Proposal expired by validity window', aggregateType: 'Proposal Aggregate' },
  { name: 'policy.version.created', domainOwner: 'DecisionPolicy', aggregateOwner: 'DecisionPolicy Aggregate', version: '1', trigger: 'Policy version created', aggregateType: 'DecisionPolicy Aggregate' },
  { name: 'policy.version.approved', domainOwner: 'DecisionPolicy', aggregateOwner: 'DecisionPolicy Aggregate', version: '1', trigger: 'Policy approved', aggregateType: 'DecisionPolicy Aggregate' },
  { name: 'policy.version.activated', domainOwner: 'DecisionPolicy', aggregateOwner: 'DecisionPolicy Aggregate', version: '1', trigger: 'Policy activated', aggregateType: 'DecisionPolicy Aggregate' },
  { name: 'policy.version.rollbacked', domainOwner: 'DecisionPolicy', aggregateOwner: 'DecisionPolicy Aggregate', version: '1', trigger: 'Policy rollback executed', aggregateType: 'DecisionPolicy Aggregate' },
  { name: 'strategy.version.created', domainOwner: 'DecisionStrategy', aggregateOwner: 'DecisionStrategy Aggregate', version: '1', trigger: 'Strategy version created', aggregateType: 'DecisionStrategy Aggregate' },
  { name: 'strategy.version.approved', domainOwner: 'DecisionStrategy', aggregateOwner: 'DecisionStrategy Aggregate', version: '1', trigger: 'Strategy approved', aggregateType: 'DecisionStrategy Aggregate' },
  { name: 'strategy.version.activated', domainOwner: 'DecisionStrategy', aggregateOwner: 'DecisionStrategy Aggregate', version: '1', trigger: 'Strategy activated', aggregateType: 'DecisionStrategy Aggregate' },
  { name: 'strategy.version.rollbacked', domainOwner: 'DecisionStrategy', aggregateOwner: 'DecisionStrategy Aggregate', version: '1', trigger: 'Strategy rollback executed', aggregateType: 'DecisionStrategy Aggregate' },
  { name: 'provider.capability.registered', domainOwner: 'ProviderCapability', aggregateOwner: 'ProviderCapability Aggregate', version: '1', trigger: 'Capability registered', aggregateType: 'ProviderCapability Aggregate' },
  { name: 'provider.capability.deprecated', domainOwner: 'ProviderCapability', aggregateOwner: 'ProviderCapability Aggregate', version: '1', trigger: 'Capability deprecated', aggregateType: 'ProviderCapability Aggregate' },
  { name: 'provider.attempted', domainOwner: 'ProviderExecution', aggregateOwner: 'ProviderExecution Aggregate', version: '1', trigger: 'Provider call started', aggregateType: 'ProviderExecution Aggregate' },
  { name: 'provider.succeeded', domainOwner: 'ProviderExecution', aggregateOwner: 'ProviderExecution Aggregate', version: '1', trigger: 'Provider call succeeded', aggregateType: 'ProviderExecution Aggregate' },
  { name: 'provider.failed', domainOwner: 'ProviderExecution', aggregateOwner: 'ProviderExecution Aggregate', version: '1', trigger: 'Provider call failed', aggregateType: 'ProviderExecution Aggregate' },
  { name: 'operation_candidate.created', domainOwner: 'OperationCandidate', aggregateOwner: 'OperationCandidate Aggregate', version: '1', trigger: 'Operation candidate created', aggregateType: 'OperationCandidate Aggregate' },
  { name: 'audit.event.recorded', domainOwner: 'Audit Center', aggregateOwner: 'Audit Timeline Aggregate', version: '1', trigger: 'Auditable activity occurred', aggregateType: 'Audit Timeline Aggregate' },
] as const satisfies readonly EdpEventDefinition[];
