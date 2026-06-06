import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const membershipRoleSchema = z.enum(['member', 'manager', 'admin', 'owner']);

const jsonObjectSchema = z.custom<Prisma.InputJsonValue>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value),
  'Permissions must be an object',
);

export const createMembershipBodySchema = z
  .object({
    userId: z.string().uuid(),
    organizationId: z.string().uuid(),
    role: membershipRoleSchema,
    permissions: jsonObjectSchema.optional(),
  })
  .strict();

export type CreateMembershipBodyDto = z.infer<typeof createMembershipBodySchema>;

const membershipJsonSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    invitedById: { type: ['string', 'null'], format: 'uuid' },
    role: { type: 'string', enum: ['member', 'manager', 'admin', 'owner'] },
    permissions: { type: ['object', 'null'], additionalProperties: true },
    isActive: { type: 'boolean' },
    joinedAt: { type: 'string', format: 'date-time' },
    invitedAt: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    user: { type: 'object', additionalProperties: true },
    organization: { type: 'object', additionalProperties: true },
    invitedBy: { type: ['object', 'null'], additionalProperties: true },
  },
};

export const createMembershipRouteSchema = {
  tags: ['Memberships'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['userId', 'organizationId', 'role'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      organizationId: { type: 'string', format: 'uuid' },
      role: { type: 'string', enum: ['member', 'manager', 'admin', 'owner'] },
      permissions: { type: 'object', additionalProperties: true },
    },
  },
  response: {
    201: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: membershipJsonSchema,
      },
    },
  },
} as const;
