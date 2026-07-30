import type { SimulationAuditReference, SimulationRequest, SimulationResult, SimulationSnapshotReference } from '../contracts/simulation.contract.js';
import type { SimulationCompatibilityMode } from '../types/simulation.types.js';
import type { LegacySimulationInput, LegacySimulationResult } from '../acl/legacy-simulation.types.js';

export interface SimulationExecutionEnvelope {
  executionId: string;
  correlationId: string;
  requestHash: string;
  request: SimulationRequest;
  legacyInput: LegacySimulationInput;
  legacyResult: LegacySimulationResult;
  canonicalResult: SimulationResult;
  snapshotReference: SimulationSnapshotReference;
  auditReference: SimulationAuditReference;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
  compatibilityMode: SimulationCompatibilityMode;
  executionTimestamp: string;
}
