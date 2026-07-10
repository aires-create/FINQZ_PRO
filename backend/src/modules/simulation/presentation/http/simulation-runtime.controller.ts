import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../../../shared/errors/AppError.js';
import { simulationApplicationRuntime } from '../../application/simulation.application.runtime.js';
import type { SimulationApplicationRuntime } from '../../application/simulation.application.runtime.js';
import { buildSimulationRuntimeOptions, buildSimulationRuntimeRequest, mapSimulationRuntimeExecutionToHttpResponse } from './simulation-runtime.http.mapper.js';
import type { SimulationRuntimeHttpRequestBodyContract } from './simulation-runtime.http.contract.js';
import { simulationRuntimeRequestBodySchema } from './simulation-runtime.http.schema.js';
import { sendSimulationRuntimeError } from './simulation-runtime.error-mapper.js';

export class SimulationRuntimeController {
  constructor(
    private readonly runtime: SimulationApplicationRuntime = simulationApplicationRuntime,
  ) {}

  execute = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      if (!request.currentTenant?.tenantId) {
        throw new AppError({
          message: 'Missing tenant context',
          statusCode: 403,
          code: 'FORBIDDEN',
        });
      }

      const body = simulationRuntimeRequestBodySchema.parse(
        request.body,
      ) as SimulationRuntimeHttpRequestBodyContract;
      const simulationRequest = buildSimulationRuntimeRequest(request, body);
      const execution = await this.runtime.execute(
        simulationRequest,
        buildSimulationRuntimeOptions(request, body),
      );

      return reply.send(mapSimulationRuntimeExecutionToHttpResponse(execution, request));
    } catch (error) {
      return sendSimulationRuntimeError(error, reply);
    }
  };
}

export const simulationRuntimeController = new SimulationRuntimeController();
