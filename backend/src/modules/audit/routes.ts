import type { FastifyInstance } from 'fastify'
import { getAuditLogs } from './services/audit.service'
import { authenticate, tenantContextMiddleware } from '../../core/http/middleware'

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', tenantContextMiddleware)

  app.get('/logs', async (request, reply) => {
    const query = request.query as {
      page?: string
      limit?: string
      action?: string
      entity?: string
      entityId?: string
      userId?: string
      from?: string
      to?: string
    }

    const {
      page = '1',
      limit = '50',
      action,
      entity,
      entityId,
      userId,
      from,
      to,
    } = query

    const tenantId = request.currentTenant?.tenantId

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        message: 'Missing tenant context',
      })
    }

    const fromDate = from
      ? new Date(`${from}T00:00:00.000Z`)
      : undefined

    const toDate = to
      ? new Date(`${to}T23:59:59.999Z`)
      : undefined

    if (fromDate && Number.isNaN(fromDate.getTime())) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid from date',
      })
    }

    if (toDate && Number.isNaN(toDate.getTime())) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid to date',
      })
    }

    if (fromDate && toDate && fromDate > toDate) {
      return reply.status(400).send({
        success: false,
        message: 'from date must be before or equal to to date',
      })
    }

    const result = await getAuditLogs({
      tenantId,
      page: Number(page),
      limit: Number(limit),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
      ...(userId ? { userId } : {}),
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
    })

    return reply.send(result)
  })
}