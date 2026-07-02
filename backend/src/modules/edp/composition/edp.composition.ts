import type { PrismaClient } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { createEdpUseCases } from '../application/use-cases.js';
import { PrismaEdpUnitOfWork } from '../application/unit-of-work.js';
import { createPrismaEdpRepositoryRegistry } from '../infrastructure/prisma/repositories.js';
import {
  createDecisionRuntimeComposition,
  type DecisionRuntimeComposition,
} from './decision-runtime.composition.js';

export type EdpRepositoryRegistry = ReturnType<typeof createPrismaEdpRepositoryRegistry>;
export type EdpUseCaseBundle = import('../application/use-cases.js').EdpUseCaseBundle;

export interface EdpCompositionDependencies {
  prismaClient?: PrismaClient;
}

export interface EdpComposition {
  decisionRuntime: DecisionRuntimeComposition;
  repositoryRegistry: EdpRepositoryRegistry;
  unitOfWork: PrismaEdpUnitOfWork;
  useCases: EdpUseCaseBundle;
}

export const createEdpComposition = (
  dependencies: EdpCompositionDependencies = {},
): EdpComposition => {
  const prismaClient = dependencies.prismaClient ?? prisma;
  const unitOfWork = new PrismaEdpUnitOfWork(prismaClient);
  const repositoryRegistry = createPrismaEdpRepositoryRegistry(prismaClient);
  const decisionRuntime = createDecisionRuntimeComposition({
    unitOfWork,
    repositoryRegistry,
  });

  return {
    decisionRuntime,
    repositoryRegistry,
    unitOfWork,
    useCases: createEdpUseCases({
      uow: unitOfWork,
      repositoryRegistry,
    }),
  };
};
