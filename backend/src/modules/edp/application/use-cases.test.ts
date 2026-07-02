import { describe, expect, it, vi } from 'vitest';

import { createQueryExecution } from './runtime-foundation.js';
import { createEdpUseCases } from './use-cases.js';
import type { EdpUnitOfWork } from './unit-of-work.js';

const buildCommandEnvelope = () => ({
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
});

const buildQueryEnvelope = () => ({
  queryId: 'qry-1',
  correlationId: 'corr-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  actorType: 'user',
  source: 'test-suite',
  schemaVersion: '1',
  timestamp: '2026-07-01T00:00:00.000Z',
});

describe('createEdpUseCases', () => {
  it('persists exactly one emitted event, one outbox record, one audit record and one correlation record inside the unit of work', async () => {
    let inTransaction = false;
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => {
      inTransaction = true;

      try {
        return await action(undefined as never);
      } finally {
        inTransaction = false;
      }
    });
    const append = vi.fn(async () => {
      if (!inTransaction) {
        throw new Error('event store append must happen inside the unit of work');
      }
    });
    const enqueue = vi.fn(async () => {
      if (!inTransaction) {
        throw new Error('outbox enqueue must happen inside the unit of work');
      }
    });
    const auditAppend = vi.fn(async () => {
      if (!inTransaction) {
        throw new Error('audit append must happen inside the unit of work');
      }
    });
    const correlationUpsert = vi.fn(async () => {
      if (!inTransaction) {
        throw new Error('correlation upsert must happen inside the unit of work');
      }
    });
    const unitOfWork = { run } as EdpUnitOfWork;
    const repositoryRegistry = new Proxy(
      {
        eventStoreRepository: {
          append,
        },
        outboxRepository: {
          enqueue,
        },
        auditTimelineRepository: {
          append: auditAppend,
        },
        correlationRepository: {
          upsert: correlationUpsert,
        },
      },
      {
        get(target, property, receiver) {
          if (property === 'eventStoreRepository') {
            return Reflect.get(target, property, receiver);
          }

          if (property === 'outboxRepository') {
            return Reflect.get(target, property, receiver);
          }

          if (property === 'auditTimelineRepository') {
            return Reflect.get(target, property, receiver);
          }

          if (property === 'correlationRepository') {
            return Reflect.get(target, property, receiver);
          }

          throw new Error(`repository registry should not access ${String(property)} in this wave`);
        },
      },
    );

    const useCases = createEdpUseCases({
      uow: unitOfWork,
      repositoryRegistry,
    });

    const response = await useCases.createSimulation.execute(buildCommandEnvelope() as never);

    expect(run).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(auditAppend).toHaveBeenCalledTimes(1);
    expect(correlationUpsert).toHaveBeenCalledTimes(1);
    expect(response.success).toBe(true);
    expect(response.data.commandName).toBe('CreateSimulation');
    expect(response.data.accepted).toBe(true);
  });

  it('propagates correlation failures and aborts the command', async () => {
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => action(undefined as never));
    const append = vi.fn(async () => undefined);
    const enqueue = vi.fn(async () => undefined);
    const auditAppend = vi.fn(async () => undefined);
    const correlationUpsert = vi.fn(async () => {
      throw new Error('correlation unavailable');
    });
    const idempotencyRepository = {
      remember: vi.fn(),
      findByKey: vi.fn(),
      markProcessed: vi.fn(),
    };
    const unitOfWork = { run } as EdpUnitOfWork;
    const repositoryRegistry = {
      eventStoreRepository: {
        append,
      },
      outboxRepository: {
        enqueue,
      },
      auditTimelineRepository: {
        append: auditAppend,
      },
      correlationRepository: {
        upsert: correlationUpsert,
      },
      idempotencyRepository,
    };

    const useCases = createEdpUseCases({
      uow: unitOfWork,
      repositoryRegistry,
    });

    await expect(useCases.createSimulation.execute(buildCommandEnvelope() as never)).rejects.toThrow(
      'correlation unavailable',
    );
    expect(run).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(auditAppend).toHaveBeenCalledTimes(1);
    expect(correlationUpsert).toHaveBeenCalledTimes(1);
    expect(idempotencyRepository.remember).not.toHaveBeenCalled();
    expect(idempotencyRepository.findByKey).not.toHaveBeenCalled();
    expect(idempotencyRepository.markProcessed).not.toHaveBeenCalled();
  });

  it('keeps queries free from event store, outbox, audit and correlation persistence', async () => {
    const append = vi.fn();
    const enqueue = vi.fn();
    const auditAppend = vi.fn();
    const correlationUpsert = vi.fn();
    const idempotencyRepository = {
      remember: vi.fn(),
      findByKey: vi.fn(),
      markProcessed: vi.fn(),
    };

    const result = await createQueryExecution('GetAuditTimeline' as never, buildQueryEnvelope() as never);

    expect(result.envelope.success).toBe(true);
    expect(append).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(auditAppend).not.toHaveBeenCalled();
    expect(correlationUpsert).not.toHaveBeenCalled();
    expect(idempotencyRepository.remember).not.toHaveBeenCalled();
    expect(idempotencyRepository.findByKey).not.toHaveBeenCalled();
    expect(idempotencyRepository.markProcessed).not.toHaveBeenCalled();
  });
});
