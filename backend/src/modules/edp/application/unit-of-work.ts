import { prisma } from '../../../core/prisma/client.js';
import type { Prisma } from '@prisma/client';

export interface EdpUnitOfWork {
  run<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}

export class InMemoryEdpUnitOfWork implements EdpUnitOfWork {
  async run<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return action(undefined as unknown as Prisma.TransactionClient);
  }
}

export class PrismaEdpUnitOfWork implements EdpUnitOfWork {
  constructor(private readonly client = prisma) {}

  async run<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction((transaction) => action(transaction));
  }
}
