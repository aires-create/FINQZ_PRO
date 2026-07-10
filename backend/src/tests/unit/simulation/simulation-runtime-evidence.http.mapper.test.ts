import { describe, expect, it } from 'vitest';

import type { FastifyRequest } from 'fastify';

import {
  buildSimulationRuntimeEvidenceContext,
  buildSimulationRuntimeEvidenceInput,
  mapSimulationRuntimeEvidenceRecordToHttpResponse,
} from '../../../modules/simulation/evidence/index.js';
import type {
  SimulationRuntimeEvidenceHttpRequestBodyContract,
} from '../../../modules/simulation/evidence/index.js';

const buildBody = (): SimulationRuntimeEvidenceHttpRequestBodyContract => ({
  evidenceId: 'sim-runtime-evidence-00000001',
  campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
  timestamp: '2026-07-10T12:00:00.000Z',
  environment: 'homologation',
  requestId: 'request-1',
  correlationId: 'correlation-1',
  executionId: 'execution-1',
  productCode: 'LOAN_WITH_COLLATERAL',
  subproductCode: 'AUTO_EQUITY',
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

describe('simulation runtime evidence http mapper', () => {
  it('uses the authenticated tenant and ignores body tenant fields', () => {
    const body = {
      ...buildBody(),
      tenantIdHash: '  tenant-hash  ',
      opportunityIdHash: null,
      legacyStatus: null,
      tenantId: 'tenant-hijack',
    } as unknown as SimulationRuntimeEvidenceHttpRequestBodyContract;

    const request = {
      currentTenant: {
        tenantId: 'tenant-a',
        userId: 'user-1',
      },
      currentUser: {
        userId: 'user-1',
        tenantId: 'tenant-a',
        permissions: ['simulation:evidence:write'],
      },
    } as unknown as FastifyRequest;

    const input = buildSimulationRuntimeEvidenceInput(body);
    const context = buildSimulationRuntimeEvidenceContext(request);

    expect(input).toMatchObject({
      evidenceId: 'sim-runtime-evidence-00000001',
      tenantIdHash: 'tenant-hash',
      opportunityIdHash: null,
      legacyStatus: null,
    });
    expect(Object.prototype.hasOwnProperty.call(input, 'tenantId')).toBe(false);
    expect(context.tenantId).toBe('tenant-a');
    expect(context.receivedByUserId).toBe('user-1');
    expect(context.receivedAt).toBeInstanceOf(Date);
  });

  it('maps the persisted record back to a sanitized HTTP response', () => {
    const response = mapSimulationRuntimeEvidenceRecordToHttpResponse({
      tenantId: 'tenant-a',
      evidenceId: 'sim-runtime-evidence-00000001',
      campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
      timestamp: '2026-07-10T12:00:00.000Z',
      environment: 'homologation',
      tenantIdHash: null,
      opportunityIdHash: null,
      requestId: 'request-1',
      correlationId: 'correlation-1',
      executionId: 'execution-1',
      productCode: 'LOAN_WITH_COLLATERAL',
      subproductCode: 'AUTO_EQUITY',
      legacyStatus: null,
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
      receivedByUserId: 'user-1',
      receivedAt: new Date('2026-07-10T12:00:01.000Z'),
    });

    expect(response).toEqual({
      success: true,
      data: {
        evidenceId: 'sim-runtime-evidence-00000001',
        campaignId: 'SDC-3.4H-HOMOLOGATION-2026-07',
        requestId: 'request-1',
        correlationId: 'correlation-1',
        executionId: 'execution-1',
        productCode: 'LOAN_WITH_COLLATERAL',
        subproductCode: 'AUTO_EQUITY',
        comparisonStatus: 'EQUIVALENT',
        divergenceCategory: 'NONE',
        shadowMode: true,
        timestamp: '2026-07-10T12:00:00.000Z',
        receivedAt: '2026-07-10T12:00:01.000Z',
      },
    });
  });
});
