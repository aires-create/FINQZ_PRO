import {
  listAuditLogs,
  createAuditLog,
  ListAuditLogsParams,
  CreateAuditLogParams,
} from '../repositories/audit.repository';

export async function getAuditLogs(params: ListAuditLogsParams) {
  return listAuditLogs(params);
}

export async function registerAuditLog(
  params: CreateAuditLogParams,
) {
  return createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId ?? null,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    metadata: params.metadata ?? {},
  });
}