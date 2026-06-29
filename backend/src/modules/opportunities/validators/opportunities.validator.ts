import { z } from 'zod';

const uuidSchema = z.string().uuid();
const optionalNullableUuidSchema = uuidSchema.nullable().optional();
const optionalNullableTextSchema = z.string().trim().nullable().optional();
const optionalDateInputSchema = z.union([z.string(), z.date()]).nullable().optional();
const optionalNullableEmailSchema = z.string().email().nullable().optional();
const optionalBooleanSchema = z.boolean().optional();

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
    productId: optionalNullableUuidSchema,
    subproductId: optionalNullableUuidSchema,
    modalityId: optionalNullableUuidSchema,
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
    productId: optionalNullableUuidSchema,
    subproductId: optionalNullableUuidSchema,
    modalityId: optionalNullableUuidSchema,
  })
  .strict();

export const moveOpportunityStageBodySchema = z
  .object({
    stageId: uuidSchema,
    pipelineId: uuidSchema.optional(),
  })
  .strict();

export const intakeCustomerSchema = z
  .object({
    id: optionalNullableUuidSchema,
    cpfCnpj: optionalNullableTextSchema,
    email: optionalNullableEmailSchema,
    firstName: optionalNullableTextSchema,
    lastName: optionalNullableTextSchema,
    phone: optionalNullableTextSchema,
    birthDate: optionalDateInputSchema,
    documentType: optionalNullableTextSchema,
    address: z.record(z.unknown()).nullable().optional(),
    bankData: z.record(z.unknown()).nullable().optional(),
    profession: optionalNullableTextSchema,
    maritalStatus: optionalNullableTextSchema,
    gender: optionalNullableTextSchema,
    notes: optionalNullableTextSchema,
  })
  .strict();

export const intakeOptionsSchema = z
  .object({
    updateExistingCustomer: optionalBooleanSchema,
    allowCreateCustomer: optionalBooleanSchema,
  })
  .strict();

export const createOpportunityIntakeBodySchema = z
  .object({
    opportunity: z
    .object({
        title: z.string().trim().min(1, 'Opportunity title is required'),
        amount: z.coerce.number().finite(),
        pipelineId: uuidSchema,
        stageId: uuidSchema,
        productId: optionalNullableUuidSchema,
        subproductId: optionalNullableUuidSchema,
        modalityId: optionalNullableUuidSchema,
        ownerId: optionalNullableUuidSchema,
        description: optionalNullableTextSchema,
        probability: z.coerce.number().int().min(0).max(100).optional(),
        currency: z.string().trim().min(1).optional(),
        expectedCloseDate: optionalDateInputSchema,
      })
      .strict(),
    customer: intakeCustomerSchema,
    options: intakeOptionsSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const { customer, options } = value;
    const allowCreateCustomer = options?.allowCreateCustomer !== false;
    const hasCustomerId = Boolean(customer.id);
    const hasCpfCnpj = Boolean(customer.cpfCnpj);
    const hasEmail = Boolean(customer.email);

    if (!hasCustomerId && !hasCpfCnpj && !hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer id, CPF/CNPJ, or email is required',
        path: ['customer'],
      });
    }

    if (!hasCustomerId && allowCreateCustomer) {
      if (!customer.firstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer firstName is required when customer creation is allowed',
          path: ['customer', 'firstName'],
        });
      }

      if (!customer.lastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer lastName is required when customer creation is allowed',
          path: ['customer', 'lastName'],
        });
      }

      if (!customer.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer email is required when customer creation is allowed',
          path: ['customer', 'email'],
        });
      }

      if (!customer.cpfCnpj) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Customer CPF/CNPJ is required when customer creation is allowed',
          path: ['customer', 'cpfCnpj'],
        });
      }
    }
  });

export type ListOpportunitiesQueryInput = z.infer<typeof listOpportunitiesQuerySchema>;
export type CreateOpportunityBodyInput = z.infer<typeof createOpportunityBodySchema>;
export type UpdateOpportunityBodyInput = z.infer<typeof updateOpportunityBodySchema>;
export type MoveOpportunityStageBodyInput = z.infer<typeof moveOpportunityStageBodySchema>;
export type CreateOpportunityIntakeBodyInput = z.infer<typeof createOpportunityIntakeBodySchema>;
