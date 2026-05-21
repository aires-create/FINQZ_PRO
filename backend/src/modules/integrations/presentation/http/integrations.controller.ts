import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TestIntegrationProviderConnectionUseCase } from '../../application/test-integration-provider-connection.use-case.js';

export class IntegrationsController {
  constructor(
    private readonly testConnectionUseCase: TestIntegrationProviderConnectionUseCase,
  ) {}

  testNovaPromotoraConnection = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.testConnectionUseCase.execute('nova-promotora');

    reply.send(result);
  };
}
