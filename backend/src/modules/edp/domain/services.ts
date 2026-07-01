import type {
  EdpAuditRepositoryContract,
  EdpCorrelationRepositoryContract,
  EdpEventStoreContract,
  EdpIdempotencyRepositoryContract,
  EdpOutboxContract,
  EdpRepositoryPort,
  EdpStoredAggregate,
  EdpVersionRepositoryContract,
} from '../contracts/persistence.js';
import type { EdpAggregateName } from './aggregates.js';

export interface EdpDomainServiceDependencies {
  eventStore: EdpEventStoreContract;
  outbox: EdpOutboxContract;
  auditRepository: EdpAuditRepositoryContract;
  correlationRepository: EdpCorrelationRepositoryContract;
  idempotencyRepository: EdpIdempotencyRepositoryContract;
  versionRepository: EdpVersionRepositoryContract;
}

export interface EdpRepositoryRegistry {
  Decision?: EdpRepositoryPort<EdpStoredAggregate<'Decision', string>>;
  Simulation?: EdpRepositoryPort<EdpStoredAggregate<'Simulation', string>>;
  DecisionPolicy?: EdpRepositoryPort<EdpStoredAggregate<'DecisionPolicy', string>>;
  DecisionStrategy?: EdpRepositoryPort<EdpStoredAggregate<'DecisionStrategy', string>>;
  Proposal?: EdpRepositoryPort<EdpStoredAggregate<'Proposal', string>>;
  Recommendation?: EdpRepositoryPort<EdpStoredAggregate<'Recommendation', string>>;
  ProviderCapability?: EdpRepositoryPort<EdpStoredAggregate<'ProviderCapability', string>>;
  ProviderExecution?: EdpRepositoryPort<EdpStoredAggregate<'ProviderExecution', string>>;
  OperationCandidate?: EdpRepositoryPort<EdpStoredAggregate<'OperationCandidate', string>>;
  AuditTimeline?: EdpRepositoryPort<EdpStoredAggregate<'AuditTimeline', string>>;
}

export class EdpDomainService {
  constructor(
    private readonly dependencies: EdpDomainServiceDependencies,
    private readonly repositories: EdpRepositoryRegistry,
  ) {}

  getRepository<TName extends EdpAggregateName>(aggregateType: TName) {
    return this.repositories[aggregateType as keyof EdpRepositoryRegistry] ?? null;
  }

  getDependencies() {
    return this.dependencies;
  }
}
