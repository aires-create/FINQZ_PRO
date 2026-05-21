import type { FastifyInstance } from 'fastify';

import type { IntegrationsController } from './integrations.controller.js';

export const createIntegrationsRoutes = (
  integrationsController: IntegrationsController,
) => {
  return async function integrationsRoutes(app: FastifyInstance): Promise<void> {
    app.get(
      '/providers/:providerKey/test',
      integrationsController.testProviderConnection,
    );

    app.get(
      '/providers/:providerKey/proposals',
      integrationsController.listProviderProposals,
    );
  };
};
