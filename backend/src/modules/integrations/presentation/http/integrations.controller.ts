import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TestIntegrationProviderConnectionUseCase } from '../../application/test-integration-provider-connection.use-case.js';

type TestProviderConnectionParams = {
  providerKey: string;
};

export class IntegrationsController {
  constructor(
    private readonly testConnectionUseCase: TestIntegrationProviderConnectionUseCase,
  ) {}

  testProviderConnection = async (
    request: FastifyRequest<{ Params: TestProviderConnectionParams }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.testConnectionUseCase.execute(
      request.params.providerKey,
    );

    reply.send(result);
  };
}
