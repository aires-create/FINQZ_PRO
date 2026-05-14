import { z } from 'zod';

export const createLeadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),

    email: z.string().email().optional().nullable(),

    phone: z.string().optional().nullable(),

    cpf: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    income: z.union([z.number(), z.string()]).optional().nullable(),

    source: z.string().optional().nullable(),

    notes: z.string().optional().nullable(),

    tags: z.array(z.string()).optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    partnerId: z.string().optional().nullable(),

    ownerId: z.string().optional().nullable(),
  })
  .strict();

export const updateLeadSchema = z
  .object({
    firstName: z.string().optional(),

    lastName: z.string().optional(),

    email: z.string().email().optional().nullable(),

    phone: z.string().optional().nullable(),

    cpf: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    income: z.union([z.number(), z.string()]).optional().nullable(),

    status: z
      .enum([
        'prospect',
        'qualified',
        'contacted',
        'converted',
        'lost',
      ])
      .optional(),

    source: z.string().optional().nullable(),

    notes: z.string().optional().nullable(),

    tags: z.array(z.string()).optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    partnerId: z.string().optional().nullable(),

    ownerId: z.string().optional().nullable(),
  })
  .strict();