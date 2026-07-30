import { z } from 'zod';

import {
  CATALOG_SEGMENT_CODES,
  CATALOG_STATUSES,
  type CatalogSegmentCode,
  type CatalogStatus,
} from '../domain/master-catalog.contract.js';

const requiredTextSchema = z.string().trim().min(1);
const dateInputSchema = z.union([z.string(), z.date()]);

export const catalogStatusSchema = z.enum(CATALOG_STATUSES);

export const catalogSegmentCodeSchema = z.enum(CATALOG_SEGMENT_CODES);

export const catalogEntityBaseSchema = z
  .object({
    tenantId: requiredTextSchema,
    id: requiredTextSchema,
    code: requiredTextSchema,
    name: requiredTextSchema,
    status: catalogStatusSchema,
    displayOrder: z.number().int(),
    createdAt: dateInputSchema,
    updatedAt: dateInputSchema,
  })
  .strict();

export const catalogSegmentSchema = z
  .object({
    ...catalogEntityBaseSchema.shape,
    code: catalogSegmentCodeSchema,
  })
  .strict();

export const catalogProductSchema = z
  .object({
    ...catalogEntityBaseSchema.shape,
  })
  .strict();

export const catalogSubproductSchema = z
  .object({
    ...catalogEntityBaseSchema.shape,
    productId: requiredTextSchema,
  })
  .strict();

export const catalogModalitySchema = z
  .object({
    ...catalogEntityBaseSchema.shape,
    subproductId: requiredTextSchema,
  })
  .strict();

export const catalogListFiltersSchema = z
  .object({
    search: z.string().trim().optional(),
    status: catalogStatusSchema.optional(),
    tenantId: z.string().trim().optional(),
    code: z.string().trim().optional(),
  })
  .strict();

export type CatalogStatusInput = z.infer<typeof catalogStatusSchema>;
export type CatalogSegmentCodeInput = z.infer<typeof catalogSegmentCodeSchema>;
export type CatalogEntityBaseInput = z.infer<typeof catalogEntityBaseSchema>;
export type CatalogSegmentInput = z.infer<typeof catalogSegmentSchema>;
export type CatalogProductInput = z.infer<typeof catalogProductSchema>;
export type CatalogSubproductInput = z.infer<typeof catalogSubproductSchema>;
export type CatalogModalityInput = z.infer<typeof catalogModalitySchema>;
export type CatalogListFiltersInput = z.infer<typeof catalogListFiltersSchema>;

export type { CatalogSegmentCode, CatalogStatus };
