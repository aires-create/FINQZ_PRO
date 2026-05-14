import { prisma } from '../../../core/prisma/client';
import type { Prisma } from '@prisma/client';

export class LeadsRepository {
  async findAll(tenantId: string) {
    return prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.lead.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.LeadUncheckedCreateInput) {
    return prisma.lead.create({
      data,
    });
  }

  async update(
    id: string,
    _tenantId: string,
    data: Prisma.LeadUpdateInput
  ) {
    return prisma.lead.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(id: string, tenantId: string) {
    return prisma.lead.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const leadsRepository = new LeadsRepository();