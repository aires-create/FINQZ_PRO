import {
  InvalidSimulationRuntimeEvidenceError,
} from './simulation-runtime-evidence.errors.js';
import type {
  SimulationRuntimeEvidenceContext,
  SimulationRuntimeEvidenceInput,
  SimulationRuntimeEvidenceRecord,
} from './simulation-runtime-evidence.types.js';

const CAMPAIGN_ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]{2,99}$/;

const requiredTextFields: ReadonlyArray<
  keyof Pick<
    SimulationRuntimeEvidenceInput,
    | 'evidenceId'
    | 'campaignId'
    | 'timestamp'
    | 'environment'
    | 'requestId'
    | 'correlationId'
    | 'executionId'
    | 'productCode'
    | 'subproductCode'
    | 'canonicalStatus'
    | 'comparatorVersion'
    | 'contractVersion'
    | 'catalogVersion'
    | 'engineVersion'
    | 'policyVersion'
    | 'strategyVersion'
  >
> = [
  'evidenceId',
  'campaignId',
  'timestamp',
  'environment',
  'requestId',
  'correlationId',
  'executionId',
  'productCode',
  'subproductCode',
  'canonicalStatus',
  'comparatorVersion',
  'contractVersion',
  'catalogVersion',
  'engineVersion',
  'policyVersion',
  'strategyVersion',
];

const countFields: ReadonlyArray<
  keyof Pick<
    SimulationRuntimeEvidenceInput,
    | 'divergenceCount'
    | 'financialCriticalCount'
    | 'financialMinorCount'
    | 'structuralCount'
    | 'missingCanonicalFieldCount'
    | 'missingLegacyFieldCount'
  >
> = [
  'divergenceCount',
  'financialCriticalCount',
  'financialMinorCount',
  'structuralCount',
  'missingCanonicalFieldCount',
  'missingLegacyFieldCount',
];

const assertRequiredText = (
  input: SimulationRuntimeEvidenceInput,
): void => {
  for (const field of requiredTextFields) {
    if (!input[field].trim()) {
      throw new InvalidSimulationRuntimeEvidenceError(
        `Simulation runtime evidence field is required: ${field}`,
      );
    }
  }
};

const assertCounts = (
  input: SimulationRuntimeEvidenceInput,
): void => {
  for (const field of countFields) {
    const value = input[field];

    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidSimulationRuntimeEvidenceError(
        `Simulation runtime evidence count must be a non-negative integer: ${field}`,
      );
    }
  }
};

const assertDuration = (
  field: 'legacyDurationMs' | 'runtimeDurationMs',
  value: number | null,
): void => {
  if (
    value !== null &&
    (!Number.isFinite(value) || value < 0)
  ) {
    throw new InvalidSimulationRuntimeEvidenceError(
      `Simulation runtime evidence duration must be null or non-negative: ${field}`,
    );
  }
};

export const createSimulationRuntimeEvidenceRecord = (
  input: SimulationRuntimeEvidenceInput,
  context: SimulationRuntimeEvidenceContext,
): SimulationRuntimeEvidenceRecord => {
  assertRequiredText(input);
  assertCounts(input);

  if (!CAMPAIGN_ID_PATTERN.test(input.campaignId)) {
    throw new InvalidSimulationRuntimeEvidenceError(
      'Simulation runtime evidence campaignId has an invalid format',
    );
  }

  if (Number.isNaN(Date.parse(input.timestamp))) {
    throw new InvalidSimulationRuntimeEvidenceError(
      'Simulation runtime evidence timestamp is invalid',
    );
  }

  if (!context.tenantId.trim()) {
    throw new InvalidSimulationRuntimeEvidenceError(
      'Simulation runtime evidence tenantId is required',
    );
  }

  if (!input.shadowMode) {
    throw new InvalidSimulationRuntimeEvidenceError(
      'Simulation runtime evidence must originate from Shadow Mode',
    );
  }

  assertDuration('legacyDurationMs', input.legacyDurationMs);
  assertDuration('runtimeDurationMs', input.runtimeDurationMs);

  return {
    ...input,
    tenantId: context.tenantId,
    receivedAt: new Date(context.receivedAt),
    receivedByUserId: context.receivedByUserId,
  };
};
