import { z } from 'zod';

const organizationTypeSchema = z.enum([
  'department',
  'division',
  'team',
  'unit',
]);

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional();

const paginationPageSchema = z.coerce.number().int().min(1).default(1);
const paginationLimitSchema = z.coerce.number().int().min(1).max(100).default(20);

const organizationCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, 'Organization code must contain only letters, numbers, underscores or hyphens')
  .transform((value) => value.toUpperCase());

const settingsSchema = z.record(z.unknown());

export const organizationIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const listOrganizationsQuerySchema = z
  .object({
    parentId: z.string().uuid().optional(),
    type: organizationTypeSchema.optional(),
    level: z.coerce.number().int().min(1).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    page: paginationPageSchema,
    limit: paginationLimitSchema,
  })
  .strict();

export const createOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    code: organizationCodeSchema,
    description: optionalTextSchema(500),
    type: organizationTypeSchema,
    parentId: z.string().uuid().optional(),
    settings: settingsSchema.optional(),
  })
  .strict();

export const updateOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: optionalTextSchema(500),
    type: organizationTypeSchema.optional(),
    settings: settingsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type OrganizationIdParamsDto = z.infer<typeof organizationIdParamsSchema>;
export type ListOrganizationsQueryDto = z.infer<typeof listOrganizationsQuerySchema>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationBodySchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationBodySchema>;

const organizationTypeJsonSchema = {
  type: 'string',
  enum: ['department', 'division', 'team', 'unit'],
};

const organizationJsonSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    parentId: { type: ['string', 'null'], format: 'uuid' },
    name: { type: 'string' },
    code: { type: 'string' },
    description: { type: ['string', 'null'] },
    type: organizationTypeJsonSchema,
    level: { type: 'integer' },
    settings: { type: ['object', 'null'], additionalProperties: true },
    isActive: { type: 'boolean' },
    deletedAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const errorResponseJsonSchema = {
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
};

const idParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

export const listOrganizationsRouteSchema = {
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      parentId: { type: 'string', format: 'uuid' },
      type: organizationTypeJsonSchema,
      level: { type: 'integer', minimum: 1 },
      search: { type: 'string', minLength: 1, maxLength: 100 },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      type: 'object',
      required: ['success', 'data', 'meta'],
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array', items: organizationJsonSchema },
        meta: {
          type: 'object',
          required: ['page', 'limit', 'total', 'totalPages'],
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
  },
} as const;

export const getOrganizationRouteSchema = {
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  params: idParamsJsonSchema,
  response: {
    200: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean' },
        data: organizationJsonSchema,
      },
    },
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    404: errorResponseJsonSchema,
  },
} as const;

export const createOrganizationRouteSchema = {
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'code', 'type'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      code: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        pattern: '^[A-Za-z0-9_-]+$',
      },
      description: { type: ['string', 'null'], maxLength: 500 },
      type: organizationTypeJsonSchema,
      parentId: { type: 'string', format: 'uuid' },
      settings: { type: 'object', additionalProperties: true },
    },
  },
  response: {
    201: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: organizationJsonSchema,
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    409: errorResponseJsonSchema,
  },
} as const;

export const updateOrganizationRouteSchema = {
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  params: idParamsJsonSchema,
  body: {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: ['string', 'null'], maxLength: 500 },
      type: organizationTypeJsonSchema,
      settings: { type: 'object', additionalProperties: true },
    },
  },
  response: {
    200: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: organizationJsonSchema,
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    404: errorResponseJsonSchema,
  },
} as const;

export const deleteOrganizationRouteSchema = {
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  params: idParamsJsonSchema,
  response: {
    200: {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    404: errorResponseJsonSchema,
  },
} as const;
