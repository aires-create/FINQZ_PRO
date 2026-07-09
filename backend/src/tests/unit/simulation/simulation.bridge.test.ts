import { describe, expect, it } from 'vitest';

import type {
  SimulationRequest,
  SimulationResult,
} from '../../../modules/simulation/contracts/simulation.contract.js';
import { createSimulationSnapshot } from '../../../modules/simulation/snapshots/simulation-snapshot.factory.js';
import {
  createSimulationExecutionEnvelope,
  createSimulationRequestHash,
} from '../../../modules/simulation/execution/index.js';
import {
  legacySimulationInputToSimulationRequestMapper,
  legacySimulationResultToSimulationResultMapper,
  simulationRequestToLegacySimulationInputMapper,
  simulationResultToLegacySimulationResultMapper,
  createSimulationBridgeContext,
} from '../../../modules/simulation/acl/index.js';

const bridgeContext = createSimulationBridgeContext({
  tenantId: 'tenant-bridge',
  opportunityId: 'opportunity-bridge',
  simulationId: 'snapshot-bridge',
  executionId: 'execution-bridge',
  correlationId: 'correlation-bridge',
  requestId: 'request-bridge',
  createdBy: 'bridge-user',
  source: 'workspace',
  compatibilityMode: 'CANONICAL',
  catalogVersion: '3.1.0',
  engineVersion: '3.2.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
  createdAt: '2026-07-09T00:00:00.000Z',
});

const baseRequest: SimulationRequest = {
  tenant: {
    id: 'tenant-bridge',
    code: 'TENANT_BRIDGE',
    name: 'Tenant Bridge',
  },
  product: {
    id: 'product-bridge',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
    slug: 'emprestimo-com-garantia',
    category: 'credito',
    type: 'financiamento',
    order: 1,
  },
  subproduct: {
    id: 'subproduct-auto-equity',
    productId: 'product-bridge',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
    slug: 'auto-equity',
    category: 'garantia',
    simulationEngine: 'auto-equity-engine',
    proposal: 'proposal-enterprise',
    provider: 'bank',
    workflow: 'approval',
    status: 'ACTIVE',
  },
  customer: {
    id: 'customer-bridge',
    role: 'customer',
    name: 'Cliente Bridge',
    document: '12345678901',
  },
  participants: [
    {
      id: 'participant-bridge',
      role: 'customer',
      name: 'Cliente Bridge',
      document: '12345678901',
    },
  ],
  guarantees: [
    {
      id: 'guarantee-bridge',
      kind: 'vehicle',
      label: 'Veículo principal',
      value: 125000,
    },
  ],
  vehicle: {
    id: 'vehicle-bridge',
    kind: 'vehicle',
    label: 'Veículo principal',
    value: 125000,
    brand: 'CAOA',
    model: 'Tiggo',
    year: 2027,
  },
  income: {
    monthlyValue: 25000,
    currency: 'BRL',
    source: 'self_declared',
  },
  agreement: {
    id: 'agreement-bridge',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
  },
  provider: {
    id: 'provider-bridge',
    key: 'bank-bridge',
    code: 'BANK_BRIDGE',
    name: 'Bank Bridge',
    type: 'bank',
  },
  bank: {
    id: 'provider-bridge',
    key: 'bank-bridge',
    code: 'BANK_BRIDGE',
    name: 'Bank Bridge',
    type: 'bank',
  },
  channel: {
    id: 'channel-bridge',
    code: 'DIGITAL',
    name: 'Digital',
    type: 'online',
  },
  pipeline: {
    id: 'pipeline-bridge',
    code: 'PIPELINE_AUTO_EQUITY',
    name: 'Pipeline Auto Equity',
    stageCode: 'SIMULATION',
    stageName: 'Simulação',
  },
  opportunity: {
    id: 'opportunity-bridge',
    code: 'OPP-BRIDGE',
    name: 'Oportunidade Bridge',
    pipelineId: 'pipeline-bridge',
    stageId: 'stage-bridge',
  },
  commercial: {
    productId: 'product-bridge',
    productCode: 'EMPRESTIMO_COM_GARANTIA',
    subproductId: 'subproduct-auto-equity',
    subproductCode: 'AUTO_EQUITY',
    modality: 'REFINANCIAMENTO',
    pipelineId: 'pipeline-bridge',
    pipelineCode: 'PIPELINE_AUTO_EQUITY',
    commercialTableId: 'table-bridge',
    commercialTableCode: 'table-bridge',
    workflow: 'approval',
    segmentCode: 'VEICULO',
  },
  parameters: {
    requestedAmount: 100000,
    term: 60,
    monthlyRate: 2.09,
    ltv: 80,
  },
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'workspace',
    createdAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  versioning: {
    version: '3.2.0',
    revision: 1,
  },
  execution: {
    executionId: 'execution-bridge',
    correlationId: 'correlation-bridge',
    requestId: 'request-bridge',
    snapshotId: 'snapshot-bridge',
    tenantId: 'tenant-bridge',
    performedBy: 'bridge-user',
    performedAt: '2026-07-09T00:00:00.000Z',
  },
};

const baseLegacyInput = simulationRequestToLegacySimulationInputMapper(baseRequest, bridgeContext);

const baseLegacyResult = {
  requestId: 'request-bridge',
  simulationId: 'snapshot-bridge',
  opportunityId: 'opportunity-bridge',
  tenantId: 'tenant-bridge',
  productId: 'product-bridge',
  productCode: 'EMPRESTIMO_COM_GARANTIA',
  productName: 'Empréstimo com Garantia',
  subproductId: 'subproduct-auto-equity',
  subproductCode: 'AUTO_EQUITY',
  subproductName: 'Auto Equity',
  requestedAmount: 100000,
  term: 60,
  monthlyRate: 2.09,
  installmentAmount: 2939.82,
  totalAmount: 176389.2,
  coefficient: 0.0293982,
  status: 'valida',
  message: 'Approved',
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'workspace',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  version: '3.2.0',
  revision: 1,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

const baseCanonicalResult: SimulationResult = {
  ...baseRequest,
  result: [
    {
      key: 'requestedAmount',
      label: 'Valor solicitado',
      value: 100000,
      unit: 'BRL',
    },
    {
      key: 'installmentAmount',
      label: 'Parcela estimada',
      value: 2939.82,
      unit: 'BRL',
    },
  ],
  proposals: [
    {
      id: 'proposal-bridge',
      reference: 'proposal-ref-bridge',
      status: 'READY',
      provider: baseRequest.provider,
      amount: 100000,
      term: 60,
      monthlyRate: 2.09,
      payload: {
        product: 'EMPRESTIMO_COM_GARANTIA',
      },
    },
  ],
  ranking: {
    candidates: [
      {
        provider: baseRequest.provider,
        score: 0.98,
        position: 1,
        reasons: ['Best fit'],
      },
    ],
    selected: baseRequest.provider,
    selectedIndex: 0,
  },
  decision: {
    status: 'APPROVED',
    reasons: ['Eligible'],
    message: 'Approved',
    recommendedProvider: baseRequest.provider,
  },
  selectedProvider: baseRequest.provider,
  rejectionReasons: [],
  alerts: [],
  warnings: [],
  snapshot: {
    snapshotId: 'snapshot-bridge',
    snapshotVersion: '3.2.0',
    checksum: 'checksum-bridge',
    source: 'workspace',
    capturedAt: '2026-07-09T00:00:00.000Z',
  },
  proposalReference: {
    proposalId: 'proposal-bridge',
    proposalCode: 'PROP-BRIDGE',
    proposalVersion: '3.2.0',
  },
  auditReference: {
    auditId: 'execution-bridge-audit',
    auditCode: 'correlation-bridge',
  },
  executionId: 'execution-bridge',
  executionTimestamp: '2026-07-09T00:00:00.000Z',
  engineVersion: '3.2.0',
  catalogVersion: '3.1.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'workspace',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  versioning: {
    version: '3.2.0',
    revision: 1,
  },
  execution: {
    executionId: 'execution-bridge',
    correlationId: 'correlation-bridge',
    requestId: 'request-bridge',
    snapshotId: 'snapshot-bridge',
    tenantId: 'tenant-bridge',
    performedBy: 'bridge-user',
    performedAt: '2026-07-09T00:00:00.000Z',
  },
  status: 'CALCULATED',
};

describe('simulation bridge ACL', () => {
  it('maps canonical request to legacy input and keeps bridge identifiers', () => {
    expect(baseLegacyInput.tenantId).toBe('tenant-bridge');
    expect(baseLegacyInput.opportunityId).toBe('opportunity-bridge');
    expect(baseLegacyInput.productCode).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(baseLegacyInput.subproductCode).toBe('AUTO_EQUITY');
    expect(baseLegacyInput.requestedAmount).toBe(100000);
    expect(baseLegacyInput.term).toBe(60);
    expect(baseLegacyInput.monthlyRate).toBe(2.09);
    expect(baseLegacyInput.incomeMonthlyValue).toBe(25000);
    expect(baseLegacyInput.requestId).toBe('request-bridge');
    expect(baseLegacyInput.executionId).toBe('execution-bridge');
    expect(baseLegacyInput.version).toBe('3.2.0');
  });

  it('maps legacy input back to canonical request without losing simulation context', () => {
    const request = legacySimulationInputToSimulationRequestMapper(baseLegacyInput, bridgeContext);

    expect(request.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(request.subproduct.code).toBe('AUTO_EQUITY');
    expect(request.parameters.requestedAmount).toBe(100000);
    expect(request.parameters.term).toBe(60);
    expect(request.parameters.monthlyRate).toBe(2.09);
    expect(request.income?.monthlyValue).toBe(25000);
    expect(request.metadata.origin).toBe('workspace');
    expect(request.versioning.version).toBe('3.2.0');
    expect(request.execution?.executionId).toBe('execution-bridge');
  });

  it('maps legacy result to canonical result and keeps proposal data aligned', () => {
    const result = legacySimulationResultToSimulationResultMapper(baseRequest, baseLegacyResult, bridgeContext);

    expect(result.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(result.subproduct.code).toBe('AUTO_EQUITY');
    expect(result.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'requestedAmount', value: 100000 }),
        expect.objectContaining({ key: 'installmentAmount', value: 2939.82 }),
      ]),
    );
    expect(result.decision.status).toBe('APPROVED');
    expect(result.snapshot.snapshotId).toBe('snapshot-bridge');
    expect(result.proposalReference.proposalCode).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(result.executionId).toBe('execution-bridge');
  });

  it('maps canonical result back to legacy result without changing execution numbers', () => {
    const legacyResult = simulationResultToLegacySimulationResultMapper(baseCanonicalResult);

    expect(legacyResult.requestedAmount).toBe(100000);
    expect(legacyResult.installmentAmount).toBe(2939.82);
    expect(legacyResult.status).toBe('valida');
    expect(legacyResult.productCode).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(legacyResult.subproductCode).toBe('AUTO_EQUITY');
    expect(legacyResult.version).toBe('3.2.0');
  });

  it('creates a canonical snapshot and execution envelope from the same request hash', () => {
    const snapshot = createSimulationSnapshot(baseRequest, baseCanonicalResult, bridgeContext);
    const envelopeA = createSimulationExecutionEnvelope(
      baseRequest,
      baseLegacyInput,
      baseLegacyResult,
      baseCanonicalResult,
      bridgeContext,
      snapshot,
    );
    const envelopeB = createSimulationExecutionEnvelope(
      baseRequest,
      baseLegacyInput,
      { ...baseLegacyResult, installmentAmount: 9999.99 },
      {
        ...baseCanonicalResult,
        result: [
          {
            key: 'installmentAmount',
            label: 'Parcela estimada',
            value: 9999.99,
            unit: 'BRL',
          },
        ],
      },
      bridgeContext,
      snapshot,
    );

    expect(snapshot.snapshotId).toBe('snapshot-bridge');
    expect(snapshot.executionId).toBe('execution-bridge');
    expect(snapshot.catalogVersion).toBe('3.1.0');
    expect(envelopeA.requestHash).toBe(envelopeB.requestHash);
    expect(envelopeA.snapshotReference).toEqual(snapshot);
    expect(envelopeA.auditReference.auditId).toBe('execution-bridge-audit');
    expect(envelopeA.executionTimestamp).toBe('2026-07-09T00:00:00.000Z');
  });

  it('generates a stable request hash for structurally equivalent requests', () => {
    const hashA = createSimulationRequestHash(baseRequest);
    const hashB = createSimulationRequestHash({ ...baseRequest, metadata: { ...baseRequest.metadata } });

    expect(hashA).toBe(hashB);
  });
});
