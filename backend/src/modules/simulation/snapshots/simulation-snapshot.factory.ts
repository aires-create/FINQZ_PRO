import type { SimulationRequest, SimulationResult } from '../contracts/simulation.contract.js';
import type { SimulationCompatibilityMode } from '../types/simulation.types.js';
import type { SimulationBridgeContext } from '../acl/simulation-bridge-context.js';
import { createSimulationBridgeContext } from '../acl/simulation-bridge-context.js';
import type { SimulationSnapshot } from './simulation-snapshot.contract.js';

export const createSimulationSnapshot = (
  request: SimulationRequest,
  result: SimulationResult,
  contextInput: Partial<SimulationBridgeContext> = {},
): SimulationSnapshot => {
  const context = createSimulationBridgeContext({
    ...contextInput,
    tenantId: contextInput.tenantId ?? request.tenant.id,
    opportunityId: contextInput.opportunityId ?? request.opportunity?.id ?? 'legacy-opportunity',
    simulationId: contextInput.simulationId ?? request.execution?.snapshotId ?? 'legacy-simulation',
    executionId: contextInput.executionId ?? request.execution?.executionId ?? 'legacy-execution',
    correlationId: contextInput.correlationId ?? request.execution?.correlationId ?? 'legacy-correlation',
    source: contextInput.source ?? request.metadata.origin ?? 'simulation-bridge',
    compatibilityMode: contextInput.compatibilityMode ?? request.metadata.compatibilityMode,
    catalogVersion: contextInput.catalogVersion ?? request.metadata.catalogVersion,
    engineVersion: contextInput.engineVersion ?? request.metadata.engineVersion,
    policyVersion: contextInput.policyVersion ?? request.metadata.policyVersion,
    strategyVersion: contextInput.strategyVersion ?? request.metadata.strategyVersion,
    createdAt: contextInput.createdAt ?? request.metadata.createdAt,
  });

  return {
    snapshotId: context.simulationId,
    tenantId: context.tenantId,
    opportunityId: context.opportunityId,
    simulationId: context.simulationId,
    executionId: context.executionId,
    correlationId: context.correlationId,
    request,
    result,
    catalogVersion: context.catalogVersion,
    engineVersion: context.engineVersion,
    policyVersion: context.policyVersion,
    strategyVersion: context.strategyVersion,
    createdAt: context.createdAt,
    createdBy: context.createdBy,
    source: context.source,
    compatibilityMode: context.compatibilityMode,
  };
};
