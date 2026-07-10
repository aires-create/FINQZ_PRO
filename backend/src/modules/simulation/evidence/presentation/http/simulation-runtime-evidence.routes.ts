import type { FastifyInstance } from 'fastify';

import { authenticate, tenantContextMiddleware } from '../../../../../core/http/middleware.js';
import { requirePermissions } from '../../../../rbac/rbac.guard.js';
import { createSimulationRuntimeEvidenceComposition } from '../../composition/index.js';
import { simulationRuntimeEvidenceRouteSchema } from './simulation-runtime-evidence.http.schema.js';

export interface SimulationRuntimeEvidenceRoutesOptions {
  composition?: ReturnType<typeof createSimulationRuntimeEvidenceComposition>;
}

export async function simulationRuntimeEvidenceRoutes(
  app: FastifyInstance,
  options: SimulationRuntimeEvidenceRoutesOptions = {},
): Promise<void> {
  const composition =
    options.composition ?? createSimulationRuntimeEvidenceComposition();

  /**
   * @swagger
   * /api/v1/simulations/runtime-evidence:
   *   post:
   *     summary: Ingest sanitized simulation runtime evidence
   *     tags: [Simulation Runtime Evidence]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Identical retry replayed successfully
   *       201:
   *         description: Evidence persisted successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       409:
   *         description: Conflicting retry
   *       500:
   *         description: Internal server error
   */
  app.post(
    '/runtime-evidence',
    {
      attachValidation: true,
      schema: simulationRuntimeEvidenceRouteSchema,
      preHandler: [
        authenticate,
        tenantContextMiddleware,
        requirePermissions('simulation:evidence:write'),
      ],
    },
    composition.controller.ingest.bind(composition.controller),
  );
}

export default simulationRuntimeEvidenceRoutes;
