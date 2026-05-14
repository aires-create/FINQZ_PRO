import { z } from 'zod';

const leadStatusSchema = z.enum([
  'prospect',
  'qualified',
  'contacted',
  'converted',
  'lost',
]);

export const createLeadSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),

    lastName: z.string().min(1, 'Last name is required'),

    email: z.string().email('Invalid email').optional().nullable(),

    phone: z.string().optional().nullable(),

    cpf: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    income: z.union([z.number(), z.string()]).optional().nullable(),

    source: z.string().optional().nullable(),

    notes: z.string().optional().nullable(),

    tags: z.array(z.string()).optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    partnerId: z.string().uuid().optional().nullable(),

    ownerId: z.string().uuid().optional().nullable(),
  })
  .strict();

export const updateLeadSchema = z
  .object({
    firstName: z.string().min(1).optional(),

    lastName: z.string().min(1).optional(),

    email: z.string().email('Invalid email').optional().nullable(),

    phone: z.string().optional().nullable(),

    cpf: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    income: z.union([z.number(), z.string()]).optional().nullable(),

    status: leadStatusSchema.optional(),

    source: z.string().optional().nullable(),

    notes: z.string().optional().nullable(),

    tags: z.array(z.string()).optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    partnerId: z.string().uuid().optional().nullable(),

    ownerId: z.string().uuid().optional().nullable(),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;