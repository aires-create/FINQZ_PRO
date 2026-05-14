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
      userId?: string
    }

    const tenantId = request.currentTenant?.tenantId

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        message: 'Missing tenant context',
      })
    }

    const result = await getAuditLogs({
      ...(query.page ? { page: Number(query.page) } : {}),
      ...(query.limit ? { limit: Number(query.limit) } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      tenantId,
    })

    return reply.send({
      success: true,
      ...result,
    })
  })
}