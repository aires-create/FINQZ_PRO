import {
  createAuditLog,
  getAuditLogStats,
  listAuditLogs,
  type CreateAuditLogParams,
  type ListAuditLogsParams,
} from '../repositories/audit.repository'

export async function getAuditLogs(
  params: ListAuditLogsParams,
) {
  const result = await listAuditLogs(params)

  return {
    ...result,
    data: result.data.map(enrichAuditLog),
  }
}

export interface GetAuditStatsParams {
  tenantId: string
  from?: Date
  to?: Date
}

export async function getAuditStats(
  params: GetAuditStatsParams,
) {
  const { tenantId, from, to } = params

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  return getAuditLogStats({
    tenantId,
    startOfDay,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  })
}

/**
 * Registro resiliente de auditoria.
 * Nunca derruba a operação principal.
 */
export async function registerAuditLog(
  params: CreateAuditLogParams,
) {
  try {
    return await createAuditLog(params)
  } catch (error) {
    console.error(
      '[AUDIT_LOG_ERROR]',
      error,
    )

    return null
  }
}

/**
 * Alias opcional para compatibilidade futura.
 */
export const registerAuditEvent =
  registerAuditLog

function enrichAuditLog<T extends { action: string }>(
  log: T,
) {
  return {
    ...log,
    description: getAuditDescription(log.action),
  }
}

function getAuditDescription(action: string) {
  const descriptions: Record<string, string> = {
    LEAD_CREATED: 'Lead criado',
    LEAD_UPDATED: 'Lead atualizado',
    LEAD_DELETED: 'Lead removido',
  }

  return descriptions[action] ?? action
}