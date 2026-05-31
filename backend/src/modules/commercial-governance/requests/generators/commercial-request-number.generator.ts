import type { Prisma } from '@prisma/client';

import { prisma } from '../../../../core/prisma/client.js';
import type {
  GeneratedRequestNumber,
  RequestNumberGenerator,
  RequestNumberGeneratorInput,
} from '../interfaces/request-number-generator.interface.js';

type CommercialRequestNumberPrismaClient =
  | typeof prisma
  | Prisma.TransactionClient;

const DEFAULT_TENANT_CODE = 'TENANT';

const normalizeTenantCode = (tenantCode?: string): string => {
  const normalized = tenantCode
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

  return normalized || DEFAULT_TENANT_CODE;
};

const formatSequence = (sequence: number): string => {
  return sequence.toString().padStart(6, '0');
};

export class CommercialRequestNumberGenerator
  implements RequestNumberGenerator
{
  constructor(
    private readonly client: CommercialRequestNumberPrismaClient = prisma,
  ) {}

  async next(
    input: RequestNumberGeneratorInput,
  ): Promise<GeneratedRequestNumber> {
    const year = input.requestedAt.getUTCFullYear();
    const current = await this.client.commercialRequest.aggregate({
      where: {
        tenantId: input.tenantId,
        year,
      },
      _max: {
        sequence: true,
      },
    });
    const sequence = (current._max.sequence ?? 0) + 1;
    const tenantCode = normalizeTenantCode(input.tenantCode);

    return {
      year,
      sequence,
      requestNumber: `CR-${tenantCode}-${year}-${formatSequence(sequence)}`,
    };
  }
}

export const commercialRequestNumberGenerator =
  new CommercialRequestNumberGenerator();
