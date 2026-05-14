import { Prisma } from '@prisma/client';
import { prisma } from '../../../core/prisma/client';

export interface ListAuditLogsParams {
  tenantId: string;
  page: number;
  limit: number;
  action?: string;
  entity?: string;
  userId?: string;
}

export interface CreateAuditLogParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonObject;
}

export async function listAuditLogs(params: ListAuditLogsParams) {
  const {
    tenantId,
    page,
    limit,
    action,
    entity,
    userId,
  } = params;

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    tenantId,
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
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