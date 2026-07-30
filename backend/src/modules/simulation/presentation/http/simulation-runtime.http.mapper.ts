import type { FastifyRequest } from 'fastify';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { SimulationApplicationExecutionResult } from '../../application/simulation.application.context.js';
import type { SimulationRequest } from '../../contracts/simulation.contract.js';
import type { SimulationBridgeContext } from '../../acl/simulation-bridge-context.js';
import type {
  SimulationRuntimeHttpExecutionDataContract,
  SimulationRuntimeHttpRequestBodyContract,
  SimulationRuntimeHttpSuccessResponseContract,
} from './simulation-runtime.http.contract.js';

const withDefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as {
    [K in keyof T as undefined extends T[K] ? never : K]: Exclude<T[K], undefined>;
  } & {
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
  };
};

const getRequestId = (request: FastifyRequest) => request.requestId ?? request.id;

const getCorrelationId = (request: FastifyRequest) =>
  request.correlationId ?? request.requestId ?? request.id;

const getTenantId = (request: FastifyRequest) => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new AppError({
      message: 'Missing tenant context',
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  }

  return tenantId;
};

const buildBridgeContext = (
  request: FastifyRequest,
  body: SimulationRuntimeHttpRequestBodyContract,
): Partial<SimulationBridgeContext> => {
  const requestId = getRequestId(request);
  const correlationId = getCorrelationId(request);
  const executionId = body.execution?.executionId ?? requestId;
  const simulationId =
    body.execution?.snapshotId ??
    body.opportunity?.id ??
    body.product.id ??
    executionId;

  return withDefined({
    tenantId: getTenantId(request),
    opportunityId: body.opportunity?.id ?? body.execution?.snapshotId ?? executionId,
    simulationId,
    executionId,
    correlationId,
    createdBy: request.currentUser?.userId ?? request.currentTenant?.userId ?? 'system',
    source: 'simulation-runtime-http',
    compatibilityMode: body.metadata.compatibilityMode,
    catalogVersion: body.metadata.catalogVersion,
    engineVersion: body.metadata.engineVersion,
    policyVersion: body.metadata.policyVersion,
    strategyVersion: body.metadata.strategyVersion,
    requestId,
    createdAt: body.metadata.createdAt,
  });
};

export const buildSimulationRuntimeRequest = (
  request: FastifyRequest,
  body: SimulationRuntimeHttpRequestBodyContract,
): SimulationRequest => ({
  tenant: {
    id: getTenantId(request),
  },
  product: body.product,
  subproduct: body.subproduct,
  customer: body.customer,
  participants: body.participants,
  guarantees: body.guarantees,
  ...(body.vehicle ? { vehicle: body.vehicle } : {}),
  ...(body.property ? { property: body.property } : {}),
  ...(body.income ? { income: body.income } : {}),
  ...(body.agreement ? { agreement: body.agreement } : {}),
  ...(body.provider ? { provider: body.provider } : {}),
  ...(body.commercializadora ? { commercializadora: body.commercializadora } : {}),
  ...(body.bank ? { bank: body.bank } : {}),
  ...(body.corban ? { corban: body.corban } : {}),
  ...(body.channel ? { channel: body.channel } : {}),
  ...(body.pipeline ? { pipeline: body.pipeline } : {}),
  ...(body.opportunity ? { opportunity: body.opportunity } : {}),
  ...(body.commercial ? { commercial: body.commercial } : {}),
  parameters: body.parameters,
  metadata: body.metadata,
  versioning: body.versioning,
  execution: withDefined({
    executionId: body.execution?.executionId ?? getRequestId(request),
    correlationId: body.execution?.correlationId ?? getCorrelationId(request),
    requestId: body.execution?.requestId ?? getRequestId(request),
    snapshotId: body.execution?.snapshotId,
    tenantId: body.execution?.tenantId ?? getTenantId(request),
    performedBy: body.execution?.performedBy ?? request.currentUser?.userId,
    performedAt: body.execution?.performedAt ?? body.metadata.createdAt,
  }),
});

export const buildSimulationRuntimeOptions = (
  request: FastifyRequest,
  body: SimulationRuntimeHttpRequestBodyContract,
) => ({
  bridgeContext: buildBridgeContext(request, body),
});

export const mapSimulationRuntimeExecutionToHttpResponse = (
  execution: SimulationApplicationExecutionResult,
  request: FastifyRequest,
): SimulationRuntimeHttpSuccessResponseContract => {
  const { context, result, executionEnvelope } = execution;

  const data: SimulationRuntimeHttpExecutionDataContract = {
    requestId: context.request.execution?.requestId ?? request.requestId ?? request.id,
    executionId: executionEnvelope.executionId,
    correlationId: executionEnvelope.correlationId,
    tenant: context.request.tenant,
    product: result.product,
    subproduct: result.subproduct,
    status: result.status,
    decision: result.decision,
    result: result.result,
    proposals: result.proposals,
    ranking: result.ranking,
    warnings: result.warnings,
    rejectionReasons: result.rejectionReasons,
    snapshotReference: executionEnvelope.snapshotReference,
    auditReference: executionEnvelope.auditReference,
    engineVersion: executionEnvelope.engineVersion,
    catalogVersion: executionEnvelope.catalogVersion,
    policyVersion: executionEnvelope.policyVersion,
    strategyVersion: executionEnvelope.strategyVersion,
    executionTimestamp: executionEnvelope.executionTimestamp,
    compatibilityMode: executionEnvelope.compatibilityMode,
  };

  return {
    success: true,
    data,
  };
};
