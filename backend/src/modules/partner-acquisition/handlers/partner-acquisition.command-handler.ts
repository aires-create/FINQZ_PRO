import { randomUUID } from 'node:crypto';

import type {
  PartnerAcquisitionCommand,
  ApprovePartnerProspectConversionCommand,
  ConvertPartnerProspectToPartnerCommand,
  CreatePartnerLeadCommand,
  CreatePartnerProspectCommand,
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
  PartnerAcquisitionEventMetadata,
  PartnerLead,
  PartnerProspectStatus,
} from '../domain/partner-acquisition.contract.js';
import type { PartnerAcquisitionCommandRecordInput } from '../repositories/partner-acquisition.repository.contract.js';
import type { PartnerAcquisitionServiceContract } from '../services/partner-acquisition.service.contract.js';
import { partnerAcquisitionService } from '../services/partner-acquisition.service.js';
import { ConflictError } from '../../../shared/errors/AppError.js';
import type {
  PartnerAcquisitionCommandExecutionResult,
  PartnerAcquisitionCommandHandlerContract,
  PartnerAcquisitionCommandPlan,
} from './partner-acquisition.command-handler.contract.js';
import {
  PARTNER_ACQUISITION_COMMAND_EVENT_TYPE_MAP,
  PartnerAcquisitionCommandFailedError,
  PartnerAcquisitionCommandReplayError,
} from './partner-acquisition.command-handler.contract.js';

const toCommandPayload = (command: PartnerAcquisitionCommand): Record<string, unknown> => {
  const { commandType, ...payload } = command;
  return {
    commandType,
    ...payload,
  };
};

const getAggregateType = (
  command: PartnerAcquisitionCommand,
): 'PARTNER_LEAD' | 'PARTNER_PROSPECT' => {
  switch (command.commandType) {
    case 'CreatePartnerLeadCommand':
      return 'PARTNER_LEAD';
    default:
      return 'PARTNER_PROSPECT';
  }
};

const getAggregateId = (command: PartnerAcquisitionCommand): string => {
  switch (command.commandType) {
    case 'CreatePartnerLeadCommand':
      return command.leadId;
    case 'CreatePartnerProspectCommand':
    case 'QualifyPartnerProspectCommand':
    case 'DisqualifyPartnerProspectCommand':
    case 'MovePartnerProspectToNegotiationCommand':
    case 'RequestPartnerProspectDocumentationCommand':
    case 'MarkPartnerProspectDocumentationReceivedCommand':
    case 'RequestPartnerProspectContractCommand':
    case 'MarkPartnerProspectContractSignedCommand':
    case 'ApprovePartnerProspectConversionCommand':
    case 'RejectPartnerProspectConversionCommand':
    case 'ConvertPartnerProspectToPartnerCommand':
      return command.prospectId;
  }
};

const getReason = (command: PartnerAcquisitionCommand): string | null => {
  switch (command.commandType) {
    case 'DisqualifyPartnerProspectCommand':
      return command.reason;
    case 'RejectPartnerProspectConversionCommand':
      return command.reason;
    case 'QualifyPartnerProspectCommand':
      return command.qualificationReason ?? null;
    case 'MovePartnerProspectToNegotiationCommand':
      return command.negotiationReason ?? null;
    case 'ApprovePartnerProspectConversionCommand':
      return command.approvalNotes ?? null;
    default:
      return null;
  }
};

const buildEventMetadata = (
  command: PartnerAcquisitionCommand,
  nextStatus?: PartnerProspectStatus | null,
  reason?: string | null,
): PartnerAcquisitionEventMetadata => ({
  source: command.source,
  pipelineCode: command.metadata?.pipelineCode ?? null,
  stageCode: command.metadata?.stageCode ?? null,
  sdrAgentId: command.metadata?.sdrAgentId ?? null,
  automationCode: command.metadata?.automationCode ?? null,
  campaignId: command.metadata?.campaignId ?? null,
  ...(command.references !== undefined ? { references: command.references } : {}),
  ...(command.metadata?.trace !== undefined ? { trace: command.metadata.trace } : {}),
  ...(nextStatus !== undefined ? { nextStatus } : {}),
  ...(reason !== undefined ? { reason } : {}),
});

const buildPlan = (
  command: PartnerAcquisitionCommand,
  payload: Record<string, unknown>,
  nextStatus?: PartnerProspectStatus | null,
): PartnerAcquisitionCommandPlan => ({
  aggregateId:
    command.commandType === 'CreatePartnerLeadCommand' ? null : getAggregateId(command),
  aggregateType: getAggregateType(command),
  eventType: PARTNER_ACQUISITION_COMMAND_EVENT_TYPE_MAP[command.commandType],
  payload: {
    ...payload,
    source: command.source,
    ...(command.references !== undefined ? { references: command.references } : {}),
  },
  ...(nextStatus !== undefined ? { nextStatus } : {}),
});

const createInboxPayload = (command: PartnerAcquisitionCommand) => ({
  tenantId: command.tenantId,
  commandType: command.commandType,
  aggregateId:
    command.commandType === 'CreatePartnerLeadCommand' ? null : getAggregateId(command),
  aggregateType: getAggregateType(command),
  actorUserId: command.actorUserId,
  requestId: command.requestId,
  correlationId: command.correlationId,
  idempotencyKey: command.idempotencyKey,
  receivedAt: command.requestedAt,
  payload: toCommandPayload(command),
});

const createEventRecordInput = async (
  service: PartnerAcquisitionServiceContract,
  command: PartnerAcquisitionCommand,
  plan: PartnerAcquisitionCommandPlan,
  aggregateId: string,
  reason?: string | null,
) => {
  const events = await service.listEventsByAggregate({
    tenantId: command.tenantId,
    aggregateId,
    aggregateType: plan.aggregateType,
  });

  const version = (events.at(-1)?.version ?? 0) + 1;

  return {
    tenantId: command.tenantId,
    eventId: randomUUID(),
    aggregateId,
    aggregateType: plan.aggregateType,
    eventType: plan.eventType,
    actorUserId: command.actorUserId,
    requestId: command.requestId,
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    occurredAt: command.requestedAt,
    payload: plan.payload,
    metadata: buildEventMetadata(command, plan.nextStatus, reason),
    version,
  };
};

const createOutboxRecordInput = (
  command: PartnerAcquisitionCommand,
  plan: PartnerAcquisitionCommandPlan,
  aggregateId: string,
  eventId: string,
) => ({
  tenantId: command.tenantId,
  eventId,
  aggregateId,
  aggregateType: plan.aggregateType,
  eventType: plan.eventType,
  availableAt: command.requestedAt,
  payload: plan.payload,
});

const buildProcessedResult = async (
  service: PartnerAcquisitionServiceContract,
  command: PartnerAcquisitionCommand,
  commandRecord: PartnerAcquisitionCommandRecordInput,
): Promise<PartnerAcquisitionCommandExecutionResult> => {
  if (!commandRecord.result || !isRecord(commandRecord.result)) {
    throw new PartnerAcquisitionCommandReplayError(
      commandRecord.commandType,
      commandRecord.idempotencyKey,
    );
  }

  if (command.commandType === 'CreatePartnerLeadCommand') {
    if (typeof commandRecord.result.leadCode === 'string') {
      return commandRecord.result as unknown as PartnerAcquisitionCommandExecutionResult;
    }

    const leadId = typeof commandRecord.result.leadId === 'string'
      ? commandRecord.result.leadId
      : command.leadId;
    const lead = await service.findLeadById({
      tenantId: command.tenantId,
      leadId,
    });

    if (!lead) {
      throw new ConflictError('Partner acquisition replay could not be rehydrated');
    }

    return {
      ...commandRecord.result,
      leadCode: lead.leadCode,
    } as unknown as PartnerAcquisitionCommandExecutionResult;
  }

  if (command.commandType === 'CreatePartnerProspectCommand') {
    if (typeof commandRecord.result.prospectCode === 'string') {
      return commandRecord.result as unknown as PartnerAcquisitionCommandExecutionResult;
    }

    const prospectId = typeof commandRecord.result.prospectId === 'string'
      ? commandRecord.result.prospectId
      : command.prospectId;
    const prospect = await service.findProspectById({
      tenantId: command.tenantId,
      prospectId,
    });

    if (!prospect) {
      throw new ConflictError('Partner acquisition replay could not be rehydrated');
    }

    return {
      ...commandRecord.result,
      prospectCode: prospect.prospectCode,
    } as unknown as PartnerAcquisitionCommandExecutionResult;
  }

  return commandRecord.result as unknown as PartnerAcquisitionCommandExecutionResult;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const assertResult = <T>(value: T | null, message: string): T => {
  if (value === null) {
    throw new Error(message);
  }

  return value;
};

const assertAggregateId = (value: string | null, commandType: string): string => {
  if (value === null) {
    throw new Error(`Missing aggregateId for ${commandType}`);
  }

  return value;
};

export class PartnerAcquisitionCommandHandler
  implements PartnerAcquisitionCommandHandlerContract
{
  constructor(
    private readonly service: PartnerAcquisitionServiceContract = partnerAcquisitionService,
  ) {}

  async handle(
    command: PartnerAcquisitionCommand,
  ): Promise<PartnerAcquisitionCommandExecutionResult> {
    const inbox = await this.service.recordCommand(createInboxPayload(command));

    if (inbox.status === 'PROCESSED') {
      return buildProcessedResult(this.service, command, inbox);
    }

    if (inbox.status === 'FAILED') {
      throw new PartnerAcquisitionCommandFailedError(
        command.commandType,
        command.idempotencyKey,
        'command was already marked as failed',
      );
    }

    try {
      const plan = this.buildPlan(command);
      const result = await this.execute(command);
      const aggregateId =
        command.commandType === 'CreatePartnerLeadCommand'
          ? (result as PartnerLead).leadId
          : assertAggregateId(plan.aggregateId, command.commandType);
      const event = await createEventRecordInput(
        this.service,
        command,
        plan,
        aggregateId,
        this.getReason(command),
      );

      await this.service.appendEvent(event);
      await this.service.enqueueOutboxEvent(
        createOutboxRecordInput(command, plan, aggregateId, event.eventId),
      );
      await this.service.markCommandProcessed({
        tenantId: command.tenantId,
        idempotencyKey: command.idempotencyKey,
        processedAt: command.requestedAt,
        result: result as unknown as Record<string, unknown>,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected error';
      await this.service.markCommandFailed({
        tenantId: command.tenantId,
        idempotencyKey: command.idempotencyKey,
        failedAt: command.requestedAt,
        error: message,
      });
      throw new PartnerAcquisitionCommandFailedError(
        command.commandType,
        command.idempotencyKey,
        message,
      );
    }
  }

  private buildPlan(command: PartnerAcquisitionCommand): PartnerAcquisitionCommandPlan {
    switch (command.commandType) {
      case 'CreatePartnerLeadCommand':
        return buildPlan(command, {
          leadId: command.leadId,
          fullName: command.fullName,
          email: command.email ?? null,
          phone: command.phone ?? null,
          companyName: command.companyName ?? null,
          document: command.document ?? null,
          sourceName: command.sourceName ?? null,
          sourceReference: command.sourceReference ?? null,
        }, 'NEW');
      case 'CreatePartnerProspectCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          leadId: command.leadId,
          fullName: command.fullName,
          email: command.email ?? null,
          phone: command.phone ?? null,
          companyName: command.companyName ?? null,
          document: command.document ?? null,
          initialStatus: command.initialStatus ?? 'NEW',
          sourceName: command.sourceName ?? null,
          sourceReference: command.sourceReference ?? null,
        }, command.initialStatus ?? 'NEW');
      case 'QualifyPartnerProspectCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          score: command.score ?? null,
          qualificationReason: command.qualificationReason ?? null,
        }, 'QUALIFIED');
      case 'DisqualifyPartnerProspectCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          reason: command.reason,
        }, 'REJECTED');
      case 'MovePartnerProspectToNegotiationCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          negotiationReason: command.negotiationReason ?? null,
        }, 'NEGOTIATING');
      case 'RequestPartnerProspectDocumentationCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          requestedDocuments: command.requestedDocuments ?? [],
          dueAt: command.dueAt ?? null,
        }, 'DOCUMENTATION');
      case 'MarkPartnerProspectDocumentationReceivedCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          receivedDocuments: command.receivedDocuments ?? [],
        }, 'CONTRACT_PENDING');
      case 'RequestPartnerProspectContractCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          contractTemplateCode: command.contractTemplateCode ?? null,
          contractReference: command.contractReference ?? null,
        }, 'CONTRACT_PENDING');
      case 'MarkPartnerProspectContractSignedCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          signedAt: command.signedAt,
          contractReference: command.contractReference ?? null,
          signatureProvider: command.signatureProvider ?? null,
        }, 'SIGNED');
      case 'ApprovePartnerProspectConversionCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          approvalNotes: command.approvalNotes ?? null,
        }, 'CONVERSION_PENDING');
      case 'RejectPartnerProspectConversionCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          reason: command.reason,
        }, 'REJECTED');
      case 'ConvertPartnerProspectToPartnerCommand':
        return buildPlan(command, {
          prospectId: command.prospectId,
          expectedVersion: command.expectedVersion,
          partnerId: command.partnerId,
          partnerCode: command.partnerCode,
          partnerName: command.partnerName,
          partnerType: command.partnerType,
          conversionApprovedAt: command.conversionApprovedAt ?? null,
        }, 'CONVERTED');
    }
  }

  private getReason(command: PartnerAcquisitionCommand): string | null {
    switch (command.commandType) {
      case 'DisqualifyPartnerProspectCommand':
        return command.reason;
      case 'RejectPartnerProspectConversionCommand':
        return command.reason;
      case 'QualifyPartnerProspectCommand':
        return command.qualificationReason ?? null;
      case 'MovePartnerProspectToNegotiationCommand':
        return command.negotiationReason ?? null;
      case 'ApprovePartnerProspectConversionCommand':
        return command.approvalNotes ?? null;
      default:
        return null;
    }
  }

  private async execute(
    command: PartnerAcquisitionCommand,
  ): Promise<PartnerAcquisitionCommandExecutionResult> {
    switch (command.commandType) {
      case 'CreatePartnerLeadCommand':
        return this.service.createLead({
          tenantId: command.tenantId,
          leadCode: command.leadCode,
          fullName: command.fullName,
          email: command.email ?? null,
          phone: command.phone ?? null,
          companyName: command.companyName ?? null,
          document: command.document ?? null,
          channel: command.source,
          source: command.source,
          ...(command.references !== undefined ? { references: command.references } : {}),
          sourceName: command.sourceName ?? null,
          sourceReference: command.sourceReference ?? null,
          campaignId: command.metadata?.campaignId ?? null,
          hubContextId: command.metadata?.trace
            ? JSON.stringify(command.metadata.trace)
            : null,
          ownerUserId: command.actorUserId,
        });
      case 'CreatePartnerProspectCommand':
        return this.service.createProspect({
          tenantId: command.tenantId,
          prospectCode: command.prospectCode,
          leadId: command.leadId,
          fullName: command.fullName,
          email: command.email ?? null,
          phone: command.phone ?? null,
          companyName: command.companyName ?? null,
          document: command.document ?? null,
          channel: command.source,
          source: command.source,
          ...(command.references !== undefined ? { references: command.references } : {}),
          sourceName: command.sourceName ?? null,
          sourceReference: command.sourceReference ?? null,
          campaignId: command.metadata?.campaignId ?? null,
          hubContextId: command.metadata?.trace
            ? JSON.stringify(command.metadata.trace)
            : null,
          sdrAgentId: command.metadata?.sdrAgentId ?? null,
          status: command.initialStatus ?? 'NEW',
        });
      case 'QualifyPartnerProspectCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'QUALIFIED',
            score: command.score ?? null,
            qualificationReason: command.qualificationReason ?? null,
          }),
          'Partner prospect not found for qualification',
        );
      case 'DisqualifyPartnerProspectCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'REJECTED',
            qualificationReason: command.reason,
          }),
          'Partner prospect not found for disqualification',
        );
      case 'MovePartnerProspectToNegotiationCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'NEGOTIATING',
            qualificationReason: command.negotiationReason ?? null,
          }),
          'Partner prospect not found for negotiation',
        );
      case 'RequestPartnerProspectDocumentationCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'DOCUMENTATION',
            nextActionAt: command.dueAt ?? null,
          }),
          'Partner prospect not found for documentation request',
        );
      case 'MarkPartnerProspectDocumentationReceivedCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'CONTRACT_PENDING',
          }),
          'Partner prospect not found for documentation receipt',
        );
      case 'RequestPartnerProspectContractCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'CONTRACT_PENDING',
          }),
          'Partner prospect not found for contract request',
        );
      case 'MarkPartnerProspectContractSignedCommand':
        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'SIGNED',
            signedAt: command.signedAt,
          }),
          'Partner prospect not found for contract signature',
        );
      case 'ApprovePartnerProspectConversionCommand':
        await this.service.recordConversionDecision({
          tenantId: command.tenantId,
          prospectId: command.prospectId,
          approved: true,
          decidedByUserId: command.actorUserId,
          decidedAt: command.requestedAt,
          reason: command.approvalNotes ?? null,
        });

        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'CONVERSION_PENDING',
          }),
          'Partner prospect not found for conversion approval',
        );
      case 'RejectPartnerProspectConversionCommand':
        await this.service.recordConversionDecision({
          tenantId: command.tenantId,
          prospectId: command.prospectId,
          approved: false,
          decidedByUserId: command.actorUserId,
          decidedAt: command.requestedAt,
          reason: command.reason,
        });

        return assertResult(
          await this.service.updateProspectLifecycle({
            tenantId: command.tenantId,
            prospectId: command.prospectId,
            expectedVersion: command.expectedVersion,
            status: 'REJECTED',
          }),
          'Partner prospect not found for conversion rejection',
        );
      case 'ConvertPartnerProspectToPartnerCommand':
        return this.service.convertProspectToPartner(command);
    }
  }
}

export const partnerAcquisitionCommandHandler = new PartnerAcquisitionCommandHandler();
