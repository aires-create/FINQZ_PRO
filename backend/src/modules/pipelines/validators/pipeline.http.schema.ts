import { z } from 'zod';

const uuidSchema = z.string().uuid();
const nameSchema = z.string().trim().min(1, 'Name is required');
const nullableDescriptionSchema = z.string().trim().nullable().optional();
const stageFlagsSchema = z
  .object({
    isWon: z.boolean(),
    isLost: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.isWon && value.isLost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Stage cannot be won and lost at the same time',
      path: ['isLost'],
      });
    }
  });

const queryBooleanSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

export const pipelineIdParamsSchema = z
  .object({
    pipelineId: uuidSchema,
  })
  .strict();

export const stageIdParamsSchema = z
  .object({
    stageId: uuidSchema,
  })
  .strict();

export const listPipelinesQuerySchema = z
  .object({
    includeInactive: queryBooleanSchema.optional(),
  })
  .strict();

export const createPipelineBodySchema = z
  .object({
    name: nameSchema,
    description: nullableDescriptionSchema,
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updatePipelineBodySchema = z
  .object({
    name: nameSchema.optional(),
    description: nullableDescriptionSchema,
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const createStageBodySchema = z
  .object({
    name: nameSchema,
    order: z.number().int().min(1),
    isWon: z.boolean(),
    isLost: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.isWon && value.isLost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Stage cannot be won and lost at the same time',
        path: ['isLost'],
      });
    }
  });

export const updateStageBodySchema = z
  .object({
    name: nameSchema.optional(),
    order: z.number().int().min(1).optional(),
    isWon: z.boolean().optional(),
    isLost: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.isWon && value.isLost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Stage cannot be won and lost at the same time',
        path: ['isLost'],
      });
    }
  });

export const reorderStagesBodySchema = z
  .object({
    stages: z
      .array(
        z
          .object({
            stageId: uuidSchema,
            order: z.number().int().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type PipelineIdParams = z.infer<typeof pipelineIdParamsSchema>;
export type StageIdParams = z.infer<typeof stageIdParamsSchema>;
export type ListPipelinesQuery = z.infer<typeof listPipelinesQuerySchema>;
export type CreatePipelineBody = z.infer<typeof createPipelineBodySchema>;
export type UpdatePipelineBody = z.infer<typeof updatePipelineBodySchema>;
export type CreateStageBody = z.infer<typeof createStageBodySchema>;
export type UpdateStageBody = z.infer<typeof updateStageBodySchema>;
export type ReorderStagesBody = z.infer<typeof reorderStagesBodySchema>;
