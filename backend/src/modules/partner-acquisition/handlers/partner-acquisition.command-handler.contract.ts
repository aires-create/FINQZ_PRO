import type {
  PartnerAcquisitionCommand,
  PartnerAcquisitionCommandType,
} from '../domain/partner-acquisition.commands.js';
import type {
  PartnerAcquisitionEventType,
} from '../domain/partner-acquisition.events.js';
import type {
  PartnerAcquisitionConversionDecision,
  PartnerLead,
  PartnerProspect,
  PartnerProspectStatus,
} from '../domain/partner-acquisition.contract.js';

export type PartnerAcquisitionCommandExecutionResult =
  | PartnerLead
  | PartnerProspect
  | PartnerAcquisitionConversionDecision;

export interface PartnerAcquisitionCommandHandlerContract {
  handle(
    command: PartnerAcquisitionCommand,
  ): Promise<PartnerAcquisitionCommandExecutionResult>;
}

export interface PartnerAcquisitionCommandPlan {
  aggregateId: string | null;
  aggregateType: 'PARTNER_LEAD' | 'PARTNER_PROSPECT';
  eventType: PartnerAcquisitionEventType;
  nextStatus?: PartnerProspectStatus | null;
  payload: Record<string, unknown>;
}

export const PARTNER_ACQUISITION_COMMAND_EVENT_TYPE_MAP = {
  CreatePartnerLeadCommand: 'PartnerLeadCreated',
  CreatePartnerProspectCommand: 'PartnerProspectCreated',
  QualifyPartnerProspectCommand: 'PartnerProspectQualified',
  DisqualifyPartnerProspectCommand: 'PartnerProspectDisqualified',
  MovePartnerProspectToNegotiationCommand: 'PartnerProspectMovedToNegotiation',
  RequestPartnerProspectDocumentationCommand: 'PartnerProspectDocumentationRequested',
  MarkPartnerProspectDocumentationReceivedCommand:
    'PartnerProspectDocumentationReceived',
  RequestPartnerProspectContractCommand: 'PartnerProspectContractRequested',
  MarkPartnerProspectContractSignedCommand: 'PartnerProspectContractSigned',
  ApprovePartnerProspectConversionCommand: 'PartnerProspectConversionApproved',
  RejectPartnerProspectConversionCommand: 'PartnerProspectConversionRejected',
  ConvertPartnerProspectToPartnerCommand: 'PartnerProspectConvertedToPartner',
} as const satisfies Record<PartnerAcquisitionCommandType, PartnerAcquisitionEventType>;

export class PartnerAcquisitionCommandReplayError extends Error {
  constructor(commandType: PartnerAcquisitionCommandType, idempotencyKey: string) {
    super(`Partner acquisition command ${commandType} already processed for ${idempotencyKey}`);
    this.name = 'PartnerAcquisitionCommandReplayError';
  }
}

export class PartnerAcquisitionCommandFailedError extends Error {
  constructor(commandType: PartnerAcquisitionCommandType, idempotencyKey: string, message: string) {
    super(`Partner acquisition command ${commandType} failed for ${idempotencyKey}: ${message}`);
    this.name = 'PartnerAcquisitionCommandFailedError';
  }
}
