import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { createEdpComposition } from '../../composition/index.js';
import {
  edpAuditMiddleware,
  edpCorrelationMiddleware,
  edpIdempotencyHandler,
  edpObservabilityHook,
  edpSecurityContextMiddleware,
  edpTenantMiddleware,
} from '../../infrastructure/index.js';
import { createEdpController } from './edp.controller.js';

export interface EdpRoutesOptions {
  composition?: ReturnType<typeof createEdpComposition>;
}

export async function edpRoutes(app: FastifyInstance, options: EdpRoutesOptions = {}): Promise<void> {
  const composition = options.composition ?? createEdpComposition();
  const edpController = createEdpController({ composition });

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
