import type { FastifyInstance } from 'fastify';

import commercialRequestRoutes from './requests/presentation/http/commercial-request.routes.js';

export async function commercialGovernanceRoutes(
  app: FastifyInstance,
): Promise<void> {
  await app.register(commercialRequestRoutes, {
    prefix: '/requests',
  });
}

export default commercialGovernanceRoutes;
