import { randomUUID } from 'node:crypto';

import type {
  EdpCommandEnvelope,
  EdpEventEnvelope,
  EdpQueryEnvelope,
  EdpResponseEnvelope,
} from '../contracts/envelopes.js';
import type { EdpCommandName } from '../contracts/commands.js';
import type { EdpEventName } from '../contracts/events.js';
import { edpEventPublisher } from '../domain/event-publisher.js';
import { createAuditRecord, createCorrelationRecord, createEventStoreRecord, createIdempotencyRecord, createOutboxRecord, createStoredAggregate, createVersionRecord } from '../domain/factories.js';
import type { EdpDomainService } from '../domain/services.js';
import type { EdpStoredAggregate } from '../contracts/persistence.js';
import type { EdpAggregateName } from '../domain/aggregates.js';
import { EdpContractViolationError } from '../domain/exceptions.js';
import { createCommandExecution, createQueryExecution } from './runtime-foundation.js';
import type { EdpUnitOfWork } from './unit-of-work.js';

type UseCaseContext = {
  tenantId: string;
  userId: string;
  correlationId?: string | null;
  causationId?: string | null;
  idempotencyKey?: string | null;
};

type AggregateRepo<TAggregate extends EdpStoredAggregate<EdpAggregateName, string>> = {
  findById(tenantId: string, aggregateId: string): Promise<TAggregate | null>;
  save(aggregate: TAggregate): Promise<TAggregate>;
};

type EventStoreRepositoryLike = {
  append(event: EdpEventEnvelope<EdpEventName, Record<string, unknown>>): Promise<unknown>;
};

type OutboxRepositoryLike = {
  enqueue(record: {
    tenantId: string;
    eventId: string;
    eventName: EdpEventName;
    aggregateId: string;
    aggregateType: string;
    availableAt: string;
    payload: Record<string, unknown>;
  }): Promise<unknown>;
};

type AuditTimelineRepositoryLike = {
  append(record: {
    tenantId: string;
    aggregateType: string;
    aggregateId: string;
    action: string;
    actorId: string;
    correlationId: string;
    occurredAt: string;
    payload: Record<string, unknown>;
  }): Promise<unknown>;
};

type CorrelationRepositoryLike = {
  upsert(record: {
    tenantId: string;
    correlationId: string;
    aggregateId?: string | null;
    aggregateType?: string | null;
    causationId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }): Promise<unknown>;
};

export interface EdpUseCaseDependencies {
  uow: EdpUnitOfWork;
  repositoryRegistry?: Readonly<{
    eventStoreRepository?: EventStoreRepositoryLike;
    outboxRepository?: OutboxRepositoryLike;
    auditTimelineRepository?: AuditTimelineRepositoryLike;
    correlationRepository?: CorrelationRepositoryLike;
  }>;
}

const requireTenantId = (tenantId: string): string => {
  if (!tenantId.trim()) {
    throw new EdpContractViolationError('Missing tenant context');
  }

  return tenantId;
};

const requireId = (value: string, label: string): string => {
  if (!value.trim()) {
    throw new EdpContractViolationError(`Missing ${label}`);
  }

  return value;
};

const withResponse = (
  tenantId: string,
  correlationId: string,
  payload: Record<string, unknown>,
): EdpResponseEnvelope<Record<string, unknown>> => ({
  responseId: randomUUID(),
  correlationId,
  tenantId,
  schemaVersion: '1',
  timestamp: new Date().toISOString(),
  success: true,
  data: payload,
});

const executeCommandUseCase = async (
  dependencies: EdpUseCaseDependencies,
  commandName: EdpCommandName,
  input: EdpCommandEnvelope,
): Promise<EdpResponseEnvelope<Record<string, unknown>>> => dependencies.uow.run(async () => {
  const result = await createCommandExecution(commandName, input);
  await dependencies.repositoryRegistry?.eventStoreRepository?.append(result.emittedEvent);
  await dependencies.repositoryRegistry?.outboxRepository?.enqueue(
    createOutboxRecord(
      result.emittedEvent.tenantId,
      result.emittedEvent.eventId,
      result.emittedEvent.name,
      result.emittedEvent.aggregateType,
      result.emittedEvent.aggregateId,
      result.emittedEvent.payload,
      result.emittedEvent.timestamp,
    ),
  );
  await dependencies.repositoryRegistry?.auditTimelineRepository?.append(
    createAuditRecord(
      result.emittedEvent.tenantId,
      result.emittedEvent.aggregateType,
      result.emittedEvent.aggregateId,
      result.emittedEvent.name,
      input.userId,
      input.correlationId,
      result.emittedEvent.payload,
    ),
  );
  await dependencies.repositoryRegistry?.correlationRepository?.upsert(
    createCorrelationRecord(
      result.emittedEvent.tenantId,
      result.emittedEvent.correlationId,
      result.emittedEvent.aggregateType,
      result.emittedEvent.aggregateId,
      input.causationId ?? result.emittedEvent.causationId ?? null,
      null,
      {
        commandId: input.commandId,
        commandName,
        eventId: result.emittedEvent.eventId,
        eventName: result.emittedEvent.name,
      },
    ),
  );

  return result.envelope;
});

export class CreateSimulationUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'CreateSimulation', input);
  }
}

export class UpdateSimulationInputUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'UpdateSimulationInput', input);
  }
}

export class CalculateSimulationUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'CalculateSimulation', input);
  }
}

export class GenerateProposalUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'GenerateProposal', input);
  }
}

export class RecommendDecisionUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'RecommendDecision', input);
  }
}

export class MaterializeOpportunityUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'MaterializeOpportunity', input);
  }
}

export class CreateOperationCandidateUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'CreateOperationCandidate', input);
  }
}

export class AcceptProposalUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'AcceptProposal', input);
  }
}

export class RejectProposalUseCase {
  constructor(private readonly dependencies: EdpUseCaseDependencies) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return executeCommandUseCase(this.dependencies, 'RejectProposal', input);
  }
}

export class EDPDecisionDomainService {
  constructor(private readonly domainService: EdpDomainService) {}

  getAggregateRepository<TAggregate extends EdpStoredAggregate<EdpAggregateName, string>>(
    aggregateType: TAggregate['aggregateType'],
  ): AggregateRepo<TAggregate> {
    const repository = this.domainService.getRepository(aggregateType);

    if (!repository) {
      throw new EdpContractViolationError(`Repository not registered for ${aggregateType}`);
    }

    return repository as unknown as AggregateRepo<TAggregate>;
  }
}

export interface EdpUseCaseBundle {
  createSimulation: CreateSimulationUseCase;
  updateSimulationInput: UpdateSimulationInputUseCase;
  calculateSimulation: CalculateSimulationUseCase;
  generateProposal: GenerateProposalUseCase;
  recommendDecision: RecommendDecisionUseCase;
  materializeOpportunity: MaterializeOpportunityUseCase;
  createOperationCandidate: CreateOperationCandidateUseCase;
  acceptProposal: AcceptProposalUseCase;
  rejectProposal: RejectProposalUseCase;
}

export function createEdpUseCases(uow: EdpUnitOfWork): EdpUseCaseBundle;
export function createEdpUseCases(dependencies: EdpUseCaseDependencies): EdpUseCaseBundle;
export function createEdpUseCases(
  uowOrDependencies: EdpUnitOfWork | EdpUseCaseDependencies,
): EdpUseCaseBundle {
  const dependencies = 'run' in uowOrDependencies
    ? { uow: uowOrDependencies }
    : uowOrDependencies;

  return {
    createSimulation: new CreateSimulationUseCase(dependencies),
    updateSimulationInput: new UpdateSimulationInputUseCase(dependencies),
    calculateSimulation: new CalculateSimulationUseCase(dependencies),
    generateProposal: new GenerateProposalUseCase(dependencies),
    recommendDecision: new RecommendDecisionUseCase(dependencies),
    materializeOpportunity: new MaterializeOpportunityUseCase(dependencies),
    createOperationCandidate: new CreateOperationCandidateUseCase(dependencies),
    acceptProposal: new AcceptProposalUseCase(dependencies),
    rejectProposal: new RejectProposalUseCase(dependencies),
  };
}
