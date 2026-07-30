import { z } from 'zod';

import { OperationStatus } from '@prisma/client';

// ARCH-025 to ARCH-026: validation schemas only, no routes or runtime behavior.
const operationMetadataSchema = z.record(z.unknown()).nullable().optional();

export const OperationIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const OperationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(OperationStatus).optional(),
    opportunityId: z.string().uuid().optional(),
    bankProposalId: z.string().uuid().optional(),
    createdById: z.string().uuid().optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const OperationTimelineQuerySchema = z
  .object({
    tenantId: z.string().uuid().optional(),
    operationId: z.string().uuid(),
  })
  .strict();

export const OperationFinancialSummaryQuerySchema = z
  .object({
    tenantId: z.string().uuid().optional(),
    operationId: z.string().uuid(),
  })
  .strict();

export const CreateOperationBodySchema = z
  .object({
    tenantId: z.string().uuid(),
    opportunityId: z.string().uuid(),
    bankProposalId: z.string().uuid().optional().nullable(),
    createdById: z.string().uuid(),
    amount: z.coerce.number().finite(),
    currency: z.string().trim().min(1).max(8).default('BRL'),
    referenceDate: z.union([z.string().datetime(), z.date()]).optional().nullable(),
    metadata: operationMetadataSchema,
    notes: z.string().trim().max(4000).optional().nullable(),
    correlationId: z.string().trim().min(1).max(128).optional().nullable(),
  })
  .strict();

export const OperationStatusTransitionBodySchema = z
  .object({
    tenantId: z.string().uuid(),
    operationId: z.string().uuid(),
    previousStatus: z.nativeEnum(OperationStatus),
    nextStatus: z.nativeEnum(OperationStatus),
    actorId: z.string().uuid(),
    correlationId: z.string().trim().min(1).max(128).optional().nullable(),
  })
  .strict();

export type OperationIdParams = z.infer<typeof OperationIdParamsSchema>;
export type OperationListQuery = z.infer<typeof OperationListQuerySchema>;
export type OperationTimelineQuery = z.infer<typeof OperationTimelineQuerySchema>;
export type OperationFinancialSummaryQuery = z.infer<
  typeof OperationFinancialSummaryQuerySchema
>;
export type CreateOperationBody = z.infer<typeof CreateOperationBodySchema>;
export type OperationStatusTransitionBody = z.infer<
  typeof OperationStatusTransitionBodySchema
>;
