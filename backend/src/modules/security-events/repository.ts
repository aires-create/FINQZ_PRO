import type { Prisma } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import type {
  SecurityEventMetadata,
  SecurityEventOutcome,
  SecurityEventSeverity,
  SecurityEventType,
} from './types.js';

export interface CreateSecurityEventLogParams {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  outcome: SecurityEventOutcome;
  tenantId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  route?: string | null;
  method?: string | null;
  metadata?: SecurityEventMetadata | null;
}

export async function createSecurityEventLog(
  params: CreateSecurityEventLogParams,
): Promise<void> {
  const data: Prisma.SecurityEventLogUncheckedCreateInput = {
    eventType: params.eventType,
    severity: params.severity,
    outcome: params.outcome,
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.ipAddress ? { ipAddress: params.ipAddress } : {}),
    ...(params.userAgent ? { userAgent: params.userAgent } : {}),
    ...(params.requestId ? { requestId: params.requestId } : {}),
    ...(params.route ? { route: params.route } : {}),
    ...(params.method ? { method: params.method } : {}),
    ...(params.metadata
      ? { metadata: params.metadata as Prisma.InputJsonObject }
      : {}),
  };

  await prisma.securityEventLog.create({ data });
}
