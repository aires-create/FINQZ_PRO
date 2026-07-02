import { describe, expect, it, vi } from 'vitest';

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

describe('createEdpUseCases', () => {
  it('runs commands inside the unit of work without touching the repository registry in this wave', async () => {
    const run = vi.fn(async <T>(action: (transaction: never) => Promise<T>) => action(undefined as never));
    const unitOfWork = { run } as EdpUnitOfWork;
    const repositoryRegistry = new Proxy(
      {},
      {
        get() {
          throw new Error('repository registry should not be accessed in this wave');
        },
      },
    );

    const useCases = createEdpUseCases({
      uow: unitOfWork,
      repositoryRegistry,
    });

    const response = await useCases.createSimulation.execute(buildCommandEnvelope() as never);

    expect(run).toHaveBeenCalledTimes(1);
    expect(response.success).toBe(true);
    expect(response.data.commandName).toBe('CreateSimulation');
    expect(response.data.accepted).toBe(true);
  });
});
