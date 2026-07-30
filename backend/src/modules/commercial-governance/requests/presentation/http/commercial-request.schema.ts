import { z } from 'zod';

import { CommercialRequestStatus } from '../../enums/commercial-request-status.enum.js';

export const commercialRequestIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const createCommercialRequestBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
    justification: z.string().trim().min(1).max(4000),
  })
  .strict();

export const listCommercialRequestsQuerySchema = z
  .object({
    status: z.nativeEnum(CommercialRequestStatus).optional(),
    requestedByUserId: z.string().uuid().optional(),
    fromRequestedAt: z.string().datetime().optional(),
    toRequestedAt: z.string().datetime().optional(),
    search: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type CommercialRequestIdParamsDto = z.infer<typeof commercialRequestIdParamsSchema>;
export type CreateCommercialRequestBodyDto = z.infer<typeof createCommercialRequestBodySchema>;
export type ListCommercialRequestsQueryDto = z.infer<typeof listCommercialRequestsQuerySchema>;

const commercialRequestStatusJsonSchema = {
  type: 'string',
  enum: Object.values(CommercialRequestStatus),
};

const commercialRequestJsonSchema = {
  type: 'object',
  required: [
    'id',
    'tenantId',
    'requestNumber',
    'status',
    'requestedByUserId',
    'requestedAt',
    'reason',
    'justification',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    requestNumber: { type: 'string' },
    status: commercialRequestStatusJsonSchema,
    requestedByUserId: { type: 'string', format: 'uuid' },
    requestedAt: { type: 'string', format: 'date-time' },
    reason: { type: 'string' },
    justification: { type: 'string' },
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

export const createCommercialRequestRouteSchema = {
  tags: ['Commercial Governance'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['reason', 'justification'],
    properties: {
      reason: { type: 'string', minLength: 1, maxLength: 500 },
      justification: { type: 'string', minLength: 1, maxLength: 4000 },
    },
  },
  response: {
    201: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: commercialRequestJsonSchema,
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
  },
} as const;

export const listCommercialRequestsRouteSchema = {
  tags: ['Commercial Governance'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: commercialRequestStatusJsonSchema,
      requestedByUserId: { type: 'string', format: 'uuid' },
      fromRequestedAt: { type: 'string', format: 'date-time' },
      toRequestedAt: { type: 'string', format: 'date-time' },
      search: { type: 'string', minLength: 1, maxLength: 100 },
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      type: 'object',
      required: ['success', 'data', 'meta'],
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array', items: commercialRequestJsonSchema },
        meta: {
          type: 'object',
          required: ['page', 'pageSize', 'total'],
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
          },
        },
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
  },
} as const;

export const getCommercialRequestRouteSchema = {
  tags: ['Commercial Governance'],
  security: [{ bearerAuth: [] }],
  params: idParamsJsonSchema,
  response: {
    200: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean' },
        data: commercialRequestJsonSchema,
      },
    },
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    404: errorResponseJsonSchema,
  },
} as const;

export const transitionCommercialRequestRouteSchema = {
  tags: ['Commercial Governance'],
  security: [{ bearerAuth: [] }],
  params: idParamsJsonSchema,
  response: {
    200: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: commercialRequestJsonSchema,
      },
    },
    400: errorResponseJsonSchema,
    401: errorResponseJsonSchema,
    403: errorResponseJsonSchema,
    404: errorResponseJsonSchema,
  },
} as const;
