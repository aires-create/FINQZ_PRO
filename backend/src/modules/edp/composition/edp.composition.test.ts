import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';

import { createEdpComposition } from './edp.composition.js';

describe('createEdpComposition', () => {
  it('creates the EDP composition skeleton without executing runtime work', () => {
    const prismaClient = {} as PrismaClient;

    const composition = createEdpComposition({ prismaClient });

    expect(composition.unitOfWork).toBeDefined();
    expect(typeof composition.unitOfWork.run).toBe('function');
    expect(composition.decisionRuntime).toBeDefined();
    expect(composition.repositoryRegistry).toBeDefined();
    expect(composition.useCases).toBeDefined();
    expect(composition.useCases.createSimulation).toBeDefined();
    expect(composition.decisionRuntime.unitOfWork).toBe(composition.unitOfWork);
    expect(composition.decisionRuntime.repositoryRegistry).toBe(composition.repositoryRegistry);
    expect(composition.decisionRuntime.useCases.decisionEngine).toBeDefined();
    expect(composition.repositoryRegistry.decisionRepository).toBeDefined();
    expect(composition.repositoryRegistry.eventStoreRepository).toBeDefined();
    expect(composition.repositoryRegistry.outboxRepository).toBeDefined();
    expect(composition.repositoryRegistry.idempotencyRepository).toBeDefined();
    expect(composition.repositoryRegistry.correlationRepository).toBeDefined();
  });
});
