import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createInMemoryEdpAggregateRepository,
  createInMemoryEdpAuditRepository,
  createInMemoryEdpCorrelationRepository,
  createInMemoryEdpEventStore,
  createInMemoryEdpIdempotencyRepository,
  createInMemoryEdpOutbox,
  createInMemoryEdpVersionRepository,
} from '../../modules/edp/infrastructure/in-memory/index.js';

const requiredTables = [
  'edp_decisions',
  'edp_decision_policies',
  'edp_decision_strategies',
  'edp_simulations',
  'edp_recommendations',
  'edp_proposals',
  'edp_provider_capabilities',
  'edp_provider_executions',
  'edp_operation_candidates',
  'edp_audit_timeline_events',
  'edp_event_store',
  'edp_outbox_messages',
  'edp_idempotency_records',
  'edp_correlation_records',
] as const;

const nowIso = '2026-07-01T00:00:00.000Z';

const createTenant = async (suffix: string) => ({
  id: randomUUID(),
  name: `EDP Memory Test ${suffix}`,
  domain: null,
});

const deleteTenant = async (_tenantId: string) => undefined;

const simulationAggregate = (tenantId: string, aggregateId: string, state: string, version = 1) => ({
  aggregateId,
  aggregateType: 'Simulation' as const,
  tenantId,
  version,
  state,
  payload: {
    requestedAmount: 10_000,
    term: 12,
  },
  createdAt: nowIso,
  updatedAt: nowIso,
});

describe('EDP persistence memory runtime', () => {
  const repositories = {
    Decision: createInMemoryEdpAggregateRepository<'Decision'>('Decision'),
    Simulation: createInMemoryEdpAggregateRepository<'Simulation'>('Simulation'),
    Proposal: createInMemoryEdpAggregateRepository<'Proposal'>('Proposal'),
    Recommendation: createInMemoryEdpAggregateRepository<'Recommendation'>('Recommendation'),
    ProviderCapability: createInMemoryEdpAggregateRepository<'ProviderCapability'>('ProviderCapability'),
    ProviderExecution: createInMemoryEdpAggregateRepository<'ProviderExecution'>('ProviderExecution'),
    OperationCandidate: createInMemoryEdpAggregateRepository<'OperationCandidate'>('OperationCandidate'),
    AuditTimeline: createInMemoryEdpAggregateRepository<'AuditTimeline'>('AuditTimeline'),
  };

  const versionRepositories = {
    DecisionPolicy: createInMemoryEdpVersionRepository(),
    DecisionStrategy: createInMemoryEdpVersionRepository(),
  };

  const eventStore = createInMemoryEdpEventStore();
  const outbox = createInMemoryEdpOutbox();
  const auditRepository = createInMemoryEdpAuditRepository();
  const idempotencyRepository = createInMemoryEdpIdempotencyRepository();
  const correlationRepository = createInMemoryEdpCorrelationRepository();

  afterEach(() => {
    // These repositories are intentionally local to the suite.
  });

  it('tracks the in-memory aggregate surfaces expected by the EDP contract', async () => {
    expect(Object.keys(repositories)).toEqual(
      expect.arrayContaining([
        'Decision',
        'Simulation',
        'Proposal',
        'Recommendation',
        'ProviderCapability',
        'ProviderExecution',
        'OperationCandidate',
        'AuditTimeline',
      ]),
    );

    expect(Object.keys(versionRepositories)).toEqual(
      expect.arrayContaining(['DecisionPolicy', 'DecisionStrategy']),
    );

    expect(requiredTables).toHaveLength(14);
  });

  it('persists simulation aggregates with tenant isolation', async () => {
    const tenantA = await createTenant('tenant-a');
    const tenantB = await createTenant('tenant-b');

    try {
      await repositories.Simulation.save(simulationAggregate(tenantA.id, 'sim-1', 'draft'));
      await repositories.Simulation.save(simulationAggregate(tenantB.id, 'sim-1', 'draft'));

      expect(await repositories.Simulation.findById(tenantA.id, 'sim-1')).toMatchObject({
        tenantId: tenantA.id,
        aggregateId: 'sim-1',
        aggregateType: 'Simulation',
      });
      expect(await repositories.Simulation.findById(tenantB.id, 'sim-1')).toMatchObject({
        tenantId: tenantB.id,
        aggregateId: 'sim-1',
      });
      expect(await repositories.Simulation.listByTenant(tenantA.id)).toHaveLength(1);
    } finally {
      await deleteTenant(tenantB.id);
      await deleteTenant(tenantA.id);
    }
  });

  it('round-trips policy and strategy version metadata in memory', async () => {
    const tenant = await createTenant('versions');

    try {
      await versionRepositories.DecisionPolicy.save({
        tenantId: tenant.id,
        aggregateType: 'DecisionPolicy',
        aggregateId: 'policy-1',
        version: 1,
        status: 'APPROVED',
        effectiveFrom: nowIso,
        effectiveTo: null,
        payload: {
          weights: { speed: 1 },
          approvedBy: 'approver-policy',
          approvedAt: nowIso,
          rollbackOf: 'policy-0',
        },
      });

      await versionRepositories.DecisionStrategy.save({
        tenantId: tenant.id,
        aggregateType: 'DecisionStrategy',
        aggregateId: 'strategy-1',
        version: 1,
        status: 'ACTIVE',
        effectiveFrom: nowIso,
        effectiveTo: null,
        payload: {
          objectives: ['conversion'],
          approvedBy: 'approver-strategy',
          approvedAt: nowIso,
          rollbackOf: 'strategy-0',
        },
      });

      expect(await versionRepositories.DecisionPolicy.findLatest(tenant.id, 'DecisionPolicy', 'policy-1')).toMatchObject({
        aggregateType: 'DecisionPolicy',
        aggregateId: 'policy-1',
        payload: {
          approvedBy: 'approver-policy',
          approvedAt: nowIso,
          rollbackOf: 'policy-0',
        },
      });

      expect(await versionRepositories.DecisionStrategy.findLatest(tenant.id, 'DecisionStrategy', 'strategy-1')).toMatchObject({
        aggregateType: 'DecisionStrategy',
        aggregateId: 'strategy-1',
        payload: {
          approvedBy: 'approver-strategy',
          approvedAt: nowIso,
          rollbackOf: 'strategy-0',
        },
      });
    } finally {
      await deleteTenant(tenant.id);
    }
  });

  it('stores event store, outbox, audit timeline, correlation and idempotency state in memory', async () => {
    const tenant = await createTenant('events');

    try {
      const eventId = randomUUID();

      const event = await eventStore.append({
        eventId,
        name: 'simulation.calculation.requested',
        version: '1',
        correlationId: 'corr-1',
        causationId: 'cause-1',
        tenantId: tenant.id,
        aggregateId: 'sim-1',
        aggregateType: 'Simulation Aggregate',
        timestamp: nowIso,
        payload: {
          simulationId: 'sim-1',
        },
        metadata: null,
        securityContext: null,
        auditContext: null,
      });

      const outboxEntry = await outbox.enqueue({
        tenantId: tenant.id,
        eventId: undefined as unknown as string,
        eventName: 'audit.event.recorded',
        aggregateId: 'timeline-1',
        aggregateType: 'Audit Timeline Aggregate',
        availableAt: nowIso,
        payload: {
          auditId: 'audit-1',
        },
      });

      const auditEntry = await auditRepository.append({
        tenantId: tenant.id,
        aggregateId: 'sim-1',
        aggregateType: 'Simulation',
        action: 'simulation.calculation.requested',
        correlationId: 'corr-1',
        actorId: 'user-1',
        occurredAt: nowIso,
        payload: {
          actor: 'user-1',
          action: 'simulation.calculation.requested',
        },
      });

      await idempotencyRepository.remember({
        idempotencyKey: 'idem-1',
        tenantId: tenant.id,
        owner: 'CreateSimulation',
        requestHash: 'hash-1',
        status: 'RECEIVED',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const processed = await idempotencyRepository.markProcessed(tenant.id, 'idem-1', 'response-1');
      const replay = await idempotencyRepository.findByKey(tenant.id, 'idem-1');
      await correlationRepository.upsert({
        correlationId: 'corr-1',
        tenantId: tenant.id,
        aggregateId: 'sim-1',
        aggregateType: 'Simulation',
        causationId: 'cause-1',
        metadata: { commandId: 'cmd-1' },
        createdAt: nowIso,
      });

      expect(event.version).toBe(1);
      expect(await eventStore.findByEventId(tenant.id, eventId)).toMatchObject({
        eventId,
        aggregateId: 'sim-1',
        tenantId: tenant.id,
      });
      expect(outboxEntry.status).toBe('PENDING');
      expect(auditEntry.action).toBe('simulation.calculation.requested');
      expect(processed?.responseId).toBe('response-1');
      expect(replay?.responseId).toBe('response-1');
      expect(await correlationRepository.findByCorrelationId(tenant.id, 'corr-1')).toMatchObject({
        aggregateId: 'sim-1',
      });
    } finally {
      await deleteTenant(tenant.id);
    }
  });
});
