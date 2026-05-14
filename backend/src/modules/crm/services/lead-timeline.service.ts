import { prisma } from '../../../core/prisma/client';

export async function getLeadTimeline(
  tenantId: string,
  leadId: string,
) {
  return prisma.auditLog.findMany({
    where: {
      tenantId,
      entity: 'Lead',
      entityId: leadId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}