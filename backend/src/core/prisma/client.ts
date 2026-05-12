import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const tenantWhere = (tenantId: string) => ({ tenantId });

export const withTenant = <T extends { where?: Record<string, any> }>(params: T, tenantId: string): T => {
  return {
    ...params,
    where: {
      ...params.where,
      tenantId,
    },
  } as T;
};
