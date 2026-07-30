import type { Partner, Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export class PartnerPrismaRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async findPartnerById(input: {
    tenantId: string;
    partnerId: string;
  }): Promise<Partner | null> {
    return this.db.partner.findFirst({
      where: {
        id: input.partnerId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
  }

  async findPartnerByCode(input: {
    tenantId: string;
    code: string;
  }): Promise<Partner | null> {
    return this.db.partner.findFirst({
      where: {
        tenantId: input.tenantId,
        code: input.code,
        deletedAt: null,
      },
    });
  }

  async createPartner(input: {
    tenantId: string;
    code: string;
    name: string;
    type: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string;
  }): Promise<Partner> {
    return this.db.partner.create({
      data: {
        tenantId: input.tenantId,
        code: input.code,
        name: input.name,
        type: input.type,
        document: input.document ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        status: input.status ?? 'active',
      },
    });
  }
}
