import { z } from 'zod';

import { SIMULATION_RUNTIME_HTTP_ROUTE_INVENTORY } from './simulation-runtime.http.contract.js';

const nonEmptyStringSchema = z.string().trim().min(1).max(255);
const optionalStringSchema = z.string().trim().min(1).max(255).optional();
const uuidSchema = z.string().uuid();

const simulationRuntimeAssetSchema = z
  .object({
    id: optionalStringSchema,
    kind: nonEmptyStringSchema,
    label: nonEmptyStringSchema,
    value: z.number().finite().optional(),
    brand: optionalStringSchema,
    model: optionalStringSchema,
    year: z.number().int().optional(),
    plate: optionalStringSchema,
    chassi: optionalStringSchema,
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const simulationRuntimeProviderSchema = z
  .object({
    id: optionalStringSchema,
    key: optionalStringSchema,
    code: optionalStringSchema,
    name: optionalStringSchema,
    type: optionalStringSchema,
    channel: optionalStringSchema,
    active: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const simulationRuntimeParticipantSchema = z
  .object({
    id: optionalStringSchema,
    role: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    document: optionalStringSchema,
    email: z.string().trim().email().optional(),
    phone: optionalStringSchema,
    tenantId: optionalStringSchema,
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const simulationRuntimeGuaranteeSchema = z
  .object({
    id: optionalStringSchema,
    kind: nonEmptyStringSchema,
    label: nonEmptyStringSchema,
    value: z.number().finite().optional(),
    priority: z.number().finite().optional(),
    asset: simulationRuntimeAssetSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

const simulationRuntimeProductSchema = z
  .object({
    id: uuidSchema.or(nonEmptyStringSchema),
    code: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    slug: optionalStringSchema,
    category: optionalStringSchema,
    type: optionalStringSchema,
    order: z.number().int().optional(),
  })
  .strict();

const simulationRuntimeSubproductSchema = z
  .object({
    id: uuidSchema.or(nonEmptyStringSchema),
    productId: optionalStringSchema,
    code: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    slug: optionalStringSchema,
    category: optionalStringSchema,
    simulationEngine: optionalStringSchema,
    proposal: optionalStringSchema,
    provider: optionalStringSchema,
    workflow: optionalStringSchema,
    status: optionalStringSchema,
  })
  .strict();

const simulationRuntimeCommercialSchema = z
  .object({
    productId: optionalStringSchema,
    productCode: optionalStringSchema,
    subproductId: optionalStringSchema,
    subproductCode: optionalStringSchema,
    modality: optionalStringSchema,
    pipelineId: optionalStringSchema,
    pipelineCode: optionalStringSchema,
    commercialTableId: optionalStringSchema,
    commercialTableCode: optionalStringSchema,
    workflow: optionalStringSchema,
    segmentCode: optionalStringSchema,
  })
  .strict();

const simulationRuntimeMetadataSchema = z
  .object({
    compatibilityMode: z.enum(['CANONICAL', 'COMPATIBILITY', 'LEGACY']),
    origin: optionalStringSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    engineVersion: nonEmptyStringSchema,
    catalogVersion: nonEmptyStringSchema,
    policyVersion: nonEmptyStringSchema,
    strategyVersion: nonEmptyStringSchema,
  })
  .strict();

const simulationRuntimeVersioningSchema = z
  .object({
    version: nonEmptyStringSchema,
    revision: z.number().int().optional(),
  })
  .strict();

const simulationRuntimeExecutionSchema = z
  .object({
    executionId: optionalStringSchema,
    correlationId: optionalStringSchema,
    requestId: optionalStringSchema,
    snapshotId: optionalStringSchema,
    tenantId: optionalStringSchema,
    performedBy: optionalStringSchema,
    performedAt: z.string().datetime().optional(),
  })
  .strict();

export const simulationRuntimeRequestBodySchema = z
  .object({
    product: simulationRuntimeProductSchema,
    subproduct: simulationRuntimeSubproductSchema,
    customer: z
      .object({
        id: optionalStringSchema,
        role: nonEmptyStringSchema,
        name: nonEmptyStringSchema,
        document: optionalStringSchema,
        email: z.string().trim().email().optional(),
        phone: optionalStringSchema,
        tenantId: optionalStringSchema,
        metadata: z.record(z.unknown()).optional(),
      })
      .strict(),
    participants: z.array(simulationRuntimeParticipantSchema),
    guarantees: z.array(simulationRuntimeGuaranteeSchema),
    vehicle: simulationRuntimeAssetSchema.optional(),
    property: simulationRuntimeAssetSchema.optional(),
    income: z
      .object({
        monthlyValue: z.number().finite(),
        currency: optionalStringSchema,
        source: optionalStringSchema,
      })
      .strict()
      .optional(),
    agreement: z
      .object({
        id: optionalStringSchema,
        code: optionalStringSchema,
        name: optionalStringSchema,
      })
      .strict()
      .optional(),
    provider: simulationRuntimeProviderSchema.optional(),
    commercializadora: simulationRuntimeProviderSchema.optional(),
    bank: simulationRuntimeProviderSchema.optional(),
    corban: simulationRuntimeProviderSchema.optional(),
    channel: z
      .object({
        id: optionalStringSchema,
        code: optionalStringSchema,
        name: optionalStringSchema,
        type: optionalStringSchema,
      })
      .strict()
      .optional(),
    pipeline: z
      .object({
        id: optionalStringSchema,
        code: optionalStringSchema,
        name: optionalStringSchema,
        stageCode: optionalStringSchema,
        stageName: optionalStringSchema,
      })
      .strict()
      .optional(),
    opportunity: z
      .object({
        id: optionalStringSchema,
        code: optionalStringSchema,
        name: optionalStringSchema,
        pipelineId: optionalStringSchema,
        stageId: optionalStringSchema,
      })
      .strict()
      .optional(),
    commercial: simulationRuntimeCommercialSchema.optional(),
    parameters: z
      .object({
        requestedAmount: z.number().finite().optional(),
        term: z.number().finite().optional(),
        monthlyRate: z.number().finite().optional(),
        downPayment: z.number().finite().optional(),
        fees: z.number().finite().optional(),
        ltv: z.number().finite().optional(),
        rentCompromise: z.number().finite().optional(),
      })
      .catchall(z.unknown()),
    metadata: simulationRuntimeMetadataSchema,
    versioning: simulationRuntimeVersioningSchema,
    execution: simulationRuntimeExecutionSchema.optional(),
  })
  .strict();

export type SimulationRuntimeRequestBody = z.infer<typeof simulationRuntimeRequestBodySchema>;

const simulationRuntimeLooseObjectJsonSchema = {
  type: 'object',
  additionalProperties: true,
};

const simulationRuntimeStringJsonSchema = {
  type: 'string',
};

const simulationRuntimeNumberJsonSchema = {
  type: 'number',
};

const simulationRuntimeArrayJsonSchema = (items: unknown) => ({
  type: 'array',
  items,
});

const simulationRuntimeRequestBodyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'product',
    'subproduct',
    'customer',
    'participants',
    'guarantees',
    'parameters',
    'metadata',
    'versioning',
  ],
  properties: {
    product: {
      type: 'object',
      required: ['id', 'code', 'name'],
      additionalProperties: true,
      properties: {
        id: simulationRuntimeStringJsonSchema,
        code: simulationRuntimeStringJsonSchema,
        name: simulationRuntimeStringJsonSchema,
      },
    },
    subproduct: {
      type: 'object',
      required: ['id', 'code', 'name'],
      additionalProperties: true,
      properties: {
        id: simulationRuntimeStringJsonSchema,
        code: simulationRuntimeStringJsonSchema,
        name: simulationRuntimeStringJsonSchema,
      },
    },
    customer: {
      type: 'object',
      required: ['role', 'name'],
      additionalProperties: true,
      properties: {
        id: simulationRuntimeStringJsonSchema,
        role: simulationRuntimeStringJsonSchema,
        name: simulationRuntimeStringJsonSchema,
      },
    },
    participants: simulationRuntimeArrayJsonSchema(simulationRuntimeLooseObjectJsonSchema),
    guarantees: simulationRuntimeArrayJsonSchema(simulationRuntimeLooseObjectJsonSchema),
    vehicle: simulationRuntimeLooseObjectJsonSchema,
    property: simulationRuntimeLooseObjectJsonSchema,
    income: simulationRuntimeLooseObjectJsonSchema,
    agreement: simulationRuntimeLooseObjectJsonSchema,
    provider: simulationRuntimeLooseObjectJsonSchema,
    commercializadora: simulationRuntimeLooseObjectJsonSchema,
    bank: simulationRuntimeLooseObjectJsonSchema,
    corban: simulationRuntimeLooseObjectJsonSchema,
    channel: simulationRuntimeLooseObjectJsonSchema,
    pipeline: simulationRuntimeLooseObjectJsonSchema,
    opportunity: simulationRuntimeLooseObjectJsonSchema,
    commercial: simulationRuntimeLooseObjectJsonSchema,
    parameters: {
      type: 'object',
      additionalProperties: true,
      properties: {
        requestedAmount: simulationRuntimeNumberJsonSchema,
        term: simulationRuntimeNumberJsonSchema,
        monthlyRate: simulationRuntimeNumberJsonSchema,
        downPayment: simulationRuntimeNumberJsonSchema,
        fees: simulationRuntimeNumberJsonSchema,
        ltv: simulationRuntimeNumberJsonSchema,
        rentCompromise: simulationRuntimeNumberJsonSchema,
      },
    },
    metadata: {
      type: 'object',
      required: ['compatibilityMode', 'createdAt', 'engineVersion', 'catalogVersion', 'policyVersion', 'strategyVersion'],
      additionalProperties: true,
      properties: {
        compatibilityMode: simulationRuntimeStringJsonSchema,
        origin: simulationRuntimeStringJsonSchema,
        createdAt: simulationRuntimeStringJsonSchema,
        updatedAt: simulationRuntimeStringJsonSchema,
        engineVersion: simulationRuntimeStringJsonSchema,
        catalogVersion: simulationRuntimeStringJsonSchema,
        policyVersion: simulationRuntimeStringJsonSchema,
        strategyVersion: simulationRuntimeStringJsonSchema,
      },
    },
    versioning: {
      type: 'object',
      required: ['version'],
      additionalProperties: true,
      properties: {
        version: simulationRuntimeStringJsonSchema,
        revision: simulationRuntimeNumberJsonSchema,
      },
    },
    execution: simulationRuntimeLooseObjectJsonSchema,
  },
};

const simulationRuntimeResultItemJsonSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['key', 'label', 'value'],
  properties: {
    key: { type: 'string' },
    label: { type: 'string' },
    value: {},
    unit: { type: 'string' },
    reference: { type: 'string' },
  },
};

const simulationRuntimeProviderJsonSchema = {
  type: 'object',
  additionalProperties: true,
};

const simulationRuntimeRankingCandidateJsonSchema = {
  type: 'object',
  additionalProperties: true,
};

const simulationRuntimeDecisionJsonSchema = {
  type: 'object',
  additionalProperties: true,
};

const simulationRuntimeSnapshotReferenceJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['snapshotId', 'snapshotVersion'],
  properties: {
    snapshotId: { type: 'string' },
    snapshotVersion: { type: 'string' },
    checksum: { type: 'string' },
    source: { type: 'string' },
    capturedAt: { type: 'string' },
  },
};

const simulationRuntimeAuditReferenceJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['auditId'],
  properties: {
    auditId: { type: 'string' },
    auditCode: { type: 'string' },
  },
};

const simulationRuntimeResponseDataJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'executionId',
    'correlationId',
    'tenant',
    'product',
    'subproduct',
    'status',
    'decision',
    'result',
    'proposals',
    'ranking',
    'warnings',
    'rejectionReasons',
    'snapshotReference',
    'auditReference',
    'engineVersion',
    'catalogVersion',
    'policyVersion',
    'strategyVersion',
    'executionTimestamp',
    'compatibilityMode',
  ],
  properties: {
    requestId: { type: ['string', 'null'] },
    executionId: { type: 'string' },
    correlationId: { type: 'string' },
    tenant: { type: 'object', additionalProperties: true },
    product: { type: 'object', additionalProperties: true },
    subproduct: { type: 'object', additionalProperties: true },
    status: { type: 'string' },
    decision: simulationRuntimeDecisionJsonSchema,
    result: {
      type: 'array',
      items: simulationRuntimeResultItemJsonSchema,
    },
    proposals: {
      type: 'array',
      items: simulationRuntimeProviderJsonSchema,
    },
    ranking: {
      type: 'object',
      additionalProperties: true,
      properties: {
        candidates: {
          type: 'array',
          items: simulationRuntimeRankingCandidateJsonSchema,
        },
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
    rejectionReasons: {
      type: 'array',
      items: { type: 'string' },
    },
    snapshotReference: simulationRuntimeSnapshotReferenceJsonSchema,
    auditReference: simulationRuntimeAuditReferenceJsonSchema,
    engineVersion: { type: 'string' },
    catalogVersion: { type: 'string' },
    policyVersion: { type: 'string' },
    strategyVersion: { type: 'string' },
    executionTimestamp: { type: 'string' },
    compatibilityMode: { type: 'string' },
  },
};

const simulationRuntimeSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: simulationRuntimeResponseDataJsonSchema,
  },
};

const simulationRuntimeErrorResponseJsonSchema = {
  type: 'object',
  required: ['success', 'requestId', 'message'],
  properties: {
    success: { type: 'boolean', enum: [false] },
    requestId: { type: 'string', minLength: 1 },
    message: { type: 'string' },
    code: { type: 'string' },
    errors: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

export const simulationRuntimeRouteSchema = {
  tags: ['Simulation Runtime'],
  security: [{ bearerAuth: [] }],
  body: simulationRuntimeRequestBodyJsonSchema,
  response: {
    200: simulationRuntimeSuccessResponseJsonSchema,
    400: simulationRuntimeErrorResponseJsonSchema,
    401: simulationRuntimeErrorResponseJsonSchema,
    403: simulationRuntimeErrorResponseJsonSchema,
    422: simulationRuntimeErrorResponseJsonSchema,
    500: simulationRuntimeErrorResponseJsonSchema,
  },
} as const;

export type SimulationRuntimeRequestBodySchema = z.infer<typeof simulationRuntimeRequestBodySchema>;

export const simulationRuntimeRouteInventory = SIMULATION_RUNTIME_HTTP_ROUTE_INVENTORY;
