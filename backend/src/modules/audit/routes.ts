import type { FastifyInstance } from 'fastify'
import {
  getAuditLogs,
  getAuditStats,
} from './services/audit.service.js'
import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js'

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', tenantContextMiddleware)

  /**
   * @swagger
   * /api/v1/audit/stats:
   *   get:
   *     summary: Get audit log stats
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: from
   *         required: false
   *         description: Start date in YYYY-MM-DD format
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: to
   *         required: false
   *         description: End date in YYYY-MM-DD format
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Audit stats retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalLogs:
   *                   type: number
   *                 todayLogs:
   *                   type: number
   *                 topActions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       action:
   *                         type: string
   *                       count:
   *                         type: number
   *       400:
   *         description: Invalid request or missing tenant context
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   enum:
   *                     - Missing tenant context
   *                     - Invalid from date
   *                     - Invalid to date
   *                     - from date must be before or equal to to date
   *             examples:
   *               missingTenantContext:
   *                 value:
   *                   success: false
   *                   message: Missing tenant context
   *               invalidFromDate:
   *                 value:
   *                   success: false
   *                   message: Invalid from date
   *               invalidToDate:
   *                 value:
   *                   success: false
   *                   message: Invalid to date
   *               invalidDateRange:
   *                 value:
   *                   success: false
   *                   message: from date must be before or equal to to date
   *       401:
   *         description: Unauthorized
   */
  app.get('/stats', async (request, reply) => {
  const query = request.query as {
    from?: string
    to?: string
  }

  const { from, to } = query

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

  const result = await getAuditStats({
    tenantId,
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  })

  return reply.send(result)
})

  /**
   * @swagger
   * /api/v1/audit/logs:
   *   get:
   *     summary: List audit logs
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           oneOf:
   *             - type: string
   *             - type: number
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           oneOf:
   *             - type: string
   *             - type: number
   *       - in: query
   *         name: action
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: entity
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: entityId
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: userId
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: from
   *         required: false
   *         description: Start date in YYYY-MM-DD format
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: to
   *         required: false
   *         description: End date in YYYY-MM-DD format
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: sortBy
   *         required: false
   *         schema:
   *           type: string
   *           enum: [createdAt, action, entity]
   *       - in: query
   *         name: sortOrder
   *         required: false
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Audit logs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       tenantId:
   *                         type: string
   *                       userId:
   *                         type: string
   *                         nullable: true
   *                       action:
   *                         type: string
   *                       entity:
   *                         type: string
   *                       entityId:
   *                         type: string
   *                       metadata:
   *                         type: object
   *                         nullable: true
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       description:
   *                         type: string
   *                       category:
   *                         type: string
   *                       severity:
   *                         type: string
   *                         enum: [info, warning, danger]
   *                       icon:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: number
   *                     limit:
   *                       type: number
   *                     total:
   *                       type: number
   *                     totalPages:
   *                       type: number
   *                     hasNextPage:
   *                       type: boolean
   *                     hasPreviousPage:
   *                       type: boolean
   *       400:
   *         description: Invalid request or missing tenant context
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   enum:
   *                     - Missing tenant context
   *                     - Invalid from date
   *                     - Invalid to date
   *                     - from date must be before or equal to to date
   *             examples:
   *               missingTenantContext:
   *                 value:
   *                   success: false
   *                   message: Missing tenant context
   *               invalidFromDate:
   *                 value:
   *                   success: false
   *                   message: Invalid from date
   *               invalidToDate:
   *                 value:
   *                   success: false
   *                   message: Invalid to date
   *               invalidDateRange:
   *                 value:
   *                   success: false
   *                   message: from date must be before or equal to to date
   *       401:
   *         description: Unauthorized
   */
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
  sortBy?: string
  sortOrder?: string
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
  sortBy,
  sortOrder,
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

const allowedSortBy = ['createdAt', 'action', 'entity'] as const

const allowedSortOrder = ['asc', 'desc'] as const

const normalizedSortBy: 'createdAt' | 'action' | 'entity' =
  allowedSortBy.includes(
    sortBy as (typeof allowedSortBy)[number],
  )
    ? (sortBy as 'createdAt' | 'action' | 'entity')
    : 'createdAt'

const normalizedSortOrder: 'asc' | 'desc' =
  allowedSortOrder.includes(
    sortOrder as (typeof allowedSortOrder)[number],
  )
    ? (sortOrder as 'asc' | 'desc')
    : 'desc'

const result = await getAuditLogs({
  tenantId,
  page: Number(page),
  limit: Number(limit),
  sortBy: normalizedSortBy,
  sortOrder: normalizedSortOrder,
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
