import { z } from 'zod';

const requiredTextSchema = z.string().trim().min(1);
const optionalTextSchema = z.string().trim().nullable().optional();
const dateInputSchema = z.union([z.string(), z.number(), z.date()]).nullable().optional();
const numericSchema = z.coerce.number().finite();
const integerSchema = z.coerce.number().int();

const booleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const commercialConditionInputSchema = z
  .object({
    minTerm: integerSchema,
    maxTerm: integerSchema,
    term: integerSchema,
    monthlyRate: numericSchema,
    cetRate: numericSchema,
    coefficient: numericSchema,
    flatCommission: numericSchema,
    bonusCommission: numericSchema,
    advanceCommission: numericSchema,
    totalCommission: numericSchema.optional(),
    commissionRate: numericSchema.optional(),
    minAmount: numericSchema,
    maxAmount: numericSchema,
    minAge: integerSchema.optional(),
    maxAge: integerSchema.optional(),
    minConsumption: integerSchema.optional(),
    maxConsumption: integerSchema.optional(),
    tariffKwh: numericSchema.optional(),
    savingsPercent: numericSchema.optional(),
    estimatedValue: numericSchema.optional(),
    contractTerm: integerSchema.optional(),
    earlyTerminationFee: numericSchema.optional(),
    campaignName: optionalTextSchema,
    notes: optionalTextSchema,
    active: z.boolean().optional(),
  })
  .strict();

const commercialTableBaseSchema = {
  providerId: requiredTextSchema,
  providerCode: requiredTextSchema,
  providerName: requiredTextSchema,
  providerType: requiredTextSchema,
  productId: requiredTextSchema,
  productCode: requiredTextSchema,
  productName: requiredTextSchema,
  subproductId: requiredTextSchema,
  subproductCode: requiredTextSchema,
  subproductName: requiredTextSchema,
  modality: requiredTextSchema,
  modalityLabel: requiredTextSchema,
  name: requiredTextSchema,
  code: requiredTextSchema,
  active: z.boolean().optional(),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
  energyType: optionalTextSchema,
  customerType: optionalTextSchema,
  distributionCompany: optionalTextSchema,
  region: optionalTextSchema,
};

export const createCommercialTableSchema = z
  .object({
    ...commercialTableBaseSchema,
    conditions: z.array(commercialConditionInputSchema).optional().default([]),
  })
  .strict();

export const updateCommercialTableSchema = z
  .object({
    providerId: requiredTextSchema.optional(),
    providerCode: requiredTextSchema.optional(),
    providerName: requiredTextSchema.optional(),
    providerType: requiredTextSchema.optional(),
    productId: requiredTextSchema.optional(),
    productCode: requiredTextSchema.optional(),
    productName: requiredTextSchema.optional(),
    subproductId: requiredTextSchema.optional(),
    subproductCode: requiredTextSchema.optional(),
    subproductName: requiredTextSchema.optional(),
    modality: requiredTextSchema.optional(),
    modalityLabel: requiredTextSchema.optional(),
    name: requiredTextSchema.optional(),
    code: requiredTextSchema.optional(),
    active: z.boolean().optional(),
    startDate: dateInputSchema,
    endDate: dateInputSchema,
    energyType: optionalTextSchema,
    customerType: optionalTextSchema,
    distributionCompany: optionalTextSchema,
    region: optionalTextSchema,
    conditions: z.array(commercialConditionInputSchema).optional(),
  })
  .strict();

export const replaceCommercialConditionsSchema = z
  .object({
    conditions: z.array(commercialConditionInputSchema),
  })
  .strict();

export const commercialTableFiltersSchema = z
  .object({
    search: z.string().trim().optional(),
    providerId: z.string().trim().optional(),
    providerType: z.string().trim().optional(),
    productId: z.string().trim().optional(),
    subproductId: z.string().trim().optional(),
    modality: z.string().trim().optional(),
    active: booleanQuerySchema.optional(),
  })
  .strict();

export type CreateCommercialTableInput = z.infer<
  typeof createCommercialTableSchema
>;
export type UpdateCommercialTableInput = z.infer<
  typeof updateCommercialTableSchema
>;
export type ReplaceCommercialConditionsInput = z.infer<
  typeof replaceCommercialConditionsSchema
>;
export type CommercialTableFiltersInput = z.infer<
  typeof commercialTableFiltersSchema
>;
