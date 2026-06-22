import { z } from 'zod';

const partnerStatusValues = ['prospect', 'contato', 'negociacao', 'ativo', 'inativo'] as const;
const partnerTypeValues = ['COMPANY', 'FRANQUIA', 'FRANQUEADO'] as const;

const partnerStatusSchema = z.enum(partnerStatusValues);
const partnerTypeSchema = z.enum(partnerTypeValues);

const partnerIdSchema = z.string().uuid();
const optionalTextSchema = (maxLength: number) => z.string().trim().min(1).max(maxLength).optional().nullable();

const partnerCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[A-Za-z0-9_-]+$/, 'Partner code must contain only letters, numbers, underscores or hyphens');

export const PartnerListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: partnerStatusSchema.optional(),
    parentId: partnerIdSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const PartnerIdParamsSchema = z
  .object({
    id: partnerIdSchema,
  })
  .strict();

export const PartnerCreateBodySchema = z
  .object({
    code: partnerCodeSchema,
    name: z.string().trim().min(1).max(120),
    type: partnerTypeSchema,
    status: partnerStatusSchema,
    document: optionalTextSchema(30),
    email: z.string().trim().email().max(254).optional().nullable(),
    phone: optionalTextSchema(30),
    parentId: partnerIdSchema.optional().nullable(),
  })
  .strict();

export const PartnerUpdateBodySchema = z
  .object({
    code: partnerCodeSchema.optional(),
    name: z.string().trim().min(1).max(120).optional(),
    type: partnerTypeSchema.optional(),
    status: partnerStatusSchema.optional(),
    document: optionalTextSchema(30),
    email: z.string().trim().email().max(254).optional().nullable(),
    phone: optionalTextSchema(30),
    parentId: partnerIdSchema.optional().nullable(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type PartnerListQuery = z.infer<typeof PartnerListQuerySchema>;
export type PartnerIdParams = z.infer<typeof PartnerIdParamsSchema>;
export type PartnerCreateBody = z.infer<typeof PartnerCreateBodySchema>;
export type PartnerUpdateBody = z.infer<typeof PartnerUpdateBodySchema>;

const partnerStatusJsonSchema = {
  type: 'string',
  enum: [...partnerStatusValues],
};

const partnerTypeJsonSchema = {
  type: 'string',
  enum: [...partnerTypeValues],
};

const partnerJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'tenantId', 'code', 'name', 'type', 'status', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    code: { type: 'string' },
    name: { type: 'string' },
    type: partnerTypeJsonSchema,
    status: partnerStatusJsonSchema,
    document: { type: ['string', 'null'] },
    email: { type: ['string', 'null'], format: 'email' },
    phone: { type: ['string', 'null'] },
    parentId: { type: ['string', 'null'], format: 'uuid' },
    deletedAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const partnerErrorResponseJsonSchema = {
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

const partnerListQueryJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    status: partnerStatusJsonSchema,
    parentId: { type: 'string', format: 'uuid' },
    search: { type: 'string', minLength: 1, maxLength: 100 },
  },
};

const partnerIdParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

const partnerCreateBodyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['code', 'name', 'type', 'status'],
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9_-]+$' },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    type: partnerTypeJsonSchema,
    status: partnerStatusJsonSchema,
    document: { type: ['string', 'null'], maxLength: 30 },
    email: { type: ['string', 'null'], format: 'email', maxLength: 254 },
    phone: { type: ['string', 'null'], maxLength: 30 },
    parentId: { type: ['string', 'null'], format: 'uuid' },
  },
};

const partnerUpdateBodyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9_-]+$' },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    type: partnerTypeJsonSchema,
    status: partnerStatusJsonSchema,
    document: { type: ['string', 'null'], maxLength: 30 },
    email: { type: ['string', 'null'], format: 'email', maxLength: 254 },
    phone: { type: ['string', 'null'], maxLength: 30 },
    parentId: { type: ['string', 'null'], format: 'uuid' },
  },
};

const partnerListSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'data', 'meta'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'array',
      items: partnerJsonSchema,
    },
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
};

const partnerSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: partnerJsonSchema,
  },
};

const partnerDeleteSuccessResponseJsonSchema = {
  type: 'object',
  required: ['success', 'message'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
  },
};

export const listPartnersRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  querystring: partnerListQueryJsonSchema,
  response: {
    200: partnerListSuccessResponseJsonSchema,
    400: partnerErrorResponseJsonSchema,
    401: partnerErrorResponseJsonSchema,
    403: partnerErrorResponseJsonSchema,
    500: partnerErrorResponseJsonSchema,
  },
} as const;

export const getPartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
  response: {
    200: partnerSuccessResponseJsonSchema,
    400: partnerErrorResponseJsonSchema,
    401: partnerErrorResponseJsonSchema,
    403: partnerErrorResponseJsonSchema,
    404: partnerErrorResponseJsonSchema,
    500: partnerErrorResponseJsonSchema,
  },
} as const;

export const createPartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  body: partnerCreateBodyJsonSchema,
  response: {
    201: partnerSuccessResponseJsonSchema,
    400: partnerErrorResponseJsonSchema,
    401: partnerErrorResponseJsonSchema,
    403: partnerErrorResponseJsonSchema,
    409: partnerErrorResponseJsonSchema,
    500: partnerErrorResponseJsonSchema,
  },
} as const;

export const updatePartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
  body: partnerUpdateBodyJsonSchema,
  response: {
    200: partnerSuccessResponseJsonSchema,
    400: partnerErrorResponseJsonSchema,
    401: partnerErrorResponseJsonSchema,
    403: partnerErrorResponseJsonSchema,
    404: partnerErrorResponseJsonSchema,
    409: partnerErrorResponseJsonSchema,
    500: partnerErrorResponseJsonSchema,
  },
} as const;

export const deletePartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
  response: {
    200: partnerDeleteSuccessResponseJsonSchema,
    400: partnerErrorResponseJsonSchema,
    401: partnerErrorResponseJsonSchema,
    403: partnerErrorResponseJsonSchema,
    404: partnerErrorResponseJsonSchema,
    500: partnerErrorResponseJsonSchema,
  },
} as const;

