import type { FastifyReply, FastifyRequest } from 'fastify';
import { createModuleLogger } from '../../../../shared/logger.js';

import type { ListProviderCapabilitiesUseCase } from '../../application/list-provider-capabilities.use-case.js';
import type { ListIntegrationProviderProposalsUseCase } from '../../application/list-integration-provider-proposals.use-case.js';
import type { ListFinancialProviderProposalsUseCase } from '../../application/list-financial-provider-proposals.use-case.js';
import type { GetProviderPayloadDiagnosticsUseCase } from '../../application/get-provider-payload-diagnostics.use-case.js';
import type { GetProviderRuntimeDiagnosticsUseCase } from '../../application/get-provider-runtime-diagnostics.use-case.js';
import type { GetProviderRuntimeIssuesUseCase } from '../../application/get-provider-runtime-issues.use-case.js';
import type { GetProviderRuntimeSummaryUseCase } from '../../application/get-provider-runtime-summary.use-case.js';
import type { GetProviderOperationsConsoleUseCase } from '../../application/get-provider-operations-console.use-case.js';
import type { TestIntegrationProviderConnectionUseCase } from '../../application/test-integration-provider-connection.use-case.js';
import type { TestIntegrationProviderMarginInquiryUseCase } from '../../application/test-integration-provider-margin-inquiry.use-case.js';
import type { TestIntegrationProviderInitialSimulationUseCase } from '../../application/test-integration-provider-initial-simulation.use-case.js';
import { IntegrationError } from '../../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../../domain/errors/provider-capability-not-supported.error.js';
import { ProviderAuthenticationError } from '../../domain/errors/provider-authentication.error.js';
import { ProviderConfigurationError } from '../../domain/errors/provider-configuration.error.js';
import { ProviderConnectionError } from '../../domain/errors/provider-connection.error.js';
import { ProviderNotFoundError } from '../../domain/errors/provider-not-found.error.js';

type TestProviderConnectionParams = {
  providerKey: string;
};

type MarginInquiryBody = {
  document?: string;
  cpf?: string;
  metadata?: {
    convenioCnpj?: string;
    enrollmentId?: string;
    requestId?: string;
  };
};

const logger = createModuleLogger('integrations.http');

const maskCpf = (value: string): string => {
  const normalized = value.replace(/\D+/g, '');
  if (normalized.length !== 11) {
    return '***';
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
};

const getIntegrationErrorStatusCode = (error: IntegrationError) => {
  if (error instanceof ProviderNotFoundError) {
    return 404;
  }

  if (error instanceof ProviderConnectionError) {
    return 502;
  }

  if (error instanceof ProviderAuthenticationError) {
    return 502;
  }

  if (error instanceof ProviderCapabilityNotSupportedError) {
    return 501;
  }

  if (error instanceof ProviderConfigurationError) {
    return 500;
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
    private readonly listProposalsUseCase: ListIntegrationProviderProposalsUseCase,
    private readonly listFinancialProposalsUseCase: ListFinancialProviderProposalsUseCase,
    private readonly getProviderPayloadDiagnosticsUseCase: GetProviderPayloadDiagnosticsUseCase,
    private readonly listProviderCapabilitiesUseCase: ListProviderCapabilitiesUseCase,
    private readonly testProviderMarginInquiryUseCase: TestIntegrationProviderMarginInquiryUseCase,
    private readonly testProviderInitialSimulationUseCase: TestIntegrationProviderInitialSimulationUseCase,
    private readonly getProviderRuntimeSummaryUseCase: GetProviderRuntimeSummaryUseCase,
    private readonly getProviderRuntimeIssuesUseCase: GetProviderRuntimeIssuesUseCase,
    private readonly getProviderRuntimeDiagnosticsUseCase: GetProviderRuntimeDiagnosticsUseCase,
    private readonly getProviderOperationsConsoleUseCase: GetProviderOperationsConsoleUseCase,
  ) {}

  listProviderCapabilities = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = this.listProviderCapabilitiesUseCase.execute();
    reply.send(result);
  };

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

  listProviderProposals = async (
    request: FastifyRequest<{ Params: TestProviderConnectionParams }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = await this.listProposalsUseCase.execute(
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

  getFinancialProviderProposals = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const params = request.params as { providerKey?: string };
      const data = await this.listFinancialProposalsUseCase.execute(
        String(params.providerKey ?? ''),
      );

      reply.send({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof IntegrationError) {
        sendIntegrationError(reply, error);
        return;
      }

      sendUnexpectedIntegrationError(reply);
    }
  };

  getProviderPayloadDiagnostics = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const params = request.params as { providerKey?: string };
      const data = await this.getProviderPayloadDiagnosticsUseCase.execute(
        String(params.providerKey ?? ''),
      );

      reply.send({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof IntegrationError) {
        sendIntegrationError(reply, error);
        return;
      }

      sendUnexpectedIntegrationError(reply);
    }
  };

  testProviderMarginInquiry = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const body = (request.body as MarginInquiryBody | undefined) ?? {};
      const document = String(body.document ?? body.cpf ?? '').replace(/\D+/g, '');
      const convenioCnpj = String(body.metadata?.convenioCnpj ?? '').replace(/\D+/g, '');
      const enrollmentId = String(body.metadata?.enrollmentId ?? '').trim();
      const requestId = String(body.metadata?.requestId ?? '').trim() || undefined;

      if (document.length !== 11 || convenioCnpj.length !== 14 || !enrollmentId) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INTEGRATION_VALIDATION_ERROR',
            message: 'Invalid margin inquiry payload',
          },
        });
        return;
      }

      logger.info('Margin inquiry test request received', {
        providerKey: 'sos-bolso',
        requestId: requestId ?? request.requestId ?? request.id,
        document: maskCpf(document),
      });

      const result = await this.testProviderMarginInquiryUseCase.execute(
        'sos-bolso',
        {
          document,
          metadata: {
            convenioCnpj,
            enrollmentId,
            ...(requestId ? { requestId } : {}),
          },
        },
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

  testProviderInitialSimulation = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const params = request.params as { providerKey?: string };
      const body = (request.body as { cpf?: string; matricula?: string } | undefined) ?? {};
      const cpf = String(body.cpf ?? '').replace(/\D+/g, '');
      const matricula = String(body.matricula ?? '').trim();

      if (cpf.length !== 11 || !matricula) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INTEGRATION_VALIDATION_ERROR',
            message: 'Invalid initial simulation payload',
          },
        });
        return;
      }

      const result = await this.testProviderInitialSimulationUseCase.execute(
        String(params.providerKey ?? ''),
        {
          cpf,
          matricula,
        },
      );

      reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof IntegrationError) {
        sendIntegrationError(reply, error);
        return;
      }

      sendUnexpectedIntegrationError(reply);
    }
  };

  getProviderRuntimeSummary = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = this.getProviderRuntimeSummaryUseCase.execute();
      reply.send(result);
    } catch {
      sendUnexpectedIntegrationError(reply);
    }
  };

  getProviderRuntimeIssues = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = this.getProviderRuntimeIssuesUseCase.execute();
      reply.send(result);
    } catch {
      sendUnexpectedIntegrationError(reply);
    }
  };

  getProviderRuntimeDiagnostics = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const params = request.params as { providerKey?: string };
      const result = this.getProviderRuntimeDiagnosticsUseCase.execute(
        params.providerKey,
      );
      reply.send(result);
    } catch {
      sendUnexpectedIntegrationError(reply);
    }
  };

  getProviderOperationsConsole = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const result = this.getProviderOperationsConsoleUseCase.execute();
      reply.send({
        success: true,
        data: result,
      });
    } catch {
      sendUnexpectedIntegrationError(reply);
    }
  };
}
