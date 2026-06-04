import { z } from 'zod';

const uuidSchema = z.string().uuid();
const optionalNullableUuidSchema = uuidSchema.nullable().optional();
const optionalNullableTextSchema = z.string().trim().nullable().optional();
const optionalDateInputSchema = z.union([z.string(), z.date()]).nullable().optional();

export const listOpportunitiesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    pipelineId: uuidSchema.optional(),
    stageId: uuidSchema.optional(),
    customerId: uuidSchema.optional(),
    ownerId: uuidSchema.optional(),
  })
  .strict();

export const createOpportunityBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    amount: z.coerce.number().finite(),
    pipelineId: uuidSchema,
    stageId: uuidSchema,
    customerId: optionalNullableUuidSchema,
    leadId: optionalNullableUuidSchema,
    ownerId: optionalNullableUuidSchema,
    description: optionalNullableTextSchema,
    probability: z.coerce.number().int().min(0).max(100).optional(),
    currency: z.string().trim().min(1).optional(),
    expectedCloseDate: optionalDateInputSchema,
  })
  .strict();

export const updateOpportunityBodySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: optionalNullableTextSchema,
    amount: z.coerce.number().finite().optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    status: z.string().trim().min(1).optional(),
    expectedCloseDate: optionalDateInputSchema,
    ownerId: optionalNullableUuidSchema,
    customerId: optionalNullableUuidSchema,
    leadId: optionalNullableUuidSchema,
  })
  .strict();

export const moveOpportunityStageBodySchema = z
  .object({
    stageId: uuidSchema,
    pipelineId: uuidSchema.optional(),
  })
  .strict();

export type ListOpportunitiesQueryInput = z.infer<typeof listOpportunitiesQuerySchema>;
export type CreateOpportunityBodyInput = z.infer<typeof createOpportunityBodySchema>;
export type UpdateOpportunityBodyInput = z.infer<typeof updateOpportunityBodySchema>;
export type MoveOpportunityStageBodyInput = z.infer<typeof moveOpportunityStageBodySchema>;
