import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodError } from 'zod';

import {
  createLeadSchema,
  updateLeadSchema,
} from './validators/leads.validator';
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

const isZodError = (error: unknown): error is ZodError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'flatten' in error &&
    typeof (error as ZodError).flatten === 'function'
  );
};

const handleRouteError = (error: unknown, reply: FastifyReply) => {
  if (isZodError(error)) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.flatten(),
    });
  }

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

      const query = request.query as {
        page?: string;
        limit?: string;
        search?: string;
        status?: string;
        source?: string;
        ownerId?: string;
        partnerId?: string;
      };

      logger.info('Fetching leads', {
        tenantId,
        query,
      });

      const listParams = {
        ...(query.page ? { page: Number(query.page) } : {}),
        ...(query.limit ? { limit: Number(query.limit) } : {}),
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
        ...(query.partnerId ? { partnerId: query.partnerId } : {}),
      };

      const leads = await leadsService.getAllLeads(tenantId, listParams);

      return reply.send({
        success: true,
        ...leads,
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
      const body = createLeadSchema.parse(request.body) as CreateLeadBody;
      const tenantId = getTenantId(request);
      const createdById = getCurrentUserId(request);

      const lead = await leadsService.createLead(tenantId, createdById, body);

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
        const currentUserId = getCurrentUserId(request);
        const body = updateLeadSchema.parse(request.body) as UpdateLeadBody;

        const lead = await leadsService.updateLead(
          id,
          tenantId,
          body,
          currentUserId,
        );

        return reply.send({
          success: true,
          message: 'Lead updated successfully',
          data: lead,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.patch<{ Params: LeadParams; Body: UpdateLeadBody }>(
    '/leads/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const tenantId = getTenantId(request);
        const currentUserId = getCurrentUserId(request);
        const body = updateLeadSchema.parse(request.body) as UpdateLeadBody;

        const lead = await leadsService.updateLead(
          id,
          tenantId,
          body,
          currentUserId,
        );

        return reply.send({
          success: true,
          message: 'Lead updated successfully',
          data: lead,
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.delete<{ Params: LeadParams }>('/leads/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const tenantId = getTenantId(request);
      const currentUserId = getCurrentUserId(request);

      const result = await leadsService.deleteLead(
        id,
        tenantId,
        currentUserId,
      );

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