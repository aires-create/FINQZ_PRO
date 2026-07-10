import type { FastifyReply, FastifyRequest } from 'fastify';

import { ForbiddenError } from '../../../../../shared/errors/AppError.js';
import { logger } from '../../../../../shared/logger.js';
import type { CollectSimulationRuntimeEvidenceUseCase } from '../../application/collect-simulation-runtime-evidence.use-case.js';
import type { SimulationRuntimeEvidenceRecord } from '../../domain/simulation-runtime-evidence.types.js';
import type { SimulationRuntimeEvidenceRepository } from '../../domain/simulation-runtime-evidence.repository.js';
import { simulationRuntimeEvidenceRequestBodySchema } from './simulation-runtime-evidence.http.schema.js';
import {
  buildSimulationRuntimeEvidenceContext,
  buildSimulationRuntimeEvidenceInput,
  mapSimulationRuntimeEvidenceRecordToHttpResponse,
} from './simulation-runtime-evidence.http.mapper.js';
import { sendSimulationRuntimeEvidenceError } from './simulation-runtime-evidence.error-mapper.js';

export interface SimulationRuntimeEvidenceControllerDependencies {
  repository: SimulationRuntimeEvidenceRepository;
  useCase: CollectSimulationRuntimeEvidenceUseCase;
}

const normalizeSimulationRuntimeEvidenceRecord = (
  record: SimulationRuntimeEvidenceRecord,
): Omit<SimulationRuntimeEvidenceRecord, 'receivedAt'> => {
  const { receivedAt: _receivedAt, ...rest } = record;
  return Object.fromEntries(
    Object.entries(rest).sort(([left], [right]) => left.localeCompare(right)),
  ) as Omit<SimulationRuntimeEvidenceRecord, 'receivedAt'>;
};

const isSameSimulationRuntimeEvidenceRecord = (
  existing: SimulationRuntimeEvidenceRecord,
  input: SimulationRuntimeEvidenceRecord,
): boolean =>
  JSON.stringify(normalizeSimulationRuntimeEvidenceRecord(existing)) ===
  JSON.stringify(normalizeSimulationRuntimeEvidenceRecord(input));

export class SimulationRuntimeEvidenceController {
  constructor(
    private readonly dependencies: SimulationRuntimeEvidenceControllerDependencies,
  ) {}

  ingest = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!request.currentTenant?.tenantId) {
        throw new ForbiddenError('Missing tenant context');
      }

      const body = simulationRuntimeEvidenceRequestBodySchema.parse(request.body);
      const input = buildSimulationRuntimeEvidenceInput(body);
      const context = buildSimulationRuntimeEvidenceContext(request);
      const existing = await this.dependencies.repository.findByIdentity(
        context.tenantId,
        input.campaignId,
        input.evidenceId,
      );
      if (existing) {
        const candidate = {
          ...input,
          ...context,
        };

        if (isSameSimulationRuntimeEvidenceRecord(existing, candidate)) {
          logger.info('Simulation runtime evidence replay detected', {
            requestId: existing.requestId,
            correlationId: existing.correlationId,
            evidenceId: existing.evidenceId,
            campaignId: existing.campaignId,
            productCode: existing.productCode,
            subproductCode: existing.subproductCode,
            status: 200,
          });

          return reply.status(200).send(
            mapSimulationRuntimeEvidenceRecordToHttpResponse(existing),
          );
        }
      }

      const evidence = await this.dependencies.useCase.execute(input, context);
      const statusCode = existing ? 200 : 201;

      logger.info('Simulation runtime evidence ingested', {
        requestId: evidence.requestId,
        correlationId: evidence.correlationId,
        evidenceId: evidence.evidenceId,
        campaignId: evidence.campaignId,
        productCode: evidence.productCode,
        subproductCode: evidence.subproductCode,
        status: statusCode,
      });

      return reply.status(statusCode).send(
        mapSimulationRuntimeEvidenceRecordToHttpResponse(evidence),
      );
    } catch (error) {
      return sendSimulationRuntimeEvidenceError(error, reply);
    }
  };
}

export const createSimulationRuntimeEvidenceController = (
  dependencies: SimulationRuntimeEvidenceControllerDependencies,
): SimulationRuntimeEvidenceController =>
  new SimulationRuntimeEvidenceController(dependencies);
