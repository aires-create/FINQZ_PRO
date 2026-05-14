import {
  createAuditLog,
  listAuditLogs,
  type CreateAuditLogParams,
  type ListAuditLogsParams,
} from '../repositories/audit.repository';

export async function getAuditLogs(
  params: ListAuditLogsParams,
) {
  return listAuditLogs(params);
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