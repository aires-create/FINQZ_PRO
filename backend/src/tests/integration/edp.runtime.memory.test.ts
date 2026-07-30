import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createEdpUseCases } from '../../modules/edp/application/use-cases.js';
import { InMemoryEdpUnitOfWork } from '../../modules/edp/application/unit-of-work.js';
import {
  createInMemoryEdpAuditRepository,
  createInMemoryEdpCorrelationRepository,
  createInMemoryEdpEventStore,
  createInMemoryEdpIdempotencyRepository,
  createInMemoryEdpOutbox,
} from '../../modules/edp/infrastructure/in-memory/index.js';

const tenantId = 'tenant-1';
const userId = 'user-1';
const nowIso = '2026-07-01T00:00:00.000Z';

const buildRepositoryRegistry = () => ({
  eventStoreRepository: createInMemoryEdpEventStore(),
  outboxRepository: createInMemoryEdpOutbox(),
  auditTimelineRepository: createInMemoryEdpAuditRepository(),
  correlationRepository: createInMemoryEdpCorrelationRepository(),
  idempotencyRepository: createInMemoryEdpIdempotencyRepository(),
});

const buildCommand = (overrides: Partial<Record<string, unknown>> = {}) => ({
  commandId: 'cmd-1',
  correlationId: 'corr-1',
  causationId: 'cause-1',
  tenantId,
  userId,
  actorType: 'user',
  source: 'memory-test-suite',
  aggregateId: 'sim-1',
  aggregateType: 'Simulation Aggregate',
  schemaVersion: '1',
  idempotencyKey: 'idem-1',
  timestamp: nowIso,
  metadata: { scenario: 'memory' },
  securityContext: null,
  auditContext: null,
  ...overrides,
});

describe('EDP runtime memory', () => {
  it('executes the command happy path with in-memory repositories', async () => {
    const repositoryRegistry = buildRepositoryRegistry();
    const useCases = createEdpUseCases({
      uow: new InMemoryEdpUnitOfWork(),
      repositoryRegistry,
    });

    const response = await useCases.createSimulation.execute(buildCommand());

    expect(response.success).toBe(true);
    expect(response.data).toEqual(
      expect.objectContaining({
        commandName: 'CreateSimulation',
        accepted: true,
      }),
    );
    expect(await repositoryRegistry.eventStoreRepository.listByAggregate(tenantId, 'sim-1')).toHaveLength(1);
    expect(await repositoryRegistry.outboxRepository.listPending(tenantId)).toHaveLength(1);
    expect(await repositoryRegistry.auditTimelineRepository.listByAggregate(tenantId, 'sim-1')).toHaveLength(1);
    expect(await repositoryRegistry.correlationRepository.findByCorrelationId(tenantId, 'corr-1')).toMatchObject({
      aggregateId: 'sim-1',
    });
    expect(await repositoryRegistry.idempotencyRepository.findByKey(tenantId, 'idem-1')).toMatchObject({
      status: 'PROCESSED',
    });
  });

  it('replays processed idempotency without reexecuting persistence', async () => {
    const repositoryRegistry = buildRepositoryRegistry();
    await repositoryRegistry.idempotencyRepository.remember({
      idempotencyKey: 'idem-processed',
      tenantId,
      owner: 'CreateSimulation',
      requestHash: 'hash-1',
      status: 'PROCESSED',
      responseId: 'response-processed-1',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const useCases = createEdpUseCases({
      uow: new InMemoryEdpUnitOfWork(),
      repositoryRegistry,
    });

    const response = await useCases.createSimulation.execute(
      buildCommand({
        commandId: 'cmd-processed',
        idempotencyKey: 'idem-processed',
        correlationId: 'corr-processed',
      }),
    );

    expect(response.success).toBe(true);
    expect(response.data).toEqual(
      expect.objectContaining({
        commandName: 'CreateSimulation',
        accepted: true,
        idempotent: true,
        replayed: true,
        responseId: 'response-processed-1',
      }),
    );
    expect(await repositoryRegistry.eventStoreRepository.listByAggregate(tenantId, 'sim-1')).toHaveLength(0);
    expect(await repositoryRegistry.idempotencyRepository.findByKey(tenantId, 'idem-processed')).toMatchObject({
      status: 'PROCESSED',
      responseId: 'response-processed-1',
    });
  });

  it('blocks in-flight idempotency duplicates', async () => {
    const repositoryRegistry = buildRepositoryRegistry();
    await repositoryRegistry.idempotencyRepository.remember({
      idempotencyKey: 'idem-received',
      tenantId,
      owner: 'CreateSimulation',
      requestHash: 'hash-1',
      status: 'RECEIVED',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const useCases = createEdpUseCases({
      uow: new InMemoryEdpUnitOfWork(),
      repositoryRegistry,
    });

    await expect(
      useCases.createSimulation.execute(
        buildCommand({
          commandId: 'cmd-received',
          idempotencyKey: 'idem-received',
          correlationId: 'corr-received',
        }),
      ),
    ).rejects.toThrow('Idempotency conflict');
  });

  it('rejects a controlled repository failure', async () => {
    const repositoryRegistry = buildRepositoryRegistry();
    repositoryRegistry.auditTimelineRepository.append = async () => {
      throw new Error('audit failure');
    };

    const useCases = createEdpUseCases({
      uow: new InMemoryEdpUnitOfWork(),
      repositoryRegistry,
    });

    await expect(useCases.createSimulation.execute(buildCommand({ idempotencyKey: `idem-${randomUUID()}` }))).rejects.toThrow('audit failure');
  });
});
