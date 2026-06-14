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

const masterCatalogStatusJsonSchema = {
  type: 'string',
  enum: [...CATALOG_STATUSES],
};

const masterCatalogLegacyErrorResponseJsonSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' },
  },
};

const masterCatalogErrorResponseJsonSchema = {
  anyOf: [
    {
      type: 'object',
      required: ['success', 'error'],
      properties: {
        success: { type: 'boolean', enum: [false] },
        error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: {},
          },
        },
      },
    },
    masterCatalogLegacyErrorResponseJsonSchema,
  ],
};

const masterCatalogModalityReadModelJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'code', 'name', 'status', 'displayOrder'],
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: masterCatalogStatusJsonSchema,
    displayOrder: { type: 'integer' },
  },
};

const masterCatalogSubproductReadModelJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'code', 'name', 'status', 'displayOrder', 'modalities'],
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: masterCatalogStatusJsonSchema,
    displayOrder: { type: 'integer' },
    modalities: {
      type: 'array',
      items: masterCatalogModalityReadModelJsonSchema,
    },
  },
};

const masterCatalogProductReadModelJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'code', 'name', 'status', 'displayOrder', 'subproducts'],
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: masterCatalogStatusJsonSchema,
    displayOrder: { type: 'integer' },
    subproducts: {
      type: 'array',
      items: masterCatalogSubproductReadModelJsonSchema,
    },
  },
};

const masterCatalogSegmentReadModelJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'code', 'name', 'status', 'displayOrder'],
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    status: masterCatalogStatusJsonSchema,
    displayOrder: { type: 'integer' },
  },
};

const masterCatalogTreeReadModelJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['segments', 'products'],
  properties: {
    segments: {
      type: 'array',
      items: masterCatalogSegmentReadModelJsonSchema,
    },
    products: {
      type: 'array',
      items: masterCatalogProductReadModelJsonSchema,
    },
  },
};

const masterCatalogArraySuccessResponseJsonSchema = (
  itemSchema: unknown,
) => ({
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'array',
      items: itemSchema,
    },
  },
});

const masterCatalogTreeSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      anyOf: [
        masterCatalogTreeReadModelJsonSchema,
        {
          type: 'object',
          additionalProperties: true,
        },
      ],
    },
  },
};

const masterCatalogQueryJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: masterCatalogStatusJsonSchema,
    search: { type: 'string', minLength: 1, maxLength: 100 },
  },
};

const masterCatalogProductIdParamsJsonSchema = {
  type: 'object',
  required: ['productId'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
  },
};

const masterCatalogSubproductIdParamsJsonSchema = {
  type: 'object',
  required: ['subproductId'],
  properties: {
    subproductId: { type: 'string', format: 'uuid' },
  },
};

export const getMasterCatalogTreeRouteSchema = {
  tags: ['Master Catalog'],
  security: [{ bearerAuth: [] }],
  querystring: masterCatalogQueryJsonSchema,
  response: {
    200: masterCatalogTreeSuccessResponseJsonSchema,
    400: masterCatalogErrorResponseJsonSchema,
    401: masterCatalogErrorResponseJsonSchema,
    403: masterCatalogErrorResponseJsonSchema,
    500: masterCatalogErrorResponseJsonSchema,
  },
} as const;

export const listMasterCatalogSegmentsRouteSchema = {
  tags: ['Master Catalog'],
  security: [{ bearerAuth: [] }],
  querystring: masterCatalogQueryJsonSchema,
  response: {
    200: masterCatalogArraySuccessResponseJsonSchema(
      masterCatalogSegmentReadModelJsonSchema,
    ),
    400: masterCatalogErrorResponseJsonSchema,
    401: masterCatalogErrorResponseJsonSchema,
    403: masterCatalogErrorResponseJsonSchema,
    500: masterCatalogErrorResponseJsonSchema,
  },
} as const;

export const listMasterCatalogProductsRouteSchema = {
  tags: ['Master Catalog'],
  security: [{ bearerAuth: [] }],
  querystring: masterCatalogQueryJsonSchema,
  response: {
    200: masterCatalogArraySuccessResponseJsonSchema(
      masterCatalogProductReadModelJsonSchema,
    ),
    400: masterCatalogErrorResponseJsonSchema,
    401: masterCatalogErrorResponseJsonSchema,
    403: masterCatalogErrorResponseJsonSchema,
    500: masterCatalogErrorResponseJsonSchema,
  },
} as const;

export const listMasterCatalogSubproductsByProductRouteSchema = {
  tags: ['Master Catalog'],
  security: [{ bearerAuth: [] }],
  querystring: masterCatalogQueryJsonSchema,
  params: masterCatalogProductIdParamsJsonSchema,
  response: {
    200: masterCatalogArraySuccessResponseJsonSchema(
      masterCatalogSubproductReadModelJsonSchema,
    ),
    400: masterCatalogErrorResponseJsonSchema,
    401: masterCatalogErrorResponseJsonSchema,
    403: masterCatalogErrorResponseJsonSchema,
    500: masterCatalogErrorResponseJsonSchema,
  },
} as const;

export const listMasterCatalogModalitiesBySubproductRouteSchema = {
  tags: ['Master Catalog'],
  security: [{ bearerAuth: [] }],
  querystring: masterCatalogQueryJsonSchema,
  params: masterCatalogSubproductIdParamsJsonSchema,
  response: {
    200: masterCatalogArraySuccessResponseJsonSchema(
      masterCatalogModalityReadModelJsonSchema,
    ),
    400: masterCatalogErrorResponseJsonSchema,
    401: masterCatalogErrorResponseJsonSchema,
    403: masterCatalogErrorResponseJsonSchema,
    500: masterCatalogErrorResponseJsonSchema,
  },
} as const;
