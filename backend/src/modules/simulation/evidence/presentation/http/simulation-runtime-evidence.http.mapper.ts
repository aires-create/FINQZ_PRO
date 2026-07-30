import type { FastifyRequest } from 'fastify';

import type { SimulationRuntimeEvidenceRecord } from '../../domain/simulation-runtime-evidence.types.js';
import type { SimulationRuntimeEvidenceContext, SimulationRuntimeEvidenceInput } from '../../domain/simulation-runtime-evidence.types.js';
import type { SimulationRuntimeEvidenceHttpRequestBodyContract, SimulationRuntimeEvidenceHttpSuccessResponseContract } from './simulation-runtime-evidence.http.contract.js';

const toNullableString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const buildSimulationRuntimeEvidenceInput = (
  body: SimulationRuntimeEvidenceHttpRequestBodyContract,
): SimulationRuntimeEvidenceInput => ({
  evidenceId: body.evidenceId,
  campaignId: body.campaignId,
  timestamp: body.timestamp,
  environment: body.environment,
  tenantIdHash: toNullableString(body.tenantIdHash),
  opportunityIdHash: toNullableString(body.opportunityIdHash),
  requestId: body.requestId,
  correlationId: body.correlationId,
  executionId: body.executionId,
  productCode: body.productCode,
  subproductCode: body.subproductCode,
  legacyStatus: toNullableString(body.legacyStatus),
  canonicalStatus: body.canonicalStatus,
  comparisonStatus: body.comparisonStatus,
  divergenceCategory: body.divergenceCategory,
  divergenceCount: body.divergenceCount,
  financialCriticalCount: body.financialCriticalCount,
  financialMinorCount: body.financialMinorCount,
  structuralCount: body.structuralCount,
  missingCanonicalFieldCount: body.missingCanonicalFieldCount,
  missingLegacyFieldCount: body.missingLegacyFieldCount,
  mappingFailure: body.mappingFailure,
  runtimeFailure: body.runtimeFailure,
  unsupportedScenario: body.unsupportedScenario,
  legacyDurationMs: body.legacyDurationMs,
  runtimeDurationMs: body.runtimeDurationMs,
  fallbackUsed: body.fallbackUsed,
  shadowMode: body.shadowMode,
  comparatorVersion: body.comparatorVersion,
  contractVersion: body.contractVersion,
  catalogVersion: body.catalogVersion,
  engineVersion: body.engineVersion,
  policyVersion: body.policyVersion,
  strategyVersion: body.strategyVersion,
});

export const buildSimulationRuntimeEvidenceContext = (
  request: FastifyRequest,
): SimulationRuntimeEvidenceContext => ({
  tenantId: request.currentTenant?.tenantId ?? '',
  receivedAt: new Date(),
  receivedByUserId: request.currentUser?.userId ?? request.currentTenant?.userId ?? null,
});

export const mapSimulationRuntimeEvidenceRecordToHttpResponse = (
  record: SimulationRuntimeEvidenceRecord,
): SimulationRuntimeEvidenceHttpSuccessResponseContract => ({
  success: true,
  data: {
    evidenceId: record.evidenceId,
    campaignId: record.campaignId,
    requestId: record.requestId,
    correlationId: record.correlationId,
    executionId: record.executionId,
    productCode: record.productCode,
    subproductCode: record.subproductCode,
    comparisonStatus: record.comparisonStatus,
    divergenceCategory: record.divergenceCategory,
    shadowMode: record.shadowMode,
    timestamp: record.timestamp,
    receivedAt: record.receivedAt.toISOString(),
  },
});
