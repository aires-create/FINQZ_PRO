import { leadsService } from './services/leads.service';
import { logger } from '../../shared/logger';
import type { CreateLeadBody } from './dto/leads.dto';

const getHeaderValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const handleRouteError = (error: unknown, reply: any) => {
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

export async function crmRoutes(app: any) {
  app.get('/leads', async (request: any, reply: any) => {
    try {
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

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

  app.get('/leads/:id', async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

      const lead = await leadsService.getLeadById(id, tenantId);

      return reply.send({
        success: true,
        data: lead,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post('/leads', async (request: any, reply: any) => {
    try {
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

      const body = (request.body ?? {}) as CreateLeadBody;
      const firstName = body.firstName?.trim();
      const lastName = body.lastName?.trim();

      if (!firstName || !lastName) {
        return reply.status(400).send({
          success: false,
          message: 'Missing required fields: firstName, lastName',
        });
      }

      const createdById =
        getHeaderValue(request.headers['x-user-id']) ?? request.currentUser?.userId;

      if (!createdById) {
        return reply.status(400).send({
          success: false,
          message: 'Missing user context',
        });
      }

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

  app.put('/leads/:id', async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

      const lead = await leadsService.updateLead(id, tenantId, request.body);

      return reply.send({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.patch('/leads/:id', async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

      const lead = await leadsService.updateLead(id, tenantId, request.body);

      return reply.send({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/leads/:id', async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const tenantId = getHeaderValue(request.headers['x-tenant-id']);

      if (!tenantId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing tenant context',
        });
      }

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