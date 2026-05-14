import { prisma } from '../../../core/prisma/client';
import type { Prisma } from '@prisma/client';

export type FindAllLeadsParams = {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  partnerId?: string;
};

export class LeadsRepository {
  async findAll(params: FindAllLeadsParams) {
    const {
      tenantId,
      page,
      limit,
      search,
      status,
      source,
      ownerId,
      partnerId,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (partnerId) {
      where.partnerId = partnerId;
    }

    const [data, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.lead.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
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
    tenantId: string,
    data: Prisma.LeadUpdateInput
  ) {
    return prisma.lead.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
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