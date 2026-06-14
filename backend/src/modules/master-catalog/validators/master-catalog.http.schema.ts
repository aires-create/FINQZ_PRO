import { z } from 'zod';

import { CATALOG_STATUSES } from '../domain/master-catalog.contract.js';

// H-10G: HTTP validation only, no controller, routes, or runtime hooks.
export const MasterCatalogListQuerySchema = z
  .object({
    status: z.enum(CATALOG_STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const MasterCatalogProductIdParamsSchema = z
  .object({
    productId: z.string().uuid(),
  })
  .strict();

export const MasterCatalogSubproductIdParamsSchema = z
  .object({
    subproductId: z.string().uuid(),
  })
  .strict();

export type MasterCatalogListQuery = z.infer<typeof MasterCatalogListQuerySchema>;
export type MasterCatalogProductIdParams = z.infer<
  typeof MasterCatalogProductIdParamsSchema
>;
export type MasterCatalogSubproductIdParams = z.infer<
  typeof MasterCatalogSubproductIdParamsSchema
>;
