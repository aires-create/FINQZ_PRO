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
    }

    const tenantId = request.currentTenant?.tenantId

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        message: 'Missing tenant context',
      })
    }

    const result = await getAuditLogs({
  tenantId,
  page: query.page ? Number(query.page) : 1,
  limit: query.limit ? Number(query.limit) : 20,
  ...(query.action ? { action: query.action } : {}),
  ...(query.entity ? { entity: query.entity } : {}),
  ...(query.entityId ? { entityId: query.entityId } : {}),
  ...(query.userId ? { userId: query.userId } : {}),
});

    return reply.send({
      success: true,
      ...result,
    })
  })
}