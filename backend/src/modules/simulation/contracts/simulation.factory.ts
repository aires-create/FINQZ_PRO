import type {
  SimulationAudit,
  SimulationAuditReference,
  SimulationExecutionContext,
  SimulationMetadata,
  SimulationRequest,
  SimulationResult,
  SimulationSnapshotReference,
} from './simulation.contract.js';
import {
  toSimulationAuditReferenceDto,
  toSimulationAuditDto,
  toSimulationExecutionContextDto,
  toSimulationMetadataDto,
  toSimulationRequestDto,
  toSimulationResultDto,
  toSimulationSnapshotReferenceDto,
} from '../dto/simulation.dto.js';

export const createSimulationRequest = (
  request: SimulationRequest,
): SimulationRequest => toSimulationRequestDto(request);

export const createSimulationResult = (
  result: SimulationResult,
): SimulationResult => toSimulationResultDto(result);

export const createSimulationMetadata = (
  metadata: SimulationMetadata,
): SimulationMetadata => toSimulationMetadataDto(metadata);

export const createSimulationExecutionContext = (
  execution: SimulationExecutionContext,
): SimulationExecutionContext => toSimulationExecutionContextDto(execution);

export const createSimulationSnapshotReference = (
  snapshot: SimulationSnapshotReference,
): SimulationSnapshotReference => toSimulationSnapshotReferenceDto(snapshot);

export const createSimulationAuditReference = (
  auditReference: SimulationAuditReference,
): SimulationAuditReference => toSimulationAuditReferenceDto(auditReference);

export const createSimulationAudit = (
  audit: SimulationAudit,
): SimulationAudit => toSimulationAuditDto(audit);
