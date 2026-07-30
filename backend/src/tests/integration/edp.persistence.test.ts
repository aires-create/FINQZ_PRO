import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaEdpUnitOfWork } from '../../modules/edp/application/unit-of-work.js';
import {
  AuditTimelineRepository,
  CorrelationRepository,
  DecisionPolicyRepository,
  DecisionRepository,
  DecisionStrategyRepository,
  EventStoreRepository,
  IdempotencyRepository,
  OperationCandidateRepository,
  OutboxRepository,
  ProposalRepository,
  RecommendationRepository,
  SimulationRepository,
} from '../../modules/edp/infrastructure/prisma/index.js';

type FakeState = {
  edpDecision: Map<string, any>;
  edpDecisionPolicy: Map<string, any>;
  edpDecisionStrategy: Map<string, any>;
  edpSimulation: Map<string, any>;
  edpRecommendation: Map<string, any>;
  edpProposal: Map<string, any>;
  edpProviderCapability: Map<string, any>;
  edpProviderExecution: Map<string, any>;
  edpOperationCandidate: Map<string, any>;
  edpAuditTimelineEvent: Map<string, any>;
  edpEventStore: Map<string, any>;
  edpOutboxMessage: Map<string, any>;
  edpIdempotencyRecord: Map<string, any>;
  edpCorrelationRecord: Map<string, any>;
};

type FakeClient = ReturnType<typeof createFakePrismaClient>;

const now = () => new Date('2026-07-01T00:00:00.000Z');

const aggregateKey = (tenantId: string, aggregateId: string) => `${tenantId}|${aggregateId}`;
const versionKey = (tenantId: string, aggregateId: string, version: number) => `${tenantId}|${aggregateId}|${version}`;
const idempotencyKey = (tenantId: string, key: string) => `${tenantId}|${key}`;
const correlationKey = (tenantId: string, key: string) => `${tenantId}|${key}`;

const createInitialState = (): FakeState => ({
  edpDecision: new Map(),
  edpDecisionPolicy: new Map(),
  edpDecisionStrategy: new Map(),
  edpSimulation: new Map(),
  edpRecommendation: new Map(),
  edpProposal: new Map(),
  edpProviderCapability: new Map(),
  edpProviderExecution: new Map(),
  edpOperationCandidate: new Map(),
  edpAuditTimelineEvent: new Map(),
  edpEventStore: new Map(),
  edpOutboxMessage: new Map(),
  edpIdempotencyRecord: new Map(),
  edpCorrelationRecord: new Map(),
});

const cloneState = (state: FakeState): FakeState => structuredClone(state);

const matchesWhere = (row: Record<string, any>, where: Record<string, any>) => {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }

    if (value === null) {
      return row[key] === null || row[key] === undefined;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return matchesWhere(row[key] ?? {}, value);
    }

    return row[key] === value;
  });
};

const makeAggregateTable = (state: FakeState, table: keyof FakeState) => ({
  findFirst: async ({ where }: { where: Record<string, any> }) => {
    const values = [...state[table].values()];
    return values.find((row) => matchesWhere(row, where)) ?? null;
  },
  findMany: async ({ where }: { where: Record<string, any> }) => {
    return [...state[table].values()].filter((row) => matchesWhere(row, where));
  },
  upsert: async ({ where, create, update }: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
    const key = aggregateKey(where.tenantId_aggregateId.tenantId, where.tenantId_aggregateId.aggregateId);
    const existing = state[table].get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: new Date() }
      : { ...create, createdAt: create.createdAt ?? now(), updatedAt: create.updatedAt ?? now() };

    state[table].set(key, row);
    return row;
  },
});

const makeVersionTable = (state: FakeState, table: keyof FakeState) => ({
  findFirst: async ({ where, orderBy }: { where: Record<string, any>; orderBy?: Record<string, any> }) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    if (orderBy?.version === 'desc') {
      rows.sort((a, b) => b.version - a.version);
    } else {
      rows.sort((a, b) => a.version - b.version);
    }
    return rows[0] ?? null;
  },
  findMany: async ({ where, orderBy }: { where: Record<string, any>; orderBy?: Record<string, any> }) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    if (orderBy?.version === 'desc') {
      rows.sort((a, b) => b.version - a.version);
    } else {
      rows.sort((a, b) => a.version - b.version);
    }
    return rows;
  },
  upsert: async ({ where, create, update }: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
    const key = versionKey(where.tenantId_aggregateId_version.tenantId, where.tenantId_aggregateId_version.aggregateId, where.tenantId_aggregateId_version.version);
    const existing = state[table].get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: new Date() }
      : { ...create, createdAt: now(), updatedAt: now() };

    state[table].set(key, row);
    return row;
  },
});

const makeEventStoreTable = (state: FakeState) => ({
  findFirst: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpEventStore.values()].find((row) => matchesWhere(row, where)) ?? null;
  },
  findMany: async ({ where, orderBy }: { where: Record<string, any>; orderBy?: Record<string, any> }) => {
    const rows = [...state.edpEventStore.values()].filter((row) => matchesWhere(row, where));
    if (orderBy?.aggregateVersion === 'desc') {
      rows.sort((a, b) => b.aggregateVersion - a.aggregateVersion);
    } else {
      rows.sort((a, b) => a.aggregateVersion - b.aggregateVersion);
    }
    return rows;
  },
  create: async ({ data }: { data: Record<string, any> }) => {
    const row = {
      eventId: data.eventId ?? randomUUID(),
      ...data,
      createdAt: data.createdAt ?? now(),
    };
    state.edpEventStore.set(row.eventId, row);
    return row;
  },
});

const makeOutboxTable = (state: FakeState) => ({
  create: async ({ data }: { data: Record<string, any> }) => {
    const row = {
      id: data.id ?? randomUUID(),
      ...data,
      createdAt: data.createdAt ?? now(),
      updatedAt: data.updatedAt ?? now(),
    };
    state.edpOutboxMessage.set(row.id, row);
    return row;
  },
  findMany: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpOutboxMessage.values()].filter((row) => matchesWhere(row, where));
  },
  findFirst: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpOutboxMessage.values()].find((row) => matchesWhere(row, where)) ?? null;
  },
  update: async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
    const row = state.edpOutboxMessage.get(where.id);
    if (!row) {
      throw new Error('outbox row missing');
    }

    const updated = { ...row, ...data, updatedAt: now() };
    state.edpOutboxMessage.set(where.id, updated);
    return updated;
  },
});

const makeAuditTable = (state: FakeState) => ({
  create: async ({ data }: { data: Record<string, any> }) => {
    const row = {
      id: data.id ?? randomUUID(),
      ...data,
      createdAt: data.createdAt ?? now(),
      updatedAt: data.updatedAt ?? now(),
    };
    state.edpAuditTimelineEvent.set(row.id, row);
    return row;
  },
  findMany: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpAuditTimelineEvent.values()].filter((row) => matchesWhere(row, where));
  },
});

const makeIdempotencyTable = (state: FakeState) => ({
  upsert: async ({ where, create, update }: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
    const key = idempotencyKey(where.tenantId_idempotencyKey.tenantId, where.tenantId_idempotencyKey.idempotencyKey);
    const existing = state.edpIdempotencyRecord.get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: now() }
      : { ...create, createdAt: now(), updatedAt: now() };

    state.edpIdempotencyRecord.set(key, row);
    return row;
  },
  findFirst: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpIdempotencyRecord.values()].find((row) => matchesWhere(row, where)) ?? null;
  },
  update: async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
    const row = [...state.edpIdempotencyRecord.values()].find((entry) => entry.id === where.id);
    if (!row) {
      throw new Error('idempotency row missing');
    }

    const updated = { ...row, ...data, updatedAt: now() };
    state.edpIdempotencyRecord.set(idempotencyKey(updated.tenantId, updated.idempotencyKey), updated);
    return updated;
  },
});

const makeCorrelationTable = (state: FakeState) => ({
  upsert: async ({ where, create, update }: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
    const key = correlationKey(where.tenantId_correlationId.tenantId, where.tenantId_correlationId.correlationId);
    const existing = state.edpCorrelationRecord.get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: now() }
      : { ...create, createdAt: now(), updatedAt: now() };

    state.edpCorrelationRecord.set(key, row);
    return row;
  },
  findFirst: async ({ where }: { where: Record<string, any> }) => {
    return [...state.edpCorrelationRecord.values()].find((row) => matchesWhere(row, where)) ?? null;
  },
});

const createFakePrismaClient = (seed?: Partial<FakeState>) => {
  let state = { ...createInitialState(), ...seed } as FakeState;

  const buildClient = () => ({
    edpDecision: makeAggregateTable(state, 'edpDecision'),
    edpDecisionPolicy: makeVersionTable(state, 'edpDecisionPolicy'),
    edpDecisionStrategy: makeVersionTable(state, 'edpDecisionStrategy'),
    edpSimulation: makeAggregateTable(state, 'edpSimulation'),
    edpRecommendation: makeAggregateTable(state, 'edpRecommendation'),
    edpProposal: makeAggregateTable(state, 'edpProposal'),
    edpProviderCapability: makeAggregateTable(state, 'edpProviderCapability'),
    edpProviderExecution: makeAggregateTable(state, 'edpProviderExecution'),
    edpOperationCandidate: makeAggregateTable(state, 'edpOperationCandidate'),
    edpAuditTimelineEvent: makeAuditTable(state),
    edpEventStore: makeEventStoreTable(state),
    edpOutboxMessage: makeOutboxTable(state),
    edpIdempotencyRecord: makeIdempotencyTable(state),
    edpCorrelationRecord: makeCorrelationTable(state),
    $transaction: async <T>(action: (transaction: ReturnType<typeof buildClient>) => Promise<T>) => {
      const snapshot = cloneState(state);
      const txClient = createFakePrismaClient(snapshot);

      try {
        const result = await action(txClient);
        state = snapshot;
        return result;
      } catch (error) {
        throw error;
      }
    },
  });

  return buildClient();
};

const buildSimulationAggregate = (tenantId: string, aggregateId: string, state: string, version = 1) => ({
  aggregateId,
  aggregateType: 'Simulation' as const,
  tenantId,
  version,
  state,
  payload: {
    requestedAmount: 10_000,
    term: 12,
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
});

const buildProposalAggregate = (tenantId: string, aggregateId: string, state: string, version = 1) => ({
  aggregateId,
  aggregateType: 'Proposal' as const,
  tenantId,
  version,
  state,
  payload: {
    simulationId: 'sim-1',
    decisionId: 'decision-1',
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
});

describe('EDP persistence runtime', () => {
  it('persists simulation aggregates with tenant isolation', async () => {
    const client = createFakePrismaClient();
    const repository = new SimulationRepository(client as never);

    const first = buildSimulationAggregate('tenant-a', 'sim-1', 'draft');
    const second = buildSimulationAggregate('tenant-b', 'sim-1', 'draft');

    await repository.save(first);
    await repository.save(second);

    expect(await repository.findById('tenant-a', 'sim-1')).toMatchObject({
      tenantId: 'tenant-a',
      aggregateId: 'sim-1',
      aggregateType: 'Simulation',
    });
    expect(await repository.findById('tenant-b', 'sim-1')).toMatchObject({
      tenantId: 'tenant-b',
      aggregateId: 'sim-1',
    });
    expect(await repository.listByTenant('tenant-a')).toHaveLength(1);
  });

  it('persists policy and strategy versions', async () => {
    const client = createFakePrismaClient();
    const policyRepository = new DecisionPolicyRepository(client as never);
    const strategyRepository = new DecisionStrategyRepository(client as never);

    await policyRepository.save({
      tenantId: 'tenant-a',
      aggregateType: 'DecisionPolicy',
      aggregateId: 'policy-1',
      version: 1,
      status: 'APPROVED',
      effectiveFrom: '2026-07-01T00:00:00.000Z',
      effectiveTo: null,
      payload: {
        weights: { speed: 1 },
      },
    });

    await strategyRepository.save({
      tenantId: 'tenant-a',
      aggregateType: 'DecisionStrategy',
      aggregateId: 'strategy-1',
      version: 1,
      status: 'ACTIVE',
      effectiveFrom: '2026-07-01T00:00:00.000Z',
      effectiveTo: null,
      payload: {
        objectives: ['conversion'],
      },
    });

    expect((await policyRepository.findLatest('tenant-a', 'DecisionPolicy', 'policy-1'))?.status).toBe('APPROVED');
    expect((await strategyRepository.findLatest('tenant-a', 'DecisionStrategy', 'strategy-1'))?.status).toBe('ACTIVE');
  });

  it('persists proposal aggregates and operation candidates', async () => {
    const client = createFakePrismaClient();
    const proposalRepository = new ProposalRepository(client as never);
    const candidateRepository = new OperationCandidateRepository(client as never);

    await proposalRepository.save(buildProposalAggregate('tenant-a', 'proposal-1', 'generated'));
    await candidateRepository.save({
      aggregateId: 'candidate-1',
      aggregateType: 'OperationCandidate',
      tenantId: 'tenant-a',
      version: 1,
      state: 'created',
      payload: { proposalId: 'proposal-1' },
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(await proposalRepository.findById('tenant-a', 'proposal-1')).not.toBeNull();
    expect(await candidateRepository.findById('tenant-a', 'candidate-1')).not.toBeNull();
  });

  it('appends event store and audit timeline entries', async () => {
    const client = createFakePrismaClient();
    const eventStore = new EventStoreRepository(client as never);
    const auditRepository = new AuditTimelineRepository(client as never);

    const event = await eventStore.append({
      eventId: 'event-1',
      name: 'simulation.calculation.requested',
      version: '1',
      correlationId: 'corr-1',
      causationId: 'cause-1',
      tenantId: 'tenant-a',
      aggregateId: 'sim-1',
      aggregateType: 'Simulation Aggregate',
      timestamp: '2026-07-01T00:00:00.000Z',
      payload: {
        simulationId: 'sim-1',
      },
      metadata: null,
      securityContext: null,
      auditContext: null,
    });

    await auditRepository.append({
      auditId: 'audit-1',
      tenantId: 'tenant-a',
      aggregateId: 'sim-1',
      aggregateType: 'Simulation',
      action: 'simulation.calculation.requested',
      correlationId: 'corr-1',
      actorId: 'user-1',
      occurredAt: '2026-07-01T00:00:00.000Z',
      payload: {
        actor: 'user-1',
        action: 'simulation.calculation.requested',
      },
    });

    expect(event.version).toBe(1);
    expect(await eventStore.findByEventId('tenant-a', 'event-1')).not.toBeNull();
    expect(await auditRepository.listByAggregate('tenant-a', 'sim-1')).toHaveLength(1);
  });

  it('persists outbox, idempotency and correlation records', async () => {
    const client = createFakePrismaClient();
    const outboxRepository = new OutboxRepository(client as never);
    const idempotencyRepository = new IdempotencyRepository(client as never);
    const correlationRepository = new CorrelationRepository(client as never);

    const outbox = await outboxRepository.enqueue({
      tenantId: 'tenant-a',
      eventId: 'event-1',
      eventName: 'audit.event.recorded',
      aggregateId: 'sim-1',
      aggregateType: 'Audit Timeline Aggregate',
      availableAt: '2026-07-01T00:00:00.000Z',
      payload: {
        auditId: 'audit-1',
      },
    });

    await idempotencyRepository.remember({
      idempotencyKey: 'idem-1',
      tenantId: 'tenant-a',
      owner: 'CreateSimulation',
      requestHash: 'hash-1',
      status: 'RECEIVED',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });
    await correlationRepository.upsert({
      correlationId: 'corr-1',
      tenantId: 'tenant-a',
      aggregateId: 'sim-1',
      aggregateType: 'Simulation',
      requestId: 'req-1',
      causationId: 'cause-1',
      metadata: { source: 'test' },
      createdAt: '2026-07-01T00:00:00.000Z',
    });

    expect(outbox.status).toBe('PENDING');
    expect((await outboxRepository.listPending('tenant-a'))).toHaveLength(1);
    expect((await idempotencyRepository.findByKey('tenant-a', 'idem-1'))?.owner).toBe('CreateSimulation');
    expect((await correlationRepository.findByCorrelationId('tenant-a', 'corr-1'))?.aggregateId).toBe('sim-1');
  });

  it('supports idempotency replay and transaction rollback', async () => {
    const client = createFakePrismaClient();
    const idempotencyRepository = new IdempotencyRepository(client as never);
    const unitOfWork = new PrismaEdpUnitOfWork(client as never);

    await idempotencyRepository.remember({
      idempotencyKey: 'idem-rollback',
      tenantId: 'tenant-a',
      owner: 'CreateSimulation',
      requestHash: 'hash-rollback',
      status: 'RECEIVED',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });
    const replay = await idempotencyRepository.findByKey('tenant-a', 'idem-rollback');

    expect(replay?.requestHash).toBe('hash-rollback');

    await expect(
      unitOfWork.run(async (transaction) => {
        const transactionalSimulationRepository = new SimulationRepository(transaction as never);
        await transactionalSimulationRepository.save(buildSimulationAggregate('tenant-a', 'sim-rollback', 'draft'));
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    const verificationRepository = new SimulationRepository(client as never);
    expect(await verificationRepository.findById('tenant-a', 'sim-rollback')).toBeNull();
  });
});
