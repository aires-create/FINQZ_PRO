import {
  createAuditLog,
  getAuditLogStats,
  listAuditLogs,
  type CreateAuditLogParams,
  type ListAuditLogsParams,
} from '../repositories/audit.repository.js'

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

type AuditSeverity = 'info' | 'warning' | 'danger'

interface AuditTimelineContext {
  description: string
  category: string
  severity: AuditSeverity
  icon: string
}

const auditContextByAction: Partial<Record<string, AuditTimelineContext>> = {
  LEAD_CREATED: {
    description: 'Lead criado',
    category: 'CRM',
    severity: 'info',
    icon: 'plus-circle',
  },
  LEAD_UPDATED: {
    description: 'Lead atualizado',
    category: 'CRM',
    severity: 'warning',
    icon: 'edit',
  },
  LEAD_DELETED: {
    description: 'Lead removido',
    category: 'CRM',
    severity: 'danger',
    icon: 'trash',
  },
}

function enrichAuditLog<T extends { action: string }>(
  log: T,
) {
  const context = getAuditTimelineContext(log.action)

  return {
    ...log,
    ...context,
  }
}

function getAuditTimelineContext(
  action: string,
): AuditTimelineContext {
  const context = auditContextByAction[action]

  if (context) {
    return context
  }

  return {
    description: action,
    category: 'System',
    severity: 'info',
    icon: 'activity',
  }
}
