import { describe, expect, it } from 'vitest';

import {
  simulationRuntimeEvidenceRequestBodySchema,
  simulationRuntimeEvidenceRouteInventory,
  simulationRuntimeEvidenceRouteSchema,
} from '../../../modules/simulation/evidence/index.js';

const buildValidBody = () => ({
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  tenantIdHash: 'tenant-hash-0001',
  opportunityIdHash: 'opportunity-hash-0001',
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'LOAN_WITH_COLLATERAL',
  subproductCode: 'AUTO_EQUITY',
  legacyStatus: 'approved',
  canonicalStatus: 'approved',
  comparisonStatus: 'EQUIVALENT',
  divergenceCategory: 'NONE',
  divergenceCount: 0,
  financialCriticalCount: 0,
  financialMinorCount: 0,
  structuralCount: 0,
  missingCanonicalFieldCount: 0,
  missingLegacyFieldCount: 0,
  mappingFailure: false,
  runtimeFailure: false,
  unsupportedScenario: false,
  legacyDurationMs: null,
  runtimeDurationMs: 120,
  fallbackUsed: false,
  shadowMode: true,
  comparatorVersion: '1.0.0',
  contractVersion: '1.0.0',
  catalogVersion: '1.0.0',
  engineVersion: '1.0.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
});

describe('simulation runtime evidence http schema', () => {
  it('accepts the sanitized evidence payload', () => {
    const payload = simulationRuntimeEvidenceRequestBodySchema.parse(buildValidBody());

    expect(payload.shadowMode).toBe(true);
    expect(payload.campaignId).toBe('SDC-3.4H-HOMOLOGATION-2026-07');
  });

  it('rejects extra fields on a strict body', () => {
    const result = simulationRuntimeEvidenceRequestBodySchema.safeParse({
      ...buildValidBody(),
      unexpectedField: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects shadowMode false', () => {
    const result = simulationRuntimeEvidenceRequestBodySchema.safeParse({
      ...buildValidBody(),
      shadowMode: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects negative counters', () => {
    const result = simulationRuntimeEvidenceRequestBodySchema.safeParse({
      ...buildValidBody(),
      divergenceCount: -1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid comparison and divergence enums', () => {
    const result = simulationRuntimeEvidenceRequestBodySchema.safeParse({
      ...buildValidBody(),
      comparisonStatus: 'INVALID_ENUM',
    });

    expect(result.success).toBe(false);
  });

  it('exposes the route contract for simulation evidence ingestion', () => {
    expect(simulationRuntimeEvidenceRouteInventory).toEqual([
      {
        method: 'POST',
        path: '/runtime-evidence',
        permission: 'simulation:evidence:write',
      },
    ]);

    expect(simulationRuntimeEvidenceRouteSchema.tags).toContain(
      'Simulation Runtime Evidence',
    );
    expect(simulationRuntimeEvidenceRouteSchema.response[201]).toBeDefined();
    expect(simulationRuntimeEvidenceRouteSchema.response[401]).toMatchObject({
      required: ['success', 'requestId', 'message'],
    });
    expect(simulationRuntimeEvidenceRouteSchema.response[401].properties).not.toHaveProperty('error');
  });
});
