import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TestIntegrationProviderConnectionUseCase } from '../../application/test-integration-provider-connection.use-case.js';
import { IntegrationError } from '../../domain/errors/integration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../domain/errors/provider-not-found.error.js';

type TestProviderConnectionParams = {
  providerKey: string;
};

const getIntegrationErrorStatusCode = (error: IntegrationError) => {
  if (error instanceof ProviderNotFoundError) {
    return 404;
  }

  if (error instanceof ProviderConnectionError) {
    return 502;
  }

  return 500;
};

const sendIntegrationError = (
  reply: FastifyReply,
  error: IntegrationError,
) => {
  return reply.status(getIntegrationErrorStatusCode(error)).send({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  });
};

const sendUnexpectedIntegrationError = (reply: FastifyReply) => {
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTEGRATION_UNEXPECTED_ERROR',
      message: 'Unexpected integration error',
    },
  });
};

export class IntegrationsController {
  constructor(
    private readonly testConnectionUseCase: TestIntegrationProviderConnectionUseCase,
  ) {}

  testProviderConnection = async (
    request: FastifyRequest<{ Params: TestProviderConnectionParams }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.testConnectionUseCase.execute(
        request.params.providerKey,
      );

      reply.send(result);
    } catch (error) {
      if (error instanceof IntegrationError) {
        sendIntegrationError(reply, error);
        return;
      }

      sendUnexpectedIntegrationError(reply);
    }
  };
}
