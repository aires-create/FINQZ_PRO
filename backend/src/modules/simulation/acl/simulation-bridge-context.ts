import type { SimulationCompatibilityMode } from '../types/simulation.types.js';

export interface SimulationBridgeContext {
  tenantId: string;
  opportunityId: string;
  simulationId: string;
  executionId: string;
  correlationId: string;
  createdBy: string;
  source: string;
  compatibilityMode: SimulationCompatibilityMode;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
  requestId?: string | undefined;
  createdAt: string;
}

export interface SimulationBridgeVersioning {
  version: string;
  revision?: number;
}

export const createSimulationBridgeContext = (
  context: Partial<SimulationBridgeContext>,
): SimulationBridgeContext => {
  const now = new Date().toISOString();

  return {
    tenantId: context.tenantId ?? 'legacy-tenant',
    opportunityId: context.opportunityId ?? 'legacy-opportunity',
    simulationId: context.simulationId ?? 'legacy-simulation',
    executionId: context.executionId ?? 'legacy-execution',
    correlationId: context.correlationId ?? 'legacy-correlation',
    createdBy: context.createdBy ?? 'legacy-bridge',
    source: context.source ?? 'simulation-bridge',
    compatibilityMode: context.compatibilityMode ?? 'COMPATIBILITY',
    catalogVersion: context.catalogVersion ?? '0',
    engineVersion: context.engineVersion ?? '0',
    policyVersion: context.policyVersion ?? '0',
    strategyVersion: context.strategyVersion ?? '0',
    requestId: context.requestId,
    createdAt: context.createdAt ?? now,
  };
};

export const createSimulationBridgeVersioning = (
  version: string,
  revision?: number,
): SimulationBridgeVersioning => {
  const normalizedVersion = version.trim();

  return revision === undefined
    ? { version: normalizedVersion }
    : { version: normalizedVersion, revision };
};
