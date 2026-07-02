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
  it('processes a new command with idempotency reservation and all persistence writes inside the unit of work', async () => {
    let inTransaction = false;
    const steps: string[] = [];
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => {
      inTransaction = true;

      try {
        return await action(undefined as never);
      } finally {
        inTransaction = false;
      }
    });
    const findByKey = vi.fn(async () => {
      steps.push('findByKey');
      if (!inTransaction) {
        throw new Error('idempotency lookup must happen inside the unit of work');
      }

      return null;
    });
    const remember = vi.fn(async () => {
      steps.push('remember');
      if (!inTransaction) {
        throw new Error('idempotency remember must happen inside the unit of work');
      }
    });
    const markProcessed = vi.fn(async () => {
      steps.push('markProcessed');
      if (!inTransaction) {
        throw new Error('idempotency markProcessed must happen inside the unit of work');
      }
    });
    const append = vi.fn(async () => {
      steps.push('eventStore');
      if (!inTransaction) {
        throw new Error('event store append must happen inside the unit of work');
      }
    });
    const enqueue = vi.fn(async () => {
      steps.push('outbox');
      if (!inTransaction) {
        throw new Error('outbox enqueue must happen inside the unit of work');
      }
    });
    const auditAppend = vi.fn(async () => {
      steps.push('audit');
      if (!inTransaction) {
        throw new Error('audit append must happen inside the unit of work');
      }
    });
    const correlationUpsert = vi.fn(async () => {
      steps.push('correlation');
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
        idempotencyRepository: {
          findByKey,
          remember,
          markProcessed,
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

          if (property === 'idempotencyRepository') {
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
    expect(findByKey).toHaveBeenCalledTimes(1);
    expect(remember).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(auditAppend).toHaveBeenCalledTimes(1);
    expect(correlationUpsert).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledTimes(1);
    expect(steps.indexOf('findByKey')).toBeLessThan(steps.indexOf('remember'));
    expect(steps.indexOf('remember')).toBeLessThan(steps.indexOf('eventStore'));
    expect(steps.indexOf('eventStore')).toBeLessThan(steps.indexOf('outbox'));
    expect(steps.indexOf('outbox')).toBeLessThan(steps.indexOf('audit'));
    expect(steps.indexOf('audit')).toBeLessThan(steps.indexOf('correlation'));
    expect(steps.indexOf('correlation')).toBeLessThan(steps.indexOf('markProcessed'));
    expect(response.success).toBe(true);
    expect(response.data.commandName).toBe('CreateSimulation');
    expect(response.data.accepted).toBe(true);
  });

  it('fails fast on received duplicates without reexecuting persistence', async () => {
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => action(undefined as never));
    const findByKey = vi.fn(async () => ({
      idempotencyKey: 'idem-1',
      tenantId: 'tenant-1',
      owner: 'CreateSimulation',
      requestHash: 'cmd-1',
      status: 'RECEIVED' as const,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }));
    const append = vi.fn(async () => undefined);
    const enqueue = vi.fn(async () => undefined);
    const auditAppend = vi.fn(async () => undefined);
    const correlationUpsert = vi.fn(async () => undefined);
    const remember = vi.fn(async () => undefined);
    const markProcessed = vi.fn(async () => undefined);
    const useCases = createEdpUseCases({
      uow: { run } as EdpUnitOfWork,
      repositoryRegistry: {
        idempotencyRepository: {
          findByKey,
          remember,
          markProcessed,
        },
        eventStoreRepository: { append },
        outboxRepository: { enqueue },
        auditTimelineRepository: { append: auditAppend },
        correlationRepository: { upsert: correlationUpsert },
      },
    });

    await expect(useCases.createSimulation.execute(buildCommandEnvelope() as never)).rejects.toThrow(
      'Idempotency conflict',
    );
    expect(findByKey).toHaveBeenCalledTimes(1);
    expect(remember).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(auditAppend).not.toHaveBeenCalled();
    expect(correlationUpsert).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('short-circuits processed duplicates without reexecuting persistence', async () => {
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => action(undefined as never));
    const findByKey = vi.fn(async () => ({
      idempotencyKey: 'idem-1',
      tenantId: 'tenant-1',
      owner: 'CreateSimulation',
      requestHash: 'cmd-1',
      status: 'PROCESSED' as const,
      responseId: 'response-1',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }));
    const append = vi.fn(async () => undefined);
    const enqueue = vi.fn(async () => undefined);
    const auditAppend = vi.fn(async () => undefined);
    const correlationUpsert = vi.fn(async () => undefined);
    const remember = vi.fn(async () => undefined);
    const markProcessed = vi.fn(async () => undefined);
    const useCases = createEdpUseCases({
      uow: { run } as EdpUnitOfWork,
      repositoryRegistry: {
        idempotencyRepository: {
          findByKey,
          remember,
          markProcessed,
        },
        eventStoreRepository: { append },
        outboxRepository: { enqueue },
        auditTimelineRepository: { append: auditAppend },
        correlationRepository: { upsert: correlationUpsert },
      },
    });

    const response = await useCases.createSimulation.execute(buildCommandEnvelope() as never);

    expect(findByKey).toHaveBeenCalledTimes(1);
    expect(remember).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(auditAppend).not.toHaveBeenCalled();
    expect(correlationUpsert).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
  });

  it('propagates correlation failures and aborts the command', async () => {
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => action(undefined as never));
    const findByKey = vi.fn(async () => null);
    const remember = vi.fn(async () => undefined);
    const append = vi.fn(async () => undefined);
    const enqueue = vi.fn(async () => undefined);
    const auditAppend = vi.fn(async () => undefined);
    const correlationUpsert = vi.fn(async () => {
      throw new Error('correlation unavailable');
    });
    const markProcessed = vi.fn(async () => undefined);
    const unitOfWork = { run } as EdpUnitOfWork;
    const repositoryRegistry = {
      idempotencyRepository: {
        findByKey,
        remember,
        markProcessed,
      },
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
    };

    const useCases = createEdpUseCases({
      uow: unitOfWork,
      repositoryRegistry,
    });

    await expect(useCases.createSimulation.execute(buildCommandEnvelope() as never)).rejects.toThrow(
      'correlation unavailable',
    );
    expect(run).toHaveBeenCalledTimes(1);
    expect(findByKey).toHaveBeenCalledTimes(1);
    expect(remember).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(auditAppend).toHaveBeenCalledTimes(1);
    expect(correlationUpsert).toHaveBeenCalledTimes(1);
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('keeps queries free from event store, outbox, audit and correlation persistence', async () => {
    const append = vi.fn();
    const enqueue = vi.fn();
    const auditAppend = vi.fn();
    const correlationUpsert = vi.fn();
    const findByKey = vi.fn();
    const remember = vi.fn();
    const markProcessed = vi.fn();
    const idempotencyRepository = {
      findByKey,
      remember: vi.fn(),
      markProcessed,
    };

    const result = await createQueryExecution('GetAuditTimeline' as never, buildQueryEnvelope() as never);

    expect(result.envelope.success).toBe(true);
    expect(append).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(auditAppend).not.toHaveBeenCalled();
    expect(correlationUpsert).not.toHaveBeenCalled();
    expect(findByKey).not.toHaveBeenCalled();
    expect(remember).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });
});
