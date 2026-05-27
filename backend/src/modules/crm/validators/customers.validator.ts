import { z } from 'zod';

export const createCustomerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),

    lastName: z.string().min(1, 'Last name is required'),

    email: z.string().email('Invalid email'),

    cpf: z.string().min(1, 'CPF is required'),

    phone: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    monthlyIncome: z.union([z.number(), z.string()]).optional().nullable(),

    annualIncome: z.union([z.number(), z.string()]).optional().nullable(),

    profession: z.string().optional().nullable(),

    maritalStatus: z.string().optional().nullable(),

    gender: z.string().optional().nullable(),

    documentType: z.string().optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    bankData: z.record(z.any()).optional().nullable(),

    notes: z.string().optional().nullable(),

    rdStatus: z.string().optional().nullable(),

    rdConsultedAt: z.union([z.string(), z.date()]).optional().nullable(),

    rdNotes: z.string().optional().nullable(),

    doNotCallStatus: z.string().optional().nullable(),

    doNotCallConsultedAt: z.union([z.string(), z.date()]).optional().nullable(),

    isActive: z.boolean().optional().nullable(),

    partnerId: z.string().uuid().optional().nullable(),

    leadId: z.string().uuid().optional().nullable(),

    parentCustomerId: z.string().uuid().optional().nullable(),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z
  .object({
    firstName: z.string().optional(),

    lastName: z.string().optional(),

    email: z.string().email('Invalid email').optional().nullable(),

    cpf: z.string().optional().nullable(),

    phone: z.string().optional().nullable(),

    birthDate: z.union([z.string(), z.date()]).optional().nullable(),

    monthlyIncome: z.union([z.number(), z.string()]).optional().nullable(),

    annualIncome: z.union([z.number(), z.string()]).optional().nullable(),

    profession: z.string().optional().nullable(),

    maritalStatus: z.string().optional().nullable(),

    gender: z.string().optional().nullable(),

    documentType: z.string().optional().nullable(),

    address: z.record(z.any()).optional().nullable(),

    bankData: z.record(z.any()).optional().nullable(),

    notes: z.string().optional().nullable(),

    rdStatus: z.string().optional().nullable(),

    rdConsultedAt: z.union([z.string(), z.date()]).optional().nullable(),

    rdNotes: z.string().optional().nullable(),

    doNotCallStatus: z.string().optional().nullable(),

    doNotCallConsultedAt: z.union([z.string(), z.date()]).optional().nullable(),

    isActive: z.boolean().optional().nullable(),

    partnerId: z.string().uuid().optional().nullable(),

    leadId: z.string().uuid().optional().nullable(),

    parentCustomerId: z.string().uuid().optional().nullable(),
  })
  .strict();

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
