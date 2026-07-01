import { randomUUID } from 'node:crypto';

import type {
  EdpCommandEnvelope,
  EdpEventEnvelope,
  EdpQueryEnvelope,
  EdpResponseEnvelope,
} from '../contracts/envelopes.js';
import { edpEventPublisher } from '../domain/event-publisher.js';
import { createAuditRecord, createCorrelationRecord, createEventStoreRecord, createIdempotencyRecord, createOutboxRecord, createStoredAggregate, createVersionRecord } from '../domain/factories.js';
import type { EdpDomainService } from '../domain/services.js';
import type { EdpStoredAggregate } from '../contracts/persistence.js';
import type { EdpAggregateName } from '../domain/aggregates.js';
import { EdpContractViolationError } from '../domain/exceptions.js';
import { createCommandExecution, createQueryExecution } from './runtime-foundation.js';
import type { EdpUnitOfWork } from './unit-of-work.js';
import type { EdpTransactionBoundary } from './transaction-boundary.js';

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

export class CreateSimulationUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => {
      const result = await createCommandExecution('CreateSimulation', input);
      return result.envelope;
    });
  }
}

export class UpdateSimulationInputUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('UpdateSimulationInput', input)).envelope);
  }
}

export class CalculateSimulationUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('CalculateSimulation', input)).envelope);
  }
}

export class GenerateProposalUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('GenerateProposal', input)).envelope);
  }
}

export class RecommendDecisionUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('RecommendDecision', input)).envelope);
  }
}

export class MaterializeOpportunityUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('MaterializeOpportunity', input)).envelope);
  }
}

export class CreateOperationCandidateUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('CreateOperationCandidate', input)).envelope);
  }
}

export class AcceptProposalUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('AcceptProposal', input)).envelope);
  }
}

export class RejectProposalUseCase {
  constructor(private readonly uow: EdpUnitOfWork) {}

  async execute(input: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>> {
    return this.uow.run(async () => (await createCommandExecution('RejectProposal', input)).envelope);
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

export const createEdpUseCases = (uow: EdpUnitOfWork): EdpUseCaseBundle => ({
  createSimulation: new CreateSimulationUseCase(uow),
  updateSimulationInput: new UpdateSimulationInputUseCase(uow),
  calculateSimulation: new CalculateSimulationUseCase(uow),
  generateProposal: new GenerateProposalUseCase(uow),
  recommendDecision: new RecommendDecisionUseCase(uow),
  materializeOpportunity: new MaterializeOpportunityUseCase(uow),
  createOperationCandidate: new CreateOperationCandidateUseCase(uow),
  acceptProposal: new AcceptProposalUseCase(uow),
  rejectProposal: new RejectProposalUseCase(uow),
});

