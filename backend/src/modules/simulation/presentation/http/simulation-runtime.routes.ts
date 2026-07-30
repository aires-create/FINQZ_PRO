import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../core/http/middleware.js';
import { requirePermissions } from '../../../rbac/rbac.guard.js';
import { simulationRuntimeController } from './simulation-runtime.controller.js';
import { simulationRuntimeRouteSchema } from './simulation-runtime.http.schema.js';

export async function simulationRuntimeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  /**
   * @swagger
   * /api/v1/simulations/runtime:
   *   post:
   *     summary: Execute the official simulation runtime
   *     tags: [Simulation Runtime]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Simulation executed successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       422:
   *         description: Unprocessable entity
   *       500:
   *         description: Internal server error
   */
  app.post(
    '/runtime',
    {
      attachValidation: true,
      schema: simulationRuntimeRouteSchema,
      preHandler: [requirePermissions('simulation:execute')],
    },
    simulationRuntimeController.execute,
  );
}

export default simulationRuntimeRoutes;
