import type { SimulationAuditReference, SimulationRequest, SimulationResult, SimulationSnapshotReference } from '../contracts/simulation.contract.js';
import type { LegacySimulationInput, LegacySimulationResult } from '../acl/legacy-simulation.types.js';
import type { SimulationBridgeContext } from '../acl/simulation-bridge-context.js';
import { createSimulationBridgeContext } from '../acl/simulation-bridge-context.js';
import { createSimulationRequestHash } from './request-hash.factory.js';
import { createSimulationExecutionId } from './execution-id.factory.js';
import { createSimulationCorrelationId } from './correlation-id.factory.js';
import type { SimulationExecutionEnvelope } from './simulation-execution-envelope.contract.js';
import { createSimulationSnapshotReference } from '../value-objects/simulation-snapshot-reference.value-object.js';

export const createSimulationExecutionEnvelope = (
  request: SimulationRequest,
  legacyInput: LegacySimulationInput,
  legacyResult: LegacySimulationResult,
  canonicalResult: SimulationResult,
  contextInput: Partial<SimulationBridgeContext> = {},
  snapshotReference?: SimulationSnapshotReference,
  auditReference?: SimulationAuditReference,
): SimulationExecutionEnvelope => {
  const context = createSimulationBridgeContext({
    ...contextInput,
    tenantId: contextInput.tenantId ?? request.tenant.id,
    opportunityId: contextInput.opportunityId ?? request.opportunity?.id ?? legacyInput.opportunityId ?? 'legacy-opportunity',
    simulationId: contextInput.simulationId ?? legacyResult.simulationId ?? 'legacy-simulation',
    executionId: contextInput.executionId ?? legacyInput.executionId ?? createSimulationExecutionId(),
    correlationId: contextInput.correlationId ?? legacyInput.correlationId ?? createSimulationCorrelationId(),
    source: contextInput.source ?? request.metadata.origin ?? 'simulation-bridge',
    compatibilityMode: contextInput.compatibilityMode ?? request.metadata.compatibilityMode,
    catalogVersion: contextInput.catalogVersion ?? request.metadata.catalogVersion,
    engineVersion: contextInput.engineVersion ?? request.metadata.engineVersion,
    policyVersion: contextInput.policyVersion ?? request.metadata.policyVersion,
    strategyVersion: contextInput.strategyVersion ?? request.metadata.strategyVersion,
  });

  return {
    executionId: context.executionId,
    correlationId: context.correlationId,
    requestHash: createSimulationRequestHash(request),
    request,
    legacyInput,
    legacyResult,
    canonicalResult,
    snapshotReference:
      snapshotReference ??
      createSimulationSnapshotReference(context.simulationId, request.versioning.version, {
        source: context.source,
        capturedAt: context.createdAt,
      }),
    auditReference:
      auditReference ?? {
        auditId: `${context.executionId}-audit`,
        auditCode: context.correlationId,
      },
    engineVersion: context.engineVersion,
    catalogVersion: context.catalogVersion,
    policyVersion: context.policyVersion,
    strategyVersion: context.strategyVersion,
    compatibilityMode: context.compatibilityMode,
    executionTimestamp: context.createdAt,
  };
};
