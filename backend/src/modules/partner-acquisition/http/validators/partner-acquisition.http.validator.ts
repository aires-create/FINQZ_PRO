import { z } from 'zod';

import {
  PARTNER_ACQUISITION_REFERENCE_KINDS,
  PARTNER_LEAD_CHANNELS,
  PARTNER_LEAD_STATUSES,
  PARTNER_PROSPECT_STATUSES,
} from '../../domain/partner-acquisition.contract.js';

const uuidSchema = z.string().uuid();
const isoDateTimeSchema = z.string().datetime();
const nonEmptyStringSchema = z.string().trim().min(1).max(128);
const longTextSchema = z.string().trim().min(1).max(255);
const optionalTextSchema = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).optional().nullable();

export const partnerAcquisitionSourceSchema = z.enum(PARTNER_LEAD_CHANNELS);
export const partnerAcquisitionLeadStatusSchema = z.enum(PARTNER_LEAD_STATUSES);
export const partnerAcquisitionProspectStatusSchema = z.enum(PARTNER_PROSPECT_STATUSES);

export const partnerAcquisitionReferenceSchema = z
  .object({
    kind: z.enum(PARTNER_ACQUISITION_REFERENCE_KINDS),
    refType: z.enum([
      'PIPELINE',
      'SDR_IA',
      'AUTOMATION',
      'CAMPAIGN',
      'MAILING',
      'BASE',
      'SOCIAL_MEDIA',
      'REFERRAL',
      'LANDING_PAGE',
      'MANUAL',
      'PARTNER_REFERRAL',
      'OUTBOUND',
      'EVENT',
      'OTHER',
    ]),
    refId: nonEmptyStringSchema,
    refLabel: optionalTextSchema(200),
  })
  .strict();

export const partnerAcquisitionCommandMetadataSchema = z
  .object({
    source: partnerAcquisitionSourceSchema.optional(),
    references: z.array(partnerAcquisitionReferenceSchema).optional(),
    pipelineCode: z.string().trim().min(1).max(100).optional().nullable(),
    stageCode: z.string().trim().min(1).max(100).optional().nullable(),
    sdrAgentId: uuidSchema.optional().nullable(),
    automationCode: z.string().trim().min(1).max(100).optional().nullable(),
    campaignId: uuidSchema.optional().nullable(),
    trace: z.record(z.unknown()).optional(),
  })
  .strict();

export const partnerAcquisitionHttpHeadersSchema = z
  .object({
    tenantId: uuidSchema,
    requestId: nonEmptyStringSchema,
    correlationId: nonEmptyStringSchema,
    actorUserId: uuidSchema,
    idempotencyKey: nonEmptyStringSchema.optional(),
  })
  .strict();

export const partnerAcquisitionHttpMutatingHeadersSchema = partnerAcquisitionHttpHeadersSchema
  .extend({
    idempotencyKey: nonEmptyStringSchema,
  })
  .strict();

export const partnerAcquisitionHttpPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'fullName',
        'status',
        'score',
        'signedAt',
        'convertedAt',
      ])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const partnerAcquisitionLeadListQuerySchema = partnerAcquisitionHttpPaginationSchema
  .extend({
    status: partnerAcquisitionLeadStatusSchema.optional(),
    source: partnerAcquisitionSourceSchema.optional(),
    ownerUserId: uuidSchema.optional(),
  })
  .strict();

export const partnerAcquisitionProspectListQuerySchema = partnerAcquisitionHttpPaginationSchema
  .extend({
    status: partnerAcquisitionProspectStatusSchema.optional(),
    source: partnerAcquisitionSourceSchema.optional(),
    pipelineCode: z.string().trim().min(1).max(100).optional(),
    stageCode: z.string().trim().min(1).max(100).optional(),
    assignedUserId: uuidSchema.optional(),
  })
  .strict();

export const partnerAcquisitionLeadIdParamsSchema = z
  .object({
    leadId: uuidSchema,
  })
  .strict();

export const partnerAcquisitionProspectIdParamsSchema = z
  .object({
    prospectId: uuidSchema,
  })
  .strict();

export const partnerAcquisitionActionParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const partnerAcquisitionLeadCreateBodySchema = z
  .object({
    leadCode: nonEmptyStringSchema,
    fullName: longTextSchema,
    email: z.string().trim().email().max(254).optional().nullable(),
    phone: optionalTextSchema(30),
    companyName: optionalTextSchema(120),
    document: optionalTextSchema(30),
    source: partnerAcquisitionSourceSchema,
    sourceName: optionalTextSchema(120),
    sourceReference: optionalTextSchema(120),
    campaignId: uuidSchema.optional().nullable(),
    hubContextId: optionalTextSchema(200),
    ownerUserId: uuidSchema.optional().nullable(),
    metadata: partnerAcquisitionCommandMetadataSchema.optional(),
    references: z.array(partnerAcquisitionReferenceSchema).optional(),
  })
  .strict();

export const partnerAcquisitionProspectCreateBodySchema = z
  .object({
    prospectCode: nonEmptyStringSchema,
    leadId: uuidSchema,
    fullName: longTextSchema,
    email: z.string().trim().email().max(254).optional().nullable(),
    phone: optionalTextSchema(30),
    companyName: optionalTextSchema(120),
    document: optionalTextSchema(30),
    source: partnerAcquisitionSourceSchema,
    sourceName: optionalTextSchema(120),
    sourceReference: optionalTextSchema(120),
    campaignId: uuidSchema.optional().nullable(),
    hubContextId: optionalTextSchema(200),
    sdrAgentId: uuidSchema.optional().nullable(),
    status: partnerAcquisitionProspectStatusSchema.optional(),
    pipelineId: uuidSchema.optional().nullable(),
    stageId: uuidSchema.optional().nullable(),
    pipelineCode: optionalTextSchema(100),
    stageCode: optionalTextSchema(100),
    score: z.number().int().min(0).max(100).optional().nullable(),
    qualificationReason: optionalTextSchema(255),
    assignedUserId: uuidSchema.optional().nullable(),
    nextActionAt: isoDateTimeSchema.optional().nullable(),
    signedAt: isoDateTimeSchema.optional().nullable(),
    convertedAt: isoDateTimeSchema.optional().nullable(),
    partnerId: uuidSchema.optional().nullable(),
    metadata: partnerAcquisitionCommandMetadataSchema.optional(),
    references: z.array(partnerAcquisitionReferenceSchema).optional(),
  })
  .strict();

const partnerAcquisitionExpectedVersionSchema = z.number().int().min(0);

export const partnerAcquisitionQualifyBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    score: z.number().int().min(0).max(100).optional().nullable(),
    qualificationReason: optionalTextSchema(255),
  })
  .strict();

export const partnerAcquisitionDisqualifyBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    reason: longTextSchema,
  })
  .strict();

export const partnerAcquisitionNegotiationBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    negotiationReason: optionalTextSchema(255),
  })
  .strict();

export const partnerAcquisitionDocumentationRequestBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    requestedDocuments: z.array(z.string().trim().min(1).max(120)).optional(),
    dueAt: isoDateTimeSchema.optional().nullable(),
  })
  .strict();

export const partnerAcquisitionDocumentationReceivedBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    receivedDocuments: z.array(z.string().trim().min(1).max(120)).optional(),
  })
  .strict();

export const partnerAcquisitionContractRequestBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    contractTemplateCode: optionalTextSchema(100),
    contractReference: optionalTextSchema(120),
  })
  .strict();

export const partnerAcquisitionContractSignedBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    signedAt: isoDateTimeSchema,
    contractReference: optionalTextSchema(120),
    signatureProvider: optionalTextSchema(120),
  })
  .strict();

export const partnerAcquisitionConversionApproveBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    approvalNotes: optionalTextSchema(255),
  })
  .strict();

export const partnerAcquisitionConversionRejectBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    reason: longTextSchema,
  })
  .strict();

export const partnerAcquisitionConvertBodySchema = z
  .object({
    expectedVersion: partnerAcquisitionExpectedVersionSchema,
    partnerId: uuidSchema,
    partnerCode: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/),
    partnerName: z.string().trim().min(1).max(120),
    partnerType: z.enum(['COMPANY', 'FRANQUIA', 'FRANQUEADO']),
    conversionApprovedAt: isoDateTimeSchema.optional().nullable(),
  })
  .strict();

export const partnerAcquisitionLeadDtoSchema = z
  .object({
    tenantId: uuidSchema,
    leadId: uuidSchema,
    leadCode: nonEmptyStringSchema,
    fullName: longTextSchema,
    email: z.string().trim().email().max(254).nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    companyName: z.string().trim().max(120).nullable().optional(),
    document: z.string().trim().max(30).nullable().optional(),
    source: partnerAcquisitionSourceSchema,
    sourceName: z.string().trim().max(120).nullable().optional(),
    sourceReference: z.string().trim().max(120).nullable().optional(),
    campaignId: uuidSchema.nullable().optional(),
    hubContextId: z.string().trim().max(200).nullable().optional(),
    ownerUserId: uuidSchema.nullable().optional(),
    status: partnerAcquisitionLeadStatusSchema,
    score: z.number().int().min(0).max(100).nullable().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const partnerAcquisitionProspectDtoSchema = z
  .object({
    tenantId: uuidSchema,
    prospectId: uuidSchema,
    prospectCode: nonEmptyStringSchema,
    leadId: uuidSchema,
    fullName: longTextSchema,
    email: z.string().trim().email().max(254).nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    companyName: z.string().trim().max(120).nullable().optional(),
    document: z.string().trim().max(30).nullable().optional(),
    source: partnerAcquisitionSourceSchema,
    sourceName: z.string().trim().max(120).nullable().optional(),
    sourceReference: z.string().trim().max(120).nullable().optional(),
    campaignId: uuidSchema.nullable().optional(),
    hubContextId: z.string().trim().max(200).nullable().optional(),
    sdrAgentId: uuidSchema.nullable().optional(),
    status: partnerAcquisitionProspectStatusSchema,
    pipelineId: uuidSchema.nullable().optional(),
    stageId: uuidSchema.nullable().optional(),
    pipelineCode: z.string().trim().max(100).nullable().optional(),
    stageCode: z.string().trim().max(100).nullable().optional(),
    score: z.number().int().min(0).max(100).nullable().optional(),
    qualificationReason: z.string().trim().max(255).nullable().optional(),
    assignedUserId: uuidSchema.nullable().optional(),
    nextActionAt: isoDateTimeSchema.nullable().optional(),
    signedAt: isoDateTimeSchema.nullable().optional(),
    convertedAt: isoDateTimeSchema.nullable().optional(),
    partnerId: uuidSchema.nullable().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const partnerAcquisitionConversionDecisionDtoSchema = z
  .object({
    tenantId: uuidSchema,
    prospectId: uuidSchema,
    partnerId: uuidSchema.nullable().optional(),
    approved: z.boolean(),
    decidedByUserId: uuidSchema,
    decidedAt: isoDateTimeSchema,
    reason: z.string().trim().max(255).nullable().optional(),
  })
  .strict();

export const partnerAcquisitionConversionResponseDtoSchema = z
  .object({
    prospect: partnerAcquisitionProspectDtoSchema,
    conversionDecision: partnerAcquisitionConversionDecisionDtoSchema,
  })
  .strict();

export const partnerAcquisitionPageMetaSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    sortBy: z.string().trim().min(1),
    sortOrder: z.enum(['asc', 'desc']),
  })
  .strict();

export const partnerAcquisitionSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z
    .object({
      success: z.literal(true),
      data: dataSchema,
    })
    .strict();

export const partnerAcquisitionListEnvelopeSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z
    .object({
      success: z.literal(true),
      data: z.array(itemSchema),
      meta: partnerAcquisitionPageMetaSchema,
    })
    .strict();

export const partnerAcquisitionErrorSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.enum([
          'VALIDATION_ERROR',
          'UNAUTHORIZED',
          'FORBIDDEN',
          'NOT_FOUND',
          'CONFLICT',
          'OPTIMISTIC_LOCK_ERROR',
          'IDEMPOTENCY_CONFLICT',
          'DOMAIN_RULE_VIOLATION',
          'INTERNAL_ERROR',
        ]),
        message: nonEmptyStringSchema,
        details: z.record(z.unknown()).nullable().optional(),
      })
      .strict(),
  })
  .strict();

export type PartnerAcquisitionSource = z.infer<typeof partnerAcquisitionSourceSchema>;
export type PartnerAcquisitionLeadStatus = z.infer<typeof partnerAcquisitionLeadStatusSchema>;
export type PartnerAcquisitionProspectStatus = z.infer<
  typeof partnerAcquisitionProspectStatusSchema
>;
export type PartnerAcquisitionReference = z.infer<typeof partnerAcquisitionReferenceSchema>;
export type PartnerAcquisitionCommandMetadata = z.infer<
  typeof partnerAcquisitionCommandMetadataSchema
>;
export type PartnerAcquisitionHttpHeaders = z.infer<
  typeof partnerAcquisitionHttpHeadersSchema
>;
export type PartnerAcquisitionHttpMutatingHeaders = z.infer<
  typeof partnerAcquisitionHttpMutatingHeadersSchema
>;
export type PartnerAcquisitionLeadListQuery = z.infer<
  typeof partnerAcquisitionLeadListQuerySchema
>;
export type PartnerAcquisitionProspectListQuery = z.infer<
  typeof partnerAcquisitionProspectListQuerySchema
>;
export type PartnerAcquisitionLeadIdParams = z.infer<
  typeof partnerAcquisitionLeadIdParamsSchema
>;
export type PartnerAcquisitionProspectIdParams = z.infer<
  typeof partnerAcquisitionProspectIdParamsSchema
>;
export type PartnerAcquisitionActionParams = z.infer<
  typeof partnerAcquisitionActionParamsSchema
>;
export type PartnerAcquisitionLeadCreateBody = z.infer<
  typeof partnerAcquisitionLeadCreateBodySchema
>;
export type PartnerAcquisitionProspectCreateBody = z.infer<
  typeof partnerAcquisitionProspectCreateBodySchema
>;
export type PartnerAcquisitionQualifyBody = z.infer<
  typeof partnerAcquisitionQualifyBodySchema
>;
export type PartnerAcquisitionDisqualifyBody = z.infer<
  typeof partnerAcquisitionDisqualifyBodySchema
>;
export type PartnerAcquisitionNegotiationBody = z.infer<
  typeof partnerAcquisitionNegotiationBodySchema
>;
export type PartnerAcquisitionDocumentationRequestBody = z.infer<
  typeof partnerAcquisitionDocumentationRequestBodySchema
>;
export type PartnerAcquisitionDocumentationReceivedBody = z.infer<
  typeof partnerAcquisitionDocumentationReceivedBodySchema
>;
export type PartnerAcquisitionContractRequestBody = z.infer<
  typeof partnerAcquisitionContractRequestBodySchema
>;
export type PartnerAcquisitionContractSignedBody = z.infer<
  typeof partnerAcquisitionContractSignedBodySchema
>;
export type PartnerAcquisitionConversionApproveBody = z.infer<
  typeof partnerAcquisitionConversionApproveBodySchema
>;
export type PartnerAcquisitionConversionRejectBody = z.infer<
  typeof partnerAcquisitionConversionRejectBodySchema
>;
export type PartnerAcquisitionConvertBody = z.infer<
  typeof partnerAcquisitionConvertBodySchema
>;
export type PartnerAcquisitionLeadDto = z.infer<typeof partnerAcquisitionLeadDtoSchema>;
export type PartnerAcquisitionProspectDto = z.infer<
  typeof partnerAcquisitionProspectDtoSchema
>;
export type PartnerAcquisitionConversionDecisionDto = z.infer<
  typeof partnerAcquisitionConversionDecisionDtoSchema
>;
export type PartnerAcquisitionConversionResponseDto = z.infer<
  typeof partnerAcquisitionConversionResponseDtoSchema
>;
export type PartnerAcquisitionPageMeta = z.infer<typeof partnerAcquisitionPageMetaSchema>;
export type PartnerAcquisitionErrorEnvelope = z.infer<typeof partnerAcquisitionErrorSchema>;
