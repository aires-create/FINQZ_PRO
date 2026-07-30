import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { PrismaEdpUnitOfWork } from '../application/unit-of-work.js';
import { createPrismaEdpRepositoryRegistry } from '../infrastructure/prisma/repositories.js';
import { createDecisionRuntimeComposition, createDecisionRuntimeUseCases } from './decision-runtime.composition.js';

describe('decision runtime skeleton', () => {
  it('creates an isolated decision runtime composition that reuses the H20 boundary objects', () => {
    const prismaClient = {
      $transaction: async (action: (transaction: never) => Promise<unknown>) => action(undefined as never),
    } as unknown as PrismaClient;
    const unitOfWork = new PrismaEdpUnitOfWork(prismaClient);
    const repositoryRegistry = createPrismaEdpRepositoryRegistry(prismaClient);

    const composition = createDecisionRuntimeComposition({
      unitOfWork,
      repositoryRegistry,
    });

    expect(composition.unitOfWork).toBe(unitOfWork);
    expect(composition.repositoryRegistry).toBe(repositoryRegistry);
    expect(composition.useCases.decisionContext).toBeDefined();
    expect(composition.useCases.policyEvaluation).toBeDefined();
    expect(composition.useCases.strategyResolution).toBeDefined();
    expect(composition.useCases.decisionEngine).toBeDefined();
    expect(composition.useCases.decisionResult).toBeDefined();
  });

  it('creates the skeleton use case bundle without triggering runtime work', () => {
    const prismaClient = {
      $transaction: async (action: (transaction: never) => Promise<unknown>) => action(undefined as never),
    } as unknown as PrismaClient;
    const unitOfWork = new PrismaEdpUnitOfWork(prismaClient);
    const repositoryRegistry = createPrismaEdpRepositoryRegistry(prismaClient);

    const useCases = createDecisionRuntimeUseCases({
      unitOfWork,
      repositoryRegistry,
    });

    expect(useCases.decisionContext).toBeDefined();
    expect(useCases.policyEvaluation).toBeDefined();
    expect(useCases.strategyResolution).toBeDefined();
    expect(useCases.decisionEngine).toBeDefined();
    expect(useCases.decisionResult).toBeDefined();
  });
});
