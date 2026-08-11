import { z } from 'zod';

import { SIMULATION_RUNTIME_EVIDENCE_HTTP_ROUTE_INVENTORY } from './simulation-runtime-evidence.http.contract.js';

const CAMPAIGN_ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]{2,99}$/;

const comparisonStatuses = [
  'EQUIVALENT',
  'EQUIVALENT_WITH_INFORMATIONAL_DIFFERENCES',
  'EXPECTED_COMPATIBILITY_DIFFERENCE',
  'NON_EQUIVALENT_MINOR',
  'NON_EQUIVALENT_CRITICAL',
  'STRUCTURALLY_INCOMPATIBLE',
  'MAPPING_FAILURE',
  'RUNTIME_FAILURE',
  'UNSUPPORTED_SCENARIO',
  'INSUFFICIENT_DATA',
] as const;

const divergenceCategories = [
  'NONE',
  'INFORMATIONAL',
  'EXPECTED_COMPATIBILITY',
  'FINANCIAL_MINOR',
  'FINANCIAL_CRITICAL',
  'STRUCTURAL',
  'MISSING_CANONICAL_FIELD',
  'MISSING_LEGACY_FIELD',
  'MAPPING_FAILURE',
  'RUNTIME_FAILURE',
  'UNSUPPORTED_SCENARIO',
] as const;

const textSchema = z.string().trim().min(1).max(128);
const versionSchema = z.string().trim().min(1).max(64);
const hashSchema = z.string().trim().min(8).max(128).nullish();

export const simulationRuntimeEvidenceRequestBodySchema = z.object({
  evidenceId: textSchema,
  campaignId: z.string().trim().min(1).max(100).regex(CAMPAIGN_ID_PATTERN),
  timestamp: z.string().datetime(),
  environment: z.string().trim().min(1).max(64),
  tenantIdHash: hashSchema,
  opportunityIdHash: hashSchema,
  requestId: textSchema,
  correlationId: textSchema,
  executionId: textSchema,
  productCode: z.string().trim().min(1).max(64),
  subproductCode: z.string().trim().min(1).max(64),
  legacyStatus: z.string().trim().min(1).max(64).nullish(),
  canonicalStatus: z.string().trim().min(1).max(64),
  comparisonStatus: z.enum(comparisonStatuses),
  divergenceCategory: z.enum(divergenceCategories),
  divergenceCount: z.number().int().nonnegative(),
  financialCriticalCount: z.number().int().nonnegative(),
  financialMinorCount: z.number().int().nonnegative(),
  structuralCount: z.number().int().nonnegative(),
  missingCanonicalFieldCount: z.number().int().nonnegative(),
  missingLegacyFieldCount: z.number().int().nonnegative(),
  mappingFailure: z.boolean(),
  runtimeFailure: z.boolean(),
  unsupportedScenario: z.boolean(),
  legacyDurationMs: z.number().int().nonnegative().nullable(),
  runtimeDurationMs: z.number().int().nonnegative().nullable(),
  fallbackUsed: z.boolean(),
  shadowMode: z.literal(true),
  comparatorVersion: versionSchema,
  contractVersion: versionSchema,
  catalogVersion: versionSchema,
  engineVersion: versionSchema,
  policyVersion: versionSchema,
  strategyVersion: versionSchema,
}).strict();

export type SimulationRuntimeEvidenceRequestBodySchema = z.infer<
  typeof simulationRuntimeEvidenceRequestBodySchema
>;

const simulationRuntimeEvidenceStringJsonSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 128,
};

const simulationRuntimeEvidenceNullableStringJsonSchema = {
  anyOf: [
    { type: 'string', minLength: 1, maxLength: 128 },
    { type: 'null' },
  ],
};

const simulationRuntimeEvidenceNumberJsonSchema = {
  type: 'integer',
  minimum: 0,
};

const simulationRuntimeEvidenceRequestBodyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
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
    'comparisonStatus',
    'divergenceCategory',
    'divergenceCount',
    'financialCriticalCount',
    'financialMinorCount',
    'structuralCount',
    'missingCanonicalFieldCount',
    'missingLegacyFieldCount',
    'mappingFailure',
    'runtimeFailure',
    'unsupportedScenario',
    'legacyDurationMs',
    'runtimeDurationMs',
    'fallbackUsed',
    'shadowMode',
    'comparatorVersion',
    'contractVersion',
    'catalogVersion',
    'engineVersion',
    'policyVersion',
    'strategyVersion',
  ],
  properties: {
    evidenceId: simulationRuntimeEvidenceStringJsonSchema,
    campaignId: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: CAMPAIGN_ID_PATTERN.source,
    },
    timestamp: { type: 'string', format: 'date-time' },
    environment: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    tenantIdHash: {
      ...simulationRuntimeEvidenceNullableStringJsonSchema,
    },
    opportunityIdHash: {
      ...simulationRuntimeEvidenceNullableStringJsonSchema,
    },
    requestId: simulationRuntimeEvidenceStringJsonSchema,
    correlationId: simulationRuntimeEvidenceStringJsonSchema,
    executionId: simulationRuntimeEvidenceStringJsonSchema,
    productCode: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    subproductCode: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    legacyStatus: {
      anyOf: [
        { type: 'string', minLength: 1, maxLength: 64 },
        { type: 'null' },
      ],
    },
    canonicalStatus: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    comparisonStatus: {
      type: 'string',
      enum: [...comparisonStatuses],
    },
    divergenceCategory: {
      type: 'string',
      enum: [...divergenceCategories],
    },
    divergenceCount: simulationRuntimeEvidenceNumberJsonSchema,
    financialCriticalCount: simulationRuntimeEvidenceNumberJsonSchema,
    financialMinorCount: simulationRuntimeEvidenceNumberJsonSchema,
    structuralCount: simulationRuntimeEvidenceNumberJsonSchema,
    missingCanonicalFieldCount: simulationRuntimeEvidenceNumberJsonSchema,
    missingLegacyFieldCount: simulationRuntimeEvidenceNumberJsonSchema,
    mappingFailure: { type: 'boolean' },
    runtimeFailure: { type: 'boolean' },
    unsupportedScenario: { type: 'boolean' },
    legacyDurationMs: {
      anyOf: [
        simulationRuntimeEvidenceNumberJsonSchema,
        { type: 'null' },
      ],
    },
    runtimeDurationMs: {
      anyOf: [
        simulationRuntimeEvidenceNumberJsonSchema,
        { type: 'null' },
      ],
    },
    fallbackUsed: { type: 'boolean' },
    shadowMode: { type: 'boolean', enum: [true] },
    comparatorVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    contractVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    catalogVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    engineVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    policyVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    strategyVersion: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
  },
};

const simulationRuntimeEvidenceResponseDataJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidenceId',
    'campaignId',
    'requestId',
    'correlationId',
    'executionId',
    'productCode',
    'subproductCode',
    'comparisonStatus',
    'divergenceCategory',
    'shadowMode',
    'timestamp',
    'receivedAt',
  ],
  properties: {
    evidenceId: simulationRuntimeEvidenceStringJsonSchema,
    campaignId: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: CAMPAIGN_ID_PATTERN.source,
    },
    requestId: simulationRuntimeEvidenceStringJsonSchema,
    correlationId: simulationRuntimeEvidenceStringJsonSchema,
    executionId: simulationRuntimeEvidenceStringJsonSchema,
    productCode: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    subproductCode: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    comparisonStatus: {
      type: 'string',
      enum: [...comparisonStatuses],
    },
    divergenceCategory: {
      type: 'string',
      enum: [...divergenceCategories],
    },
    shadowMode: { type: 'boolean', enum: [true] },
    timestamp: { type: 'string', format: 'date-time' },
    receivedAt: { type: 'string', format: 'date-time' },
  },
};

const simulationRuntimeEvidenceSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: simulationRuntimeEvidenceResponseDataJsonSchema,
  },
};

export const simulationRuntimeEvidenceRouteSchema = {
  tags: ['Simulation Runtime Evidence'],
  security: [{ bearerAuth: [] }],
  body: simulationRuntimeEvidenceRequestBodyJsonSchema,
  response: {
    200: simulationRuntimeEvidenceSuccessResponseJsonSchema,
    201: simulationRuntimeEvidenceSuccessResponseJsonSchema,
  },
} as const;

export const simulationRuntimeEvidenceRouteInventory =
  SIMULATION_RUNTIME_EVIDENCE_HTTP_ROUTE_INVENTORY;
