import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { authenticate, tenantContextMiddleware } from '../../../core/http/middleware.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { requirePermissions } from '../../rbac/rbac.guard.js';
import { partnerAcquisitionController } from './partner-acquisition.controller.js';
import {
  partnerAcquisitionActionParamsSchema,
  partnerAcquisitionContractRequestBodySchema,
  partnerAcquisitionContractSignedBodySchema,
  partnerAcquisitionConversionApproveBodySchema,
  partnerAcquisitionConversionRejectBodySchema,
  partnerAcquisitionConvertBodySchema,
  partnerAcquisitionDocumentationReceivedBodySchema,
  partnerAcquisitionDocumentationRequestBodySchema,
  partnerAcquisitionLeadCreateBodySchema,
  partnerAcquisitionLeadIdParamsSchema,
  partnerAcquisitionLeadListQuerySchema,
  partnerAcquisitionNegotiationBodySchema,
  partnerAcquisitionPromoteLeadToProspectBodySchema,
  partnerAcquisitionProspectCreateBodySchema,
  partnerAcquisitionProspectIdParamsSchema,
  partnerAcquisitionProspectListQuerySchema,
  partnerAcquisitionQualifyBodySchema,
  partnerAcquisitionDisqualifyBodySchema,
} from './validators/partner-acquisition.http.validator.js';

type ValidationSource = 'body' | 'query' | 'params';

const sendValidationError = (reply: FastifyReply, details: unknown): void => {
  reply.status(400).send({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      ...(details !== undefined ? { details } : {}),
    },
  });
};

const validate = (schema: z.ZodTypeAny, source: ValidationSource) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = schema.safeParse((request as any)[source]);

    if (!result.success) {
      sendValidationError(reply, result.error.flatten());
      return;
    }

    (request as any)[source] = result.data;
  };

const requireIdempotencyKey = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const key = request.headers['idempotency-key'] ?? request.headers['x-idempotency-key'];

  if (typeof key !== 'string' || !key.trim()) {
    sendValidationError(reply, {
      fieldErrors: {
        'idempotency-key': ['Idempotency key is required'],
      },
    });
    return;
  }

  (request.headers as Record<string, unknown>)['idempotency-key'] = key.trim();
};

const validateTenantAndActor = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  if (!request.currentTenant?.tenantId) {
    throw new AppError({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  if (!request.currentUser?.userId && !request.currentTenant?.userId) {
    throw new AppError({
      message: 'Missing user context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }
};

export async function partnerAcquisitionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', tenantContextMiddleware);

  app.get(
    '/leads',
    {
      preHandler: [
        requirePermissions('partner_acquisition:read'),
        validate(partnerAcquisitionLeadListQuerySchema, 'query'),
      ],
    },
    partnerAcquisitionController.listLeads,
  );

  app.get(
    '/leads/:leadId',
    {
      preHandler: [
        requirePermissions('partner_acquisition:read'),
        validate(partnerAcquisitionLeadIdParamsSchema, 'params'),
      ],
    },
    partnerAcquisitionController.getLeadById,
  );

  app.post(
    '/leads',
    {
      preHandler: [
        requirePermissions('partner_acquisition:create'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionLeadCreateBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.createLead,
  );

  app.post(
    '/leads/:leadId/promote-to-prospect',
    {
      preHandler: [
        requirePermissions('partner_acquisition:promote'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionLeadIdParamsSchema, 'params'),
        validate(partnerAcquisitionPromoteLeadToProspectBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.promoteLeadToProspect,
  );

  app.get(
    '/prospects',
    {
      preHandler: [
        requirePermissions('partner_prospect:read'),
        validate(partnerAcquisitionProspectListQuerySchema, 'query'),
      ],
    },
    partnerAcquisitionController.listProspects,
  );

  app.get(
    '/prospects/:prospectId',
    {
      preHandler: [
        requirePermissions('partner_prospect:read'),
        validate(partnerAcquisitionProspectIdParamsSchema, 'params'),
      ],
    },
    partnerAcquisitionController.getProspectById,
  );

  app.post(
    '/prospects',
    {
      preHandler: [
        requirePermissions('partner_prospect:create'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionProspectCreateBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.createProspect,
  );

  app.post(
    '/prospects/:id/qualify',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionQualifyBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.qualifyProspect,
  );

  app.post(
    '/prospects/:id/disqualify',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionDisqualifyBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.disqualifyProspect,
  );

  app.post(
    '/prospects/:id/negotiation',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionNegotiationBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.negotiationProspect,
  );

  app.post(
    '/prospects/:id/documentation/request',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionDocumentationRequestBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.requestDocumentation,
  );

  app.post(
    '/prospects/:id/documentation/received',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionDocumentationReceivedBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.markDocumentationReceived,
  );

  app.post(
    '/prospects/:id/contract/request',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionContractRequestBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.requestContract,
  );

  app.post(
    '/prospects/:id/contract/signed',
    {
      preHandler: [
        requirePermissions('partner_prospect:transition'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionContractSignedBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.markContractSigned,
  );

  app.post(
    '/prospects/:id/conversion/approve',
    {
      preHandler: [
        requirePermissions('partner_acquisition:approve'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionConversionApproveBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.approveConversion,
  );

  app.post(
    '/prospects/:id/conversion/reject',
    {
      preHandler: [
        requirePermissions('partner_acquisition:approve'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionConversionRejectBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.rejectConversion,
  );

  app.post(
    '/prospects/:id/convert',
    {
      preHandler: [
        requirePermissions('partner_prospect:convert'),
        validateTenantAndActor,
        requireIdempotencyKey,
        validate(partnerAcquisitionActionParamsSchema, 'params'),
        validate(partnerAcquisitionConvertBodySchema, 'body'),
      ],
    },
    partnerAcquisitionController.convertProspect,
  );
}

export default partnerAcquisitionRoutes;
