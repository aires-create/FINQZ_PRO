import {
  createAuditLog,
  getAuditLogStats,
  listAuditLogs,
  type CreateAuditLogParams,
  type ListAuditLogsParams,
} from '../repositories/audit.repository';

export async function getAuditLogs(
  params: ListAuditLogsParams,
) {
  return listAuditLogs(params);
}

export async function getAuditStats(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return getAuditLogStats({
    tenantId,
    startOfDay,
  });
}

/**
 * Registro resiliente de auditoria.
 * Nunca derruba a operação principal.
 */
export async function registerAuditLog(
  params: CreateAuditLogParams,
) {
  try {
    return await createAuditLog(params);
  } catch (error) {
    console.error(
      '[AUDIT_LOG_ERROR]',
      error,
    );

    return null;
  }
}

/**
 * Alias opcional para compatibilidade futura.
 */
export const registerAuditEvent =
  registerAuditLog;
