import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import {
  edpAuditMiddleware,
  edpCorrelationMiddleware,
  edpIdempotencyHandler,
  edpObservabilityHook,
  edpSecurityContextMiddleware,
  edpTenantMiddleware,
} from '../../infrastructure/index.js';
import { edpController } from './edp.controller.js';

export async function edpRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);
  app.addHook('preHandler', edpCorrelationMiddleware);
  app.addHook('preHandler', edpSecurityContextMiddleware);
  app.addHook('preHandler', edpTenantMiddleware);
  app.addHook('preHandler', edpAuditMiddleware);
  app.addHook('preHandler', edpIdempotencyHandler);
  app.addHook('preHandler', edpObservabilityHook);

  app.get('/runtime', edpController.runtime);
  app.post('/commands/:commandName', edpController.handleCommand);
  app.post('/queries/:queryName', edpController.handleQuery);
}

export default edpRoutes;

