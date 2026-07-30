import type { Prisma, SimulationRuntimeEvidence as SimulationRuntimeEvidenceModel } from '@prisma/client';

import type {
  SimulationRuntimeEvidenceRecord,
} from '../../domain/simulation-runtime-evidence.types.js';

export type SimulationRuntimeEvidenceCreateInput =
  Prisma.SimulationRuntimeEvidenceUncheckedCreateInput;

type SimulationRuntimeEvidenceRow = SimulationRuntimeEvidenceModel;

const toDate = (value: string | Date): Date => (
  value instanceof Date ? new Date(value) : new Date(value)
);

export const toSimulationRuntimeEvidenceCreateInput = (
  evidence: SimulationRuntimeEvidenceRecord,
): SimulationRuntimeEvidenceCreateInput => ({
  tenantId: evidence.tenantId,
  evidenceId: evidence.evidenceId,
  campaignId: evidence.campaignId,
  timestamp: toDate(evidence.timestamp),
  environment: evidence.environment,
  tenantIdHash: evidence.tenantIdHash,
  opportunityIdHash: evidence.opportunityIdHash,
  requestId: evidence.requestId,
  correlationId: evidence.correlationId,
  executionId: evidence.executionId,
  productCode: evidence.productCode,
  subproductCode: evidence.subproductCode,
  legacyStatus: evidence.legacyStatus,
  canonicalStatus: evidence.canonicalStatus,
  comparisonStatus: evidence.comparisonStatus as SimulationRuntimeEvidenceRecord['comparisonStatus'],
  divergenceCategory: evidence.divergenceCategory as SimulationRuntimeEvidenceRecord['divergenceCategory'],
  divergenceCount: evidence.divergenceCount,
  financialCriticalCount: evidence.financialCriticalCount,
  financialMinorCount: evidence.financialMinorCount,
  structuralCount: evidence.structuralCount,
  missingCanonicalFieldCount: evidence.missingCanonicalFieldCount,
  missingLegacyFieldCount: evidence.missingLegacyFieldCount,
  mappingFailure: evidence.mappingFailure,
  runtimeFailure: evidence.runtimeFailure,
  unsupportedScenario: evidence.unsupportedScenario,
  legacyDurationMs: evidence.legacyDurationMs,
  runtimeDurationMs: evidence.runtimeDurationMs,
  fallbackUsed: evidence.fallbackUsed,
  shadowMode: evidence.shadowMode,
  comparatorVersion: evidence.comparatorVersion,
  contractVersion: evidence.contractVersion,
  catalogVersion: evidence.catalogVersion,
  engineVersion: evidence.engineVersion,
  policyVersion: evidence.policyVersion,
  strategyVersion: evidence.strategyVersion,
  receivedByUserId: evidence.receivedByUserId,
  receivedAt: toDate(evidence.receivedAt),
});

export const toSimulationRuntimeEvidenceRecord = (
  evidence: SimulationRuntimeEvidenceRow,
): SimulationRuntimeEvidenceRecord => ({
  tenantId: evidence.tenantId,
  evidenceId: evidence.evidenceId,
  campaignId: evidence.campaignId,
  timestamp: evidence.timestamp.toISOString(),
  environment: evidence.environment,
  tenantIdHash: evidence.tenantIdHash,
  opportunityIdHash: evidence.opportunityIdHash,
  requestId: evidence.requestId,
  correlationId: evidence.correlationId,
  executionId: evidence.executionId,
  productCode: evidence.productCode,
  subproductCode: evidence.subproductCode,
  legacyStatus: evidence.legacyStatus,
  canonicalStatus: evidence.canonicalStatus,
  comparisonStatus: evidence.comparisonStatus as SimulationRuntimeEvidenceRecord['comparisonStatus'],
  divergenceCategory: evidence.divergenceCategory as SimulationRuntimeEvidenceRecord['divergenceCategory'],
  divergenceCount: evidence.divergenceCount,
  financialCriticalCount: evidence.financialCriticalCount,
  financialMinorCount: evidence.financialMinorCount,
  structuralCount: evidence.structuralCount,
  missingCanonicalFieldCount: evidence.missingCanonicalFieldCount,
  missingLegacyFieldCount: evidence.missingLegacyFieldCount,
  mappingFailure: evidence.mappingFailure,
  runtimeFailure: evidence.runtimeFailure,
  unsupportedScenario: evidence.unsupportedScenario,
  legacyDurationMs: evidence.legacyDurationMs,
  runtimeDurationMs: evidence.runtimeDurationMs,
  fallbackUsed: evidence.fallbackUsed,
  shadowMode: evidence.shadowMode,
  comparatorVersion: evidence.comparatorVersion,
  contractVersion: evidence.contractVersion,
  catalogVersion: evidence.catalogVersion,
  engineVersion: evidence.engineVersion,
  policyVersion: evidence.policyVersion,
  strategyVersion: evidence.strategyVersion,
  receivedByUserId: evidence.receivedByUserId,
  receivedAt: evidence.receivedAt,
});
