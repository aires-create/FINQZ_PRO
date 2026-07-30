import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';

type OperationNumberPrismaClient = typeof prisma | Prisma.TransactionClient;

export type GeneratedOperationNumber = {
  operationNumber: string;
  year: number;
  sequence: number;
};

export type OperationNumberGeneratorInput = {
  tenantId: string;
  requestedAt: Date;
};

export interface OperationNumberGenerator {
  next(input: OperationNumberGeneratorInput): Promise<GeneratedOperationNumber>;
}

const DEFAULT_SEQUENCE_WIDTH = 6;
const DEFAULT_PREFIX = 'OP';

const requireTenantId = (tenantId?: string | null) => {
  if (!tenantId || !tenantId.trim()) {
    throw new Error('Missing tenant context');
  }

  return tenantId;
};

const formatSequence = (sequence: number) => {
  return sequence.toString().padStart(DEFAULT_SEQUENCE_WIDTH, '0');
};

export class OperationNumberGeneratorService implements OperationNumberGenerator {
  constructor(
    private readonly client: OperationNumberPrismaClient = prisma,
  ) {}

  async next(
    input: OperationNumberGeneratorInput,
  ): Promise<GeneratedOperationNumber> {
    const tenantId = requireTenantId(input.tenantId);
    const year = input.requestedAt.getUTCFullYear();
    const current = await this.client.operation.aggregate({
      where: {
        tenantId,
        year,
      },
      _max: {
        sequence: true,
      },
    });
    const sequence = (current._max.sequence ?? 0) + 1;

    return {
      operationNumber: `${DEFAULT_PREFIX}-${year}-${formatSequence(sequence)}`,
      year,
      sequence,
    };
  }
}

export const operationNumberGenerator = new OperationNumberGeneratorService();
