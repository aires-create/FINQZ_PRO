import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';

import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/logger.js';
import type {
  PartnerAcquisitionCommand,
  ConvertPartnerProspectToPartnerCommand,
  CreatePartnerLeadCommand,
  CreatePartnerProspectCommand,
  ApprovePartnerProspectConversionCommand,
  DisqualifyPartnerProspectCommand,
  MarkPartnerProspectContractSignedCommand,
  MarkPartnerProspectDocumentationReceivedCommand,
  MovePartnerProspectToNegotiationCommand,
  QualifyPartnerProspectCommand,
  RejectPartnerProspectConversionCommand,
  RequestPartnerProspectContractCommand,
  RequestPartnerProspectDocumentationCommand,
} from '../domain/partner-acquisition.commands.js';
import type {
  PartnerAcquisitionSource,
  PartnerLead,
  PartnerProspect,
  PartnerAcquisitionReference,
  PartnerAcquisitionCommandMetadata,
  PartnerAcquisitionConversionDecision,
} from '../domain/partner-acquisition.contract.js';
import {
  partnerAcquisitionActionParamsSchema,
  partnerAcquisitionConversionApproveBodySchema,
  partnerAcquisitionConversionRejectBodySchema,
  partnerAcquisitionConversionResponseDtoSchema,
  partnerAcquisitionConvertBodySchema,
  partnerAcquisitionDocumentationReceivedBodySchema,
  partnerAcquisitionDocumentationRequestBodySchema,
  partnerAcquisitionLeadCreateBodySchema,
  partnerAcquisitionLeadDtoSchema,
  partnerAcquisitionLeadIdParamsSchema,
  partnerAcquisitionLeadListQuerySchema,
  partnerAcquisitionLeadTransitionBodySchema,
  partnerAcquisitionNegotiationBodySchema,
  partnerAcquisitionPromoteLeadToProspectBodySchema,
  partnerAcquisitionPromoteLeadToProspectResponseDtoSchema,
  partnerAcquisitionProspectCreateBodySchema,
  partnerAcquisitionProspectDtoSchema,
  partnerAcquisitionProspectIdParamsSchema,
  partnerAcquisitionProspectListQuerySchema,
  partnerAcquisitionQualifyBodySchema,
  partnerAcquisitionDisqualifyBodySchema,
  partnerAcquisitionContractRequestBodySchema,
  partnerAcquisitionContractSignedBodySchema,
  type PartnerAcquisitionLeadCreateBody,
  type PartnerAcquisitionLeadListQuery,
  type PartnerAcquisitionLeadTransitionBody,
  type PartnerAcquisitionProspectCreateBody,
  type PartnerAcquisitionProspectListQuery,
  type PartnerAcquisitionPromoteLeadToProspectBody,
  type PartnerAcquisitionPromoteLeadToProspectResponseDto,
} from './validators/partner-acquisition.http.validator.js';
import { partnerAcquisitionCommandHandler } from '../handlers/partner-acquisition.command-handler.js';
import type { PartnerAcquisitionCommandHandlerContract } from '../handlers/partner-acquisition.command-handler.contract.js';
import { partnerAcquisitionService } from '../services/partner-acquisition.service.js';
import type { PartnerAcquisitionServiceContract } from '../services/partner-acquisition.service.contract.js';

const INITIAL_PROSPECT_STATUSES = new Set(['NEW', 'ENRICHED', 'CONTACTED']);

const isZodError = (error: unknown): error is ZodError =>
  error instanceof ZodError;

const getTenantId = (request: FastifyRequest): string => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new AppError({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return tenantId;
};

const getActorUserId = (request: FastifyRequest): string => {
  const actorUserId = request.currentUser?.userId ?? request.currentTenant?.userId;

  if (!actorUserId) {
    throw new AppError({
      message: 'Missing user context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return actorUserId;
};

const getRequestId = (request: FastifyRequest): string => {
  return request.requestId ?? request.id;
};

const getCorrelationId = (request: FastifyRequest): string => {
  return request.correlationId ?? request.requestId ?? request.id;
};

const getIdempotencyKey = (request: FastifyRequest): string => {
  const value =
    request.headers['idempotency-key'] ?? request.headers['x-idempotency-key'];

  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError({
      message: 'Missing idempotency key',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  return value.trim();
};

const handleControllerError = (error: unknown, reply: FastifyReply): void => {
  if (isZodError(error)) {
    reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('version conflict') || message.includes('expected version')) {
      reply.status(409).send({
        success: false,
        error: {
          code: 'OPTIMISTIC_LOCK_ERROR',
          message: error.message,
        },
      });
      return;
    }

    if (message.includes('already processed') || message.includes('idempotency')) {
      reply.status(409).send({
        success: false,
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: error.message,
        },
      });
      return;
    }
  }

  logger.error('Partner acquisition HTTP controller error', { error });

  reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};

const toPageMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});

const normalizeText = (value: string): string => value.trim().toLowerCase();

const matchesSearch = (value: string | null | undefined, search: string): boolean => {
  if (!value) {
    return false;
  }

  return normalizeText(value).includes(normalizeText(search));
};

const compareValues = (
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): number => {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), 'pt-BR', { sensitivity: 'base' });
};

const sortLeadItems = (
  items: PartnerLead[],
  sortBy: NonNullable<PartnerAcquisitionLeadListQuery['sortBy']>,
  sortOrder: NonNullable<PartnerAcquisitionLeadListQuery['sortOrder']>,
) => {
  const sorted = [...items].sort((left, right) => {
    switch (sortBy) {
      case 'fullName':
        return compareValues(left.fullName, right.fullName);
      case 'status':
        return compareValues(left.status, right.status);
      case 'score':
        return compareValues(left.score ?? null, right.score ?? null);
      case 'updatedAt':
        return compareValues(left.updatedAt, right.updatedAt);
      case 'signedAt':
      case 'convertedAt':
      case 'createdAt':
      default:
        return compareValues(left.createdAt, right.createdAt);
    }
  });

  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

const sortProspectItems = (
  items: PartnerProspect[],
  sortBy: NonNullable<PartnerAcquisitionProspectListQuery['sortBy']>,
  sortOrder: NonNullable<PartnerAcquisitionProspectListQuery['sortOrder']>,
) => {
  const sorted = [...items].sort((left, right) => {
    switch (sortBy) {
      case 'fullName':
        return compareValues(left.fullName, right.fullName);
      case 'status':
        return compareValues(left.status, right.status);
      case 'score':
        return compareValues(left.score ?? null, right.score ?? null);
      case 'updatedAt':
        return compareValues(left.updatedAt, right.updatedAt);
      case 'signedAt':
        return compareValues(left.signedAt ?? null, right.signedAt ?? null);
      case 'convertedAt':
        return compareValues(left.convertedAt ?? null, right.convertedAt ?? null);
      case 'createdAt':
      default:
        return compareValues(left.createdAt, right.createdAt);
    }
  });

  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

const paginate = <T>(items: T[], page: number, limit: number): T[] => {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
};

const buildCommandEnvelope = (
  request: FastifyRequest,
  source: PartnerAcquisitionSource,
  sourceName?: string | null,
  sourceReference?: string | null,
  references?: PartnerAcquisitionReference[],
  metadata?: PartnerAcquisitionCommandMetadata,
) => ({
  tenantId: getTenantId(request),
  actorUserId: getActorUserId(request),
  requestId: getRequestId(request),
  correlationId: getCorrelationId(request),
  idempotencyKey: getIdempotencyKey(request),
  requestedAt: new Date().toISOString(),
  source,
  ...(sourceName !== undefined ? { sourceName } : {}),
  ...(sourceReference !== undefined ? { sourceReference } : {}),
  ...(references !== undefined ? { references } : {}),
  ...(metadata !== undefined ? { metadata } : {}),
});

const normalizeReference = (reference: NonNullable<PartnerAcquisitionLeadCreateBody['references']>[number]): PartnerAcquisitionReference => ({
  kind: reference.kind,
  refType: reference.refType,
  refId: reference.refId,
  ...(reference.refLabel !== undefined ? { refLabel: reference.refLabel } : {}),
});

const normalizeReferences = (
  references: PartnerAcquisitionLeadCreateBody['references'] | PartnerAcquisitionProspectCreateBody['references'],
): PartnerAcquisitionReference[] | undefined => {
  if (!references || references.length === 0) {
    return undefined;
  }

  return references.map(normalizeReference);
};

const normalizeCommandMetadata = (
  metadata: unknown,
): PartnerAcquisitionCommandMetadata | undefined => {
  if (!metadata) {
    return undefined;
  }

  const candidate = metadata as {
    source?: PartnerAcquisitionSource;
    references?: PartnerAcquisitionReference[];
    pipelineCode?: string | null;
    stageCode?: string | null;
    sdrAgentId?: string | null;
    automationCode?: string | null;
    campaignId?: string | null;
    trace?: Record<string, unknown>;
  };

  return {
    ...(candidate.source !== undefined ? { source: candidate.source } : {}),
    ...(candidate.references !== undefined
      ? (() => {
          const references = normalizeReferences(candidate.references);
          return references !== undefined ? { references } : {};
        })()
      : {}),
    ...(candidate.pipelineCode !== undefined ? { pipelineCode: candidate.pipelineCode } : {}),
    ...(candidate.stageCode !== undefined ? { stageCode: candidate.stageCode } : {}),
    ...(candidate.sdrAgentId !== undefined ? { sdrAgentId: candidate.sdrAgentId } : {}),
    ...(candidate.automationCode !== undefined ? { automationCode: candidate.automationCode } : {}),
    ...(candidate.campaignId !== undefined ? { campaignId: candidate.campaignId } : {}),
    ...(candidate.trace !== undefined ? { trace: candidate.trace } : {}),
  };
};

const buildProspectMetadata = (prospect: PartnerProspect): PartnerAcquisitionCommandMetadata => ({
  source: prospect.channel as PartnerAcquisitionSource,
  ...(prospect.pipelineCode !== null ? { pipelineCode: prospect.pipelineCode } : {}),
  ...(prospect.stageCode !== null ? { stageCode: prospect.stageCode } : {}),
  ...(prospect.sdrAgentId !== null ? { sdrAgentId: prospect.sdrAgentId } : {}),
  ...(prospect.campaignId !== null ? { campaignId: prospect.campaignId } : {}),
});

const toLeadDto = (lead: PartnerLead) =>
  partnerAcquisitionLeadDtoSchema.parse({
    tenantId: lead.tenantId,
    leadId: lead.leadId,
    leadCode: lead.leadCode,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    document: lead.document,
    source: lead.channel,
    sourceName: lead.sourceName,
    sourceReference: lead.sourceReference,
    campaignId: lead.campaignId,
    hubContextId: lead.hubContextId,
    ownerUserId: lead.ownerUserId,
    status: lead.status,
    score: lead.score,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  });

const toProspectDto = (prospect: PartnerProspect) =>
  partnerAcquisitionProspectDtoSchema.parse({
    tenantId: prospect.tenantId,
    prospectId: prospect.prospectId,
    prospectCode: prospect.prospectCode,
    leadId: prospect.leadId,
    fullName: prospect.fullName,
    email: prospect.email,
    phone: prospect.phone,
    companyName: prospect.companyName,
    document: prospect.document,
    source: prospect.channel,
    sourceName: prospect.sourceName,
    sourceReference: prospect.sourceReference,
    campaignId: prospect.campaignId,
    hubContextId: prospect.hubContextId,
    sdrAgentId: prospect.sdrAgentId,
    status: prospect.status,
    pipelineCode: prospect.pipelineCode,
    stageCode: prospect.stageCode,
    score: prospect.score,
    qualificationReason: prospect.qualificationReason,
    assignedUserId: prospect.assignedUserId,
    nextActionAt: prospect.nextActionAt ?? null,
    signedAt: prospect.signedAt ?? null,
    convertedAt: prospect.convertedAt ?? null,
    createdAt: prospect.createdAt,
    updatedAt: prospect.updatedAt,
  });

const toConversionDecisionDto = (
  decision: PartnerAcquisitionConversionDecision,
) => ({
  tenantId: decision.tenantId,
  prospectId: decision.prospectId,
  partnerId: decision.partnerId ?? null,
  approved: decision.approved,
  decidedByUserId: decision.decidedByUserId,
  decidedAt: decision.decidedAt,
  reason: decision.reason ?? null,
});

const getProspectSource = (prospect: PartnerProspect): PartnerAcquisitionSource =>
  prospect.channel as PartnerAcquisitionSource;

const ensureInitialProspectStatus = (
  status: PartnerAcquisitionProspectCreateBody['status'],
): 'NEW' | 'ENRICHED' | 'CONTACTED' => {
  if (status === undefined) {
    return 'NEW';
  }

  if (status === 'NEW' || status === 'ENRICHED' || status === 'CONTACTED') {
    return status;
  }

  throw new AppError({
    message: 'Invalid initial prospect status',
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    details: {
      allowedStatuses: [...INITIAL_PROSPECT_STATUSES],
      receivedStatus: status,
    },
  });
};

export class PartnerAcquisitionController {
  constructor(
    private readonly service: PartnerAcquisitionServiceContract = partnerAcquisitionService,
    private readonly commandHandler: PartnerAcquisitionCommandHandlerContract = partnerAcquisitionCommandHandler,
  ) {}

  listLeads = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = partnerAcquisitionLeadListQuerySchema.parse(request.query);
      const items = await this.service.listLeads({
        tenantId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.source !== undefined ? { channel: query.source } : {}),
        ...(query.ownerUserId !== undefined ? { ownerUserId: query.ownerUserId } : {}),
      });

      const searchFiltered = query.search
        ? items.filter((item) =>
          [
              item.leadId,
              item.leadCode,
              item.fullName,
              item.email,
              item.phone,
              item.companyName,
              item.document,
            ].some((value) => matchesSearch(value, query.search ?? '')),
          )
        : items;

      const sorted = sortLeadItems(
        searchFiltered,
        query.sortBy,
        query.sortOrder,
      );
      const pageItems = paginate(sorted, query.page, query.limit);

      reply.send({
        success: true,
        data: pageItems.map(toLeadDto),
        meta: toPageMeta(sorted.length, query.page, query.limit),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  getLeadById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const params = partnerAcquisitionLeadIdParamsSchema.parse(request.params);
      const lead = await this.service.findLeadById({
        tenantId,
        leadId: params.leadId,
      });

      if (!lead) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partner lead not found',
          },
        });
        return;
      }

      reply.send({
        success: true,
        data: toLeadDto(lead),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  createLead = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = partnerAcquisitionLeadCreateBodySchema.parse(request.body);
      const command: CreatePartnerLeadCommand = {
        ...buildCommandEnvelope(
          request,
          body.source,
          body.sourceName ?? null,
          body.sourceReference ?? null,
          normalizeReferences(body.references),
          normalizeCommandMetadata(body.metadata),
        ),
        commandType: 'CreatePartnerLeadCommand',
        leadId: body.leadCode,
        leadCode: body.leadCode,
        fullName: body.fullName,
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
        ...(body.document !== undefined ? { document: body.document } : {}),
      };

      const lead = await this.commandHandler.handle(command);

      reply.status(201).send({
        success: true,
        data: toLeadDto(lead as PartnerLead),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  transitionLead = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = partnerAcquisitionLeadTransitionBodySchema.parse(
        request.body,
      ) as PartnerAcquisitionLeadTransitionBody;
      const params = partnerAcquisitionLeadIdParamsSchema.parse(request.params);
      const command = {
        tenantId: getTenantId(request),
        actorUserId: getActorUserId(request),
        requestId: getRequestId(request),
        correlationId: getCorrelationId(request),
        idempotencyKey: getIdempotencyKey(request),
        requestedAt: new Date().toISOString(),
        commandType: 'TransitionPartnerLeadCommand' as const,
        leadId: params.leadId,
        nextStatus: body.nextStatus,
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
      };

      const result = await this.service.transitionLead(command);

      reply.status(200).send({
        success: true,
        data: partnerAcquisitionLeadDtoSchema.parse(result),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  promoteLeadToProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = partnerAcquisitionPromoteLeadToProspectBodySchema.parse(
        request.body,
      ) as PartnerAcquisitionPromoteLeadToProspectBody;
      const params = partnerAcquisitionLeadIdParamsSchema.parse(request.params);
      const command = {
        tenantId: getTenantId(request),
        actorUserId: getActorUserId(request),
        requestId: getRequestId(request),
        correlationId: getCorrelationId(request),
        idempotencyKey: getIdempotencyKey(request),
        requestedAt: new Date().toISOString(),
        source: body.source,
        commandType: 'PromotePartnerLeadToProspectCommand' as const,
        leadId: params.leadId,
      };

      const result = await this.service.promoteLeadToProspect(command);

      reply.status(result.created ? 201 : 200).send({
        success: true,
        data: partnerAcquisitionPromoteLeadToProspectResponseDtoSchema.parse(
          result,
        ) as PartnerAcquisitionPromoteLeadToProspectResponseDto,
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  listProspects = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const query = partnerAcquisitionProspectListQuerySchema.parse(request.query);
      const items = await this.service.listProspects({
        tenantId,
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.source !== undefined ? { channel: query.source } : {}),
        ...(query.pipelineCode !== undefined ? { pipelineCode: query.pipelineCode } : {}),
        ...(query.stageCode !== undefined ? { stageCode: query.stageCode } : {}),
        ...(query.assignedUserId !== undefined ? { assignedUserId: query.assignedUserId } : {}),
      });

      const searchFiltered = query.search
        ? items.filter((item) =>
          [
              item.prospectId,
              item.prospectCode,
              item.fullName,
              item.email,
              item.phone,
              item.companyName,
              item.document,
            ].some((value) => matchesSearch(value, query.search ?? '')),
          )
        : items;

      const sorted = sortProspectItems(
        searchFiltered,
        query.sortBy,
        query.sortOrder,
      );
      const pageItems = paginate(sorted, query.page, query.limit);

      reply.send({
        success: true,
        data: pageItems.map(toProspectDto),
        meta: toPageMeta(sorted.length, query.page, query.limit),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  getProspectById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const params = partnerAcquisitionProspectIdParamsSchema.parse(request.params);
      const prospect = await this.service.findProspectById({
        tenantId,
        prospectId: params.prospectId,
      });

      if (!prospect) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partner prospect not found',
          },
        });
        return;
      }

      reply.send({
        success: true,
        data: toProspectDto(prospect),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  createProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const body = partnerAcquisitionProspectCreateBodySchema.parse(request.body);
      const command: CreatePartnerProspectCommand = {
        ...buildCommandEnvelope(
          request,
          body.source,
          body.sourceName ?? null,
          body.sourceReference ?? null,
          normalizeReferences(body.references),
          normalizeCommandMetadata(body.metadata),
        ),
        commandType: 'CreatePartnerProspectCommand',
        prospectId: randomUUID(),
        prospectCode: body.prospectCode,
        leadId: body.leadId,
        fullName: body.fullName,
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
        ...(body.document !== undefined ? { document: body.document } : {}),
        initialStatus: ensureInitialProspectStatus(body.status),
      };

      const prospect = await this.commandHandler.handle(command);

      reply.status(201).send({
        success: true,
        data: toProspectDto(prospect as PartnerProspect),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  qualifyProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'QualifyPartnerProspectCommand', (body) => ({
      commandType: 'QualifyPartnerProspectCommand',
      expectedVersion: body.expectedVersion,
      score: body.score ?? null,
      qualificationReason: body.qualificationReason ?? null,
    }));
  };

  disqualifyProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'DisqualifyPartnerProspectCommand', (body) => ({
      commandType: 'DisqualifyPartnerProspectCommand',
      expectedVersion: body.expectedVersion,
      reason: body.reason,
    }));
  };

  negotiationProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'MovePartnerProspectToNegotiationCommand', (body) => ({
      commandType: 'MovePartnerProspectToNegotiationCommand',
      expectedVersion: body.expectedVersion,
      negotiationReason: body.negotiationReason ?? null,
    }));
  };

  requestDocumentation = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'RequestPartnerProspectDocumentationCommand', (body) => ({
      commandType: 'RequestPartnerProspectDocumentationCommand',
      expectedVersion: body.expectedVersion,
      requestedDocuments: body.requestedDocuments ?? [],
      dueAt: body.dueAt ?? null,
    }));
  };

  markDocumentationReceived = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'MarkPartnerProspectDocumentationReceivedCommand', (body) => ({
      commandType: 'MarkPartnerProspectDocumentationReceivedCommand',
      expectedVersion: body.expectedVersion,
      receivedDocuments: body.receivedDocuments ?? [],
    }));
  };

  requestContract = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'RequestPartnerProspectContractCommand', (body) => ({
      commandType: 'RequestPartnerProspectContractCommand',
      expectedVersion: body.expectedVersion,
      contractTemplateCode: body.contractTemplateCode ?? null,
      contractReference: body.contractReference ?? null,
    }));
  };

  markContractSigned = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'MarkPartnerProspectContractSignedCommand', (body) => ({
      commandType: 'MarkPartnerProspectContractSignedCommand',
      expectedVersion: body.expectedVersion,
      signedAt: body.signedAt,
      contractReference: body.contractReference ?? null,
      signatureProvider: body.signatureProvider ?? null,
    }));
  };

  approveConversion = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'ApprovePartnerProspectConversionCommand', (body) => ({
      commandType: 'ApprovePartnerProspectConversionCommand',
      expectedVersion: body.expectedVersion,
      approvalNotes: body.approvalNotes ?? null,
    }));
  };

  rejectConversion = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await this.executeTransition(request, reply, 'RejectPartnerProspectConversionCommand', (body) => ({
      commandType: 'RejectPartnerProspectConversionCommand',
      expectedVersion: body.expectedVersion,
      reason: body.reason,
    }));
  };

  convertProspect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const tenantId = getTenantId(request);
      const actorUserId = getActorUserId(request);
      const params = partnerAcquisitionActionParamsSchema.parse(request.params);
      const body = partnerAcquisitionConvertBodySchema.parse(request.body);
      const prospect = await this.requireProspect(tenantId, params.id);

      const command: ConvertPartnerProspectToPartnerCommand = {
        ...buildCommandEnvelope(
          request,
          getProspectSource(prospect),
          prospect.sourceName ?? null,
          prospect.sourceReference ?? null,
          undefined,
          buildProspectMetadata(prospect),
        ),
        commandType: 'ConvertPartnerProspectToPartnerCommand',
        prospectId: params.id,
        expectedVersion: body.expectedVersion,
        partnerId: body.partnerId,
        partnerCode: body.partnerCode,
        partnerName: body.partnerName,
        partnerType: body.partnerType,
        aggregateType: 'PARTNER_PROSPECT',
        ...(body.conversionApprovedAt !== undefined
          ? { conversionApprovedAt: body.conversionApprovedAt }
          : {}),
      };

      const result = await this.commandHandler.handle(command);
      const conversionDecision = await this.service.findConversionDecisionByProspectId({
        tenantId,
        prospectId: params.id,
      });

      reply.send({
        success: true,
        data: partnerAcquisitionConversionResponseDtoSchema.parse({
          prospect: toProspectDto(result as PartnerProspect),
          conversionDecision: conversionDecision ?? {
            tenantId,
            prospectId: params.id,
            partnerId: body.partnerId,
            approved: true,
            decidedByUserId: actorUserId,
            decidedAt: body.conversionApprovedAt ?? new Date().toISOString(),
            reason: null,
          },
        }),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  };

  private async executeTransition<TBody extends Record<string, unknown>>(
    request: FastifyRequest,
    reply: FastifyReply,
    commandType:
      | 'QualifyPartnerProspectCommand'
      | 'DisqualifyPartnerProspectCommand'
      | 'MovePartnerProspectToNegotiationCommand'
      | 'RequestPartnerProspectDocumentationCommand'
      | 'MarkPartnerProspectDocumentationReceivedCommand'
      | 'RequestPartnerProspectContractCommand'
      | 'MarkPartnerProspectContractSignedCommand'
      | 'ApprovePartnerProspectConversionCommand'
      | 'RejectPartnerProspectConversionCommand',
    buildCommand: (body: TBody) => Record<string, unknown>,
  ): Promise<void> {
    try {
      const tenantId = getTenantId(request);
      const params = partnerAcquisitionActionParamsSchema.parse(request.params);
      const bodySchemaMap = {
        QualifyPartnerProspectCommand: partnerAcquisitionQualifyBodySchema,
        DisqualifyPartnerProspectCommand: partnerAcquisitionDisqualifyBodySchema,
        MovePartnerProspectToNegotiationCommand: partnerAcquisitionNegotiationBodySchema,
        RequestPartnerProspectDocumentationCommand: partnerAcquisitionDocumentationRequestBodySchema,
        MarkPartnerProspectDocumentationReceivedCommand: partnerAcquisitionDocumentationReceivedBodySchema,
        RequestPartnerProspectContractCommand: partnerAcquisitionContractRequestBodySchema,
        MarkPartnerProspectContractSignedCommand: partnerAcquisitionContractSignedBodySchema,
        ApprovePartnerProspectConversionCommand: partnerAcquisitionConversionApproveBodySchema,
        RejectPartnerProspectConversionCommand: partnerAcquisitionConversionRejectBodySchema,
      }[commandType];
      const body = bodySchemaMap.parse(request.body) as unknown as TBody;
      const prospect = await this.requireProspect(tenantId, params.id);

      const command = {
        ...buildCommandEnvelope(
          request,
          getProspectSource(prospect),
          prospect.sourceName ?? null,
          prospect.sourceReference ?? null,
          undefined,
          buildProspectMetadata(prospect),
        ),
        ...buildCommand(body),
        prospectId: params.id,
      } as PartnerAcquisitionCommand;

      const prospectResult = (await this.commandHandler.handle(command)) as PartnerProspect;

      reply.send({
        success: true,
        data: toProspectDto(prospectResult),
      });
    } catch (error) {
      handleControllerError(error, reply);
    }
  }

  private async requireProspect(
    tenantId: string,
    prospectId: string,
  ): Promise<PartnerProspect> {
    const prospect = await this.service.findProspectById({
      tenantId,
      prospectId,
    });

    if (!prospect) {
      throw new AppError({
        message: 'Partner prospect not found',
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    return prospect;
  }
}

export const partnerAcquisitionController = new PartnerAcquisitionController();
