import { prisma } from '../../../core/prisma/client.js';
import type { Prisma } from '@prisma/client';

export interface EdpTransactionBoundary {
  execute<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}

export class InMemoryEdpTransactionBoundary implements EdpTransactionBoundary {
  async execute<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return action(undefined as unknown as Prisma.TransactionClient);
  }
}

export class PrismaEdpTransactionBoundary implements EdpTransactionBoundary {
  constructor(private readonly client = prisma) {}

  async execute<T>(action: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction((transaction) => action(transaction));
  }
}
