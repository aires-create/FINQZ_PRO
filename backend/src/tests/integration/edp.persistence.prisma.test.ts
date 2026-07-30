import { randomUUID } from 'node:crypto';

import { PrismaClient, Prisma } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaEdpUnitOfWork } from '../../modules/edp/application/unit-of-work.js';
import {
  AuditTimelineRepository,
  DecisionPolicyRepository,
  DecisionStrategyRepository,
  EventStoreRepository,
  IdempotencyRepository,
  OutboxRepository,
  SimulationRepository,
} from '../../modules/edp/infrastructure/prisma/index.js';

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

const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

const maskDatabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.host || 'unknown-host';
    const database = url.pathname.replace(/^\//, '') || 'unknown-db';

    return `${url.protocol}//${host}/${database}`;
  } catch {
    return 'invalid-database-url';
  }
};

if (databaseUrl) {
  console.info(`[EDP persistence runtime against Prisma/PostgreSQL] DATABASE_URL=${maskDatabaseUrl(databaseUrl)}`);
}

const canRunRealSuite = Boolean(databaseUrl);
const prisma = canRunRealSuite
  ? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  : null;

if (canRunRealSuite) {
  await prisma!.$connect();
}

const suite = canRunRealSuite ? describe : describe.skip;

const nowIso = '2026-07-01T00:00:00.000Z';

const createTenant = async (suffix: string) =>
  prisma!.tenant.create({
    data: {
      id: randomUUID(),
      name: `EDP Prisma Test ${suffix}`,
      domain: null,
    },
  });

const deleteTenant = async (tenantId: string) => {
  await prisma!.tenant.delete({
    where: { id: tenantId },
  });
};

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

suite('EDP persistence runtime against Prisma/PostgreSQL', () => {
  afterAll(async () => {
    if (canRunRealSuite) {
      await prisma!.$disconnect();
    }
  });

  it('confirms the migration created the expected EDP tables', async () => {
    for (const tableName of requiredTables) {
      const rows = await prisma!.$queryRaw<Array<{ regclass: string | null }>>(
        Prisma.sql`select to_regclass(${`public.${tableName}`})::text as regclass`,
      );

      expect(rows[0]?.regclass).toBe(tableName);
    }
  });

  it('persists simulation aggregates with tenant isolation', async () => {
    const tenantA = await createTenant('tenant-a');
    const tenantB = await createTenant('tenant-b');

    try {
      const repository = new SimulationRepository(prisma!);
      await repository.save(simulationAggregate(tenantA.id, 'sim-1', 'draft'));
      await repository.save(simulationAggregate(tenantB.id, 'sim-1', 'draft'));

      expect(await repository.findById(tenantA.id, 'sim-1')).toMatchObject({
        tenantId: tenantA.id,
        aggregateId: 'sim-1',
        aggregateType: 'Simulation',
      });
      expect(await repository.findById(tenantB.id, 'sim-1')).toMatchObject({
        tenantId: tenantB.id,
        aggregateId: 'sim-1',
      });
      expect(await repository.listByTenant(tenantA.id)).toHaveLength(1);
    } finally {
      await deleteTenant(tenantB.id);
      await deleteTenant(tenantA.id);
    }
  });

  it('round-trips policy and strategy version metadata', async () => {
    const tenant = await createTenant('versions');

    try {
      const policyRepository = new DecisionPolicyRepository(prisma!);
      const strategyRepository = new DecisionStrategyRepository(prisma!);

      await policyRepository.save({
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

      await strategyRepository.save({
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

      expect(await policyRepository.findLatest(tenant.id, 'DecisionPolicy', 'policy-1')).toMatchObject({
        aggregateType: 'DecisionPolicy',
        aggregateId: 'policy-1',
        payload: {
          approvedBy: 'approver-policy',
          approvedAt: nowIso,
          rollbackOf: 'policy-0',
          configSnapshot: {
            weights: { speed: 1 },
          },
        },
      });

      expect(await strategyRepository.findLatest(tenant.id, 'DecisionStrategy', 'strategy-1')).toMatchObject({
        aggregateType: 'DecisionStrategy',
        aggregateId: 'strategy-1',
        payload: {
          approvedBy: 'approver-strategy',
          approvedAt: nowIso,
          rollbackOf: 'strategy-0',
          configSnapshot: {
            objectives: ['conversion'],
          },
        },
      });
    } finally {
      await deleteTenant(tenant.id);
    }
  });

  it('persists event store, outbox, audit timeline and idempotency replay', async () => {
    const tenant = await createTenant('events');

    try {
      const eventStore = new EventStoreRepository(prisma!);
      const outbox = new OutboxRepository(prisma!);
      const auditRepository = new AuditTimelineRepository(prisma!);
      const idempotencyRepository = new IdempotencyRepository(prisma!);

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
        auditId: 'audit-1',
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

      expect(event.version).toBe(1);
      expect(await eventStore.findByEventId(tenant.id, eventId)).toMatchObject({
        eventId,
        eventName: 'simulation.calculation.requested',
        version: 1,
      });
      expect(outboxEntry.status).toBe('PENDING');
      expect((await outbox.listPending(tenant.id))).toHaveLength(1);
      expect(auditEntry.action).toBe('simulation.calculation.requested');
      expect(await auditRepository.listByAggregate(tenant.id, 'sim-1')).toHaveLength(1);
      expect(processed?.responseId).toBe('response-1');
      expect(replay?.responseId).toBe('response-1');
    } finally {
      await deleteTenant(tenant.id);
    }
  });

  it('supports transaction rollback through the Prisma unit of work', async () => {
    const tenant = await createTenant('rollback');

    try {
      const unitOfWork = new PrismaEdpUnitOfWork(prisma!);
      const repository = new SimulationRepository(prisma!);

      await expect(
        unitOfWork.run(async (transaction) => {
          const transactionalRepository = new SimulationRepository(transaction);
          await transactionalRepository.save(simulationAggregate(tenant.id, 'sim-rollback', 'draft'));
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');

      expect(await repository.findById(tenant.id, 'sim-rollback')).toBeNull();
    } finally {
      await deleteTenant(tenant.id);
    }
  });
});
