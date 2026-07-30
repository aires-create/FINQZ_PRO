import type { SimulationCompatibilityMode } from '../types/simulation.types.js';
import type { SimulationRequest, SimulationResult } from '../contracts/simulation.contract.js';

export interface SimulationSnapshot {
  snapshotId: string;
  tenantId: string;
  opportunityId: string;
  simulationId: string;
  executionId: string;
  correlationId: string;
  request: SimulationRequest;
  result: SimulationResult;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
  createdAt: string;
  createdBy: string;
  source: string;
  compatibilityMode: SimulationCompatibilityMode;
}
