import type { PrismaClient } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { PrismaEdpUnitOfWork } from '../application/unit-of-work.js';
import { createPrismaEdpRepositoryRegistry } from '../infrastructure/prisma/repositories.js';

export type EdpRepositoryRegistry = ReturnType<typeof createPrismaEdpRepositoryRegistry>;

export interface EdpCompositionDependencies {
  prismaClient?: PrismaClient;
}

export interface EdpComposition {
  repositoryRegistry: EdpRepositoryRegistry;
  unitOfWork: PrismaEdpUnitOfWork;
}

export const createEdpComposition = (
  dependencies: EdpCompositionDependencies = {},
): EdpComposition => {
  const prismaClient = dependencies.prismaClient ?? prisma;

  return {
    repositoryRegistry: createPrismaEdpRepositoryRegistry(prismaClient),
    unitOfWork: new PrismaEdpUnitOfWork(prismaClient),
  };
};

