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

export const listPartnersRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  querystring: partnerListQueryJsonSchema,
} as const;

export const getPartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
} as const;

export const createPartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  body: partnerCreateBodyJsonSchema,
} as const;

export const updatePartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
  body: partnerUpdateBodyJsonSchema,
} as const;

export const deletePartnerRouteSchema = {
  tags: ['Partners'],
  security: [{ bearerAuth: [] }],
  params: partnerIdParamsJsonSchema,
} as const;
