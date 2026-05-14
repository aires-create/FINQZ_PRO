import {
  createLeadSchema,
  updateLeadSchema,
} from './validators/leads.validator';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Prisma } from '@prisma/client';
import { leadsService } from './services/leads.service';
import { logger } from '../../shared/logger';
import type { CreateLeadBody, UpdateLeadBody } from './dto/leads.dto';
import { authenticate, tenantContextMiddleware } from '../../core/http/middleware';

type LeadParams = {
  id: string;
};

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new Error('Missing tenant context');
  }

  return tenantId;
};

const getCurrentUserId = (request: FastifyRequest) => {
  const userId = request.currentUser?.userId ?? request.currentTenant?.userId;

  if (!userId) {
    throw new Error('Missing user context');
  }

  return userId;
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';

  if (message === 'Missing tenant context' || message === 'Missing user context') {
    return reply.status(400).send({
      success: false,
      message,
    });
  }

  if (message === 'Lead not found') {
    return reply.status(404).send({
      success: false,
      message,
    });
  }

  logger.error('CRM route error', { error });

  return reply.status(500).send({
    success: false,
    message: 'Internal server error',
  });
};

export async function crmRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get('/leads', async (request, reply) => {
    try {
      const tenantId = getTenantId(request);

      logger.info('Fetching leads', { tenantId });

      const leads = await leadsService.getAllLeads(tenantId);

      return reply.send({
        success: true,
        data: leads,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: LeadParams }>('/leads/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const lead = await leadsService.getLeadById(id, tenantId);

      return reply.send({
        success: true,
        data: lead,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: CreateLeadBody }>('/leads', async (request, reply) => {
  try {
    const parsed = createLeadSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const tenantId = getTenantId(request);

    const body = parsed.data as CreateLeadBody;

    const createdById = getCurrentUserId(request);

    const lead = await leadsService.createLead(
      tenantId,
      createdById,
      body
    );

    return reply.status(201).send({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    return handleRouteError(error, reply);
  }
});

  app.put<{ Params: LeadParams; Body: UpdateLeadBody }>(
    '/leads/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const tenantId = getTenantId(request);

        const lead = await leadsService.updateLead(id, tenantId, request.body);

        return reply.send({
          success: true,
          message: 'Lead updated successfully',
          data: lead,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.patch<{ Params: LeadParams; Body: UpdateLeadBody }>(
    '/leads/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const tenantId = getTenantId(request);

        const lead = await leadsService.updateLead(id, tenantId, request.body);

        return reply.send({
          success: true,
          message: 'Lead updated successfully',
          data: lead,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.delete<{ Params: LeadParams }>('/leads/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const result = await leadsService.deleteLead(id, tenantId);

      return reply.send({
        success: true,
        message: 'Lead deleted successfully',
        data: result,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
