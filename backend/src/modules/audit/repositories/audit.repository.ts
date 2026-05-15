import { Prisma } from '@prisma/client';
import { prisma } from '../../../core/prisma/client';

export interface ListAuditLogsParams {
  tenantId: string;
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  sortBy?: 'createdAt' | 'action' | 'entity';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAuditLogParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonObject;
}

export interface AuditStatsParams {
  tenantId: string;
  startOfDay: Date;
  from?: Date;
  to?: Date;
}

export async function listAuditLogs(params: ListAuditLogsParams) {
  const {
  tenantId,
  page,
  limit,
  action,
  entity,
  entityId,
  userId,
  from,
  to,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = params;

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    tenantId,
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(entityId ? { entityId } : {}),
    ...(userId ? { userId } : {}),
    ...((from || to)
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: {
  [sortBy]: sortOrder,
},
      skip,
      take: limit,
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getAuditLogStats(
  params: AuditStatsParams,
) {
  const { tenantId, startOfDay, from, to } = params;

  const dateRangeFilter: Prisma.AuditLogWhereInput =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const todayStart = from && from > startOfDay ? from : startOfDay;

  const todayDateFilter: Prisma.AuditLogWhereInput = {
    createdAt: {
      gte: todayStart,
      ...(to ? { lte: to } : {}),
    },
  };

  const [totalLogs, todayLogs, topActions] =
    await prisma.$transaction([
      prisma.auditLog.count({
        where: {
          tenantId,
          ...dateRangeFilter,
        },
      }),

      prisma.auditLog.count({
        where: {
          tenantId,
          ...todayDateFilter,
        },
      }),

      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          tenantId,
          ...dateRangeFilter,
        },
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 5,
      }),
    ]);

  return {
    totalLogs,
    todayLogs,
    topActions: topActions.map((item) => ({
      action: item.action,
      count:
        item._count && typeof item._count === 'object'
          ? item._count.action ?? 0
          : 0,
    })),
  };
}
export async function createAuditLog(
  params: CreateAuditLogParams,
) {
  const {
    tenantId,
    userId,
    action,
    entity,
    entityId,
    metadata,
  } = params;

  const data: Prisma.AuditLogUncheckedCreateInput = {
    tenantId,
    action,
    entity,
    entityId,
    ...(userId ? { userId } : {}),
    ...(metadata ? { metadata } : {}),
  };

  return prisma.auditLog.create({
    data,
  });
}