import { describe, expect, it } from 'vitest';

import {
  createInMemoryEdpAggregateRepository,
  createInMemoryEdpAuditRepository,
  createInMemoryEdpCorrelationRepository,
  createInMemoryEdpEventStore,
  createInMemoryEdpIdempotencyRepository,
  createInMemoryEdpOutbox,
  createInMemoryEdpRepositoryRegistry,
  createInMemoryEdpVersionRepository,
} from '../../modules/edp/infrastructure/index.js';
import { createStoredAggregate, createCorrelationRecord, createIdempotencyRecord, createVersionRecord } from '../../modules/edp/domain/factories.js';
import { createEdpUseCases } from '../../modules/edp/application/use-cases.js';
import { InMemoryEdpUnitOfWork } from '../../modules/edp/application/unit-of-work.js';
import { EdpDomainService } from '../../modules/edp/domain/services.js';
import { edpEventPublisher } from '../../modules/edp/domain/event-publisher.js';
import { createCommandExecution } from '../../modules/edp/application/runtime-foundation.js';

const buildCommandEnvelope = (overrides: Record<string, unknown> = {}) => ({
  commandId: 'cmd-1',
  correlationId: 'corr-1',
  causationId: 'cause-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  actorType: 'user',
  source: 'test-suite',
  aggregateId: 'agg-1',
  aggregateType: 'Simulation Aggregate',
  schemaVersion: '1',
  idempotencyKey: 'idem-1',
  timestamp: '2026-07-01T00:00:00.000Z',
  metadata: null,
  securityContext: null,
  auditContext: null,
  ...overrides,
});

describe('EDP capability layer', () => {
  it('persists aggregates in memory by tenant and aggregate id', async () => {
    const repository = createInMemoryEdpAggregateRepository(
      'Decision' as const,
    );
    const snapshot = createStoredAggregate(
      'Decision',
      'tenant-1',
      'decision-1',
      'recommended',
      { policyVersion: 'pv-1' },
    );

    await repository.save(snapshot);

    expect(await repository.findById('tenant-1', 'decision-1')).toEqual(snapshot);
    expect(await repository.listByTenant('tenant-1')).toHaveLength(1);
  });

  it('tracks event store versions and canonical names', async () => {
    const eventStore = createInMemoryEdpEventStore();
    const published = await edpEventPublisher.publish({
      eventId: 'event-1',
      name: 'simulation.created',
      version: '1',
      correlationId: 'corr-1',
      tenantId: 'tenant-1',
      aggregateId: 'agg-1',
      aggregateType: 'Simulation Aggregate',
      timestamp: '2026-07-01T00:00:00.000Z',
      payload: { simulationId: 'sim-1' },
      securityContext: null,
      auditContext: null,
    });

    const stored = await eventStore.append(published);

    expect(stored.version).toBe(1);
    expect(await eventStore.findByEventId('tenant-1', 'event-1')).not.toBeNull();
    expect(await eventStore.listByAggregate('tenant-1', 'agg-1')).toHaveLength(1);
  });

  it('tracks outbox lifecycle independently from event store', async () => {
    const outbox = createInMemoryEdpOutbox();
    const record = await outbox.enqueue({
      tenantId: 'tenant-1',
      eventId: 'event-1',
      eventName: 'audit.event.recorded',
      aggregateId: 'agg-1',
      aggregateType: 'Audit Timeline Aggregate',
      availableAt: '2026-07-01T00:00:00.000Z',
      payload: { action: 'recorded' },
    });

    expect(record.status).toBe('PENDING');
    expect(await outbox.listPending('tenant-1')).toHaveLength(1);
    expect((await outbox.markProcessed('tenant-1', 'event-1'))?.status).toBe('PROCESSED');
    expect((await outbox.markFailed('tenant-1', 'event-1'))?.status).toBe('FAILED');
  });

  it('stores correlation, idempotency, version and audit records', async () => {
    const correlationRepository = createInMemoryEdpCorrelationRepository();
    const idempotencyRepository = createInMemoryEdpIdempotencyRepository();
    const versionRepository = createInMemoryEdpVersionRepository();
    const auditRepository = createInMemoryEdpAuditRepository();

    await correlationRepository.upsert(
      createCorrelationRecord('tenant-1', 'corr-1', 'Decision', 'decision-1', 'req-1', 'cause-1'),
    );
    await idempotencyRepository.remember(
      createIdempotencyRecord('tenant-1', 'idem-1', 'CreateSimulation', 'hash-1'),
    );
    await versionRepository.save(
      createVersionRecord('tenant-1', 'DecisionPolicy', 'policy-1', 1, 'APPROVED'),
    );
    await versionRepository.save(
      createVersionRecord('tenant-1', 'DecisionPolicy', 'policy-1', 2, 'ACTIVE'),
    );
    await auditRepository.append({
      auditId: 'audit-1',
      tenantId: 'tenant-1',
      aggregateId: 'decision-1',
      aggregateType: 'Decision',
      action: 'decision.recommended',
      correlationId: 'corr-1',
      actorId: 'user-1',
      occurredAt: '2026-07-01T00:00:00.000Z',
      payload: { status: 'recommended' },
    });

    expect(await correlationRepository.findByCorrelationId('tenant-1', 'corr-1')).not.toBeNull();
    expect(await idempotencyRepository.findByKey('tenant-1', 'idem-1')).not.toBeNull();
    expect((await versionRepository.findLatest('tenant-1', 'DecisionPolicy', 'policy-1'))?.version).toBe(2);
    expect(await auditRepository.listByAggregate('tenant-1', 'decision-1')).toHaveLength(1);
  });

  it('runs the unit of work and returns canonical envelopes from use cases', async () => {
    const unitOfWork = new InMemoryEdpUnitOfWork();
    const useCases = createEdpUseCases(unitOfWork);
    const command = buildCommandEnvelope();

    const response = await useCases.createSimulation.execute(command);

    expect(response.success).toBe(true);
    expect(response.data.commandName).toBe('CreateSimulation');
    expect(response.data.accepted).toBe(true);
  });

  it('exposes repository registry and domain service coordination', () => {
    const repositories = createInMemoryEdpRepositoryRegistry();
    const domainService = new EdpDomainService(
      {
        eventStore: createInMemoryEdpEventStore(),
        outbox: createInMemoryEdpOutbox(),
        auditRepository: createInMemoryEdpAuditRepository(),
        correlationRepository: createInMemoryEdpCorrelationRepository(),
        idempotencyRepository: createInMemoryEdpIdempotencyRepository(),
        versionRepository: createInMemoryEdpVersionRepository(),
      },
      repositories,
    );

    expect(domainService.getRepository('Decision')).toBeTruthy();
    expect(domainService.getDependencies().eventStore).toBeTruthy();
  });

  it('supports placeholder command execution from the runtime foundation', async () => {
    const result = await createCommandExecution('CalculateSimulation', buildCommandEnvelope());

    expect(result.envelope.success).toBe(true);
    expect(result.emittedEvent.name).toBe('simulation.calculation.requested');
  });

  it('keeps SelectOffer aligned to ranking selection instead of final decision recommendation', async () => {
    const result = await createCommandExecution(
      'SelectOffer',
      buildCommandEnvelope({
        aggregateType: 'Ranking / Decision Aggregate',
      }),
    );

    expect(result.envelope.success).toBe(true);
    expect(result.emittedEvent.name).toBe('simulation.offer.selected');
    expect(result.envelope.data.emittedEvents).toEqual(['simulation.offer.selected']);
  });
});
