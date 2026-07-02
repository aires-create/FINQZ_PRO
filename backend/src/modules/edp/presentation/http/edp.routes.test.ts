import { describe, expect, it, vi } from 'vitest';

import type { EdpComposition } from '../../composition/edp.composition.js';
import { createEdpController } from './edp.controller.js';
import { edpRoutes } from './edp.routes.js';

const createEdpCompositionMock = vi.hoisted(() => vi.fn());

vi.mock('../../composition/index.js', () => ({
  createEdpComposition: createEdpCompositionMock,
}));

describe('EDP HTTP adoption', () => {
  it('uses an injected composition without recreating it', async () => {
    const composition = {
      repositoryRegistry: {
        decisionRepository: {},
        eventStoreRepository: {},
        outboxRepository: {},
        idempotencyRepository: {},
        correlationRepository: {},
      },
      unitOfWork: {
        run: vi.fn(),
      },
    } as unknown as EdpComposition;
    const app = {
      addHook: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    };

    await edpRoutes(app as never, { composition });

    expect(createEdpCompositionMock).not.toHaveBeenCalled();
    expect(app.addHook).toHaveBeenCalledTimes(8);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.post).toHaveBeenCalledTimes(2);
  });

  it('creates the EDP composition once when no composition is provided', async () => {
    const composition = {
      repositoryRegistry: {
        decisionRepository: {},
        eventStoreRepository: {},
        outboxRepository: {},
        idempotencyRepository: {},
        correlationRepository: {},
      },
      unitOfWork: {
        run: vi.fn(),
      },
    } as unknown as EdpComposition;
    const app = {
      addHook: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    };

    createEdpCompositionMock.mockReset();
    createEdpCompositionMock.mockReturnValueOnce(composition);

    await edpRoutes(app as never);

    expect(createEdpCompositionMock).toHaveBeenCalledTimes(1);
    expect(app.addHook).toHaveBeenCalledTimes(8);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.post).toHaveBeenCalledTimes(2);
  });

  it('accepts an already composed dependency graph in the controller factory', () => {
    const composition = {
      repositoryRegistry: {
        decisionRepository: {},
        eventStoreRepository: {},
        outboxRepository: {},
        idempotencyRepository: {},
        correlationRepository: {},
      },
      unitOfWork: {
        run: vi.fn(),
      },
    } as unknown as EdpComposition;
    const controller = createEdpController({ composition });

    expect(controller.runtime).toBeTypeOf('function');
    expect(controller.handleCommand).toBeTypeOf('function');
    expect(controller.handleQuery).toBeTypeOf('function');
  });
});
