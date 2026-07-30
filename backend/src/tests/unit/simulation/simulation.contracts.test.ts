import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createSimulationAudit,
  createSimulationExecutionContext,
  createSimulationMetadata,
  createSimulationRequest,
  createSimulationResult,
  createSimulationSnapshotReference,
} from '../../../modules/simulation/contracts/simulation.factory.js';
import type {
  SimulationRequest,
  SimulationResult,
} from '../../../modules/simulation/contracts/simulation.contract.js';
import { createSimulationVersion } from '../../../modules/simulation/value-objects/simulation-version.value-object.js';

const contractPath = resolve(
  process.cwd(),
  'src/modules/simulation/contracts/simulation.contract.ts',
);

const contractSource = readFileSync(contractPath, 'utf8');

const baseContext: SimulationRequest = {
  tenant: {
    id: 'tenant-1',
    code: 'tenant-one',
    name: 'Tenant One',
  },
  product: {
    id: 'product-emprestimo-com-garantia',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
    slug: 'emprestimo-com-garantia',
    category: 'credito',
    type: 'financiamento',
    order: 1,
  },
  subproduct: {
    id: 'subproduct-auto-equity',
    productId: 'product-emprestimo-com-garantia',
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
    id: 'customer-1',
    role: 'customer',
    name: 'Cliente Teste',
    document: '12345678901',
  },
  participants: [],
  guarantees: [],
  vehicle: {
    id: 'vehicle-1',
    kind: 'vehicle',
    label: 'Veículo Principal',
    value: 125000,
    brand: 'CAOA',
    model: 'Tiggo',
  },
  property: {
    id: 'property-1',
    kind: 'property',
    label: 'Imóvel Teste',
    value: 350000,
  },
  income: {
    monthlyValue: 25000,
    currency: 'BRL',
  },
  agreement: {
    id: 'agreement-1',
    code: 'AG-1',
    name: 'Convênio Teste',
  },
  provider: {
    id: 'provider-1',
    key: 'bank-1',
    code: 'BANK_1',
    name: 'Banco Teste',
    type: 'bank',
  },
  commercializadora: {
    id: 'provider-2',
    key: 'energy-1',
    code: 'ENERGY_1',
    name: 'Comercializadora Teste',
    type: 'commercializadora',
  },
  bank: {
    id: 'provider-1',
    key: 'bank-1',
    code: 'BANK_1',
    name: 'Banco Teste',
    type: 'bank',
  },
  corban: {
    id: 'provider-3',
    key: 'corban-1',
    code: 'CORBAN_1',
    name: 'Corban Teste',
    type: 'corban',
  },
  channel: {
    id: 'channel-1',
    code: 'DIGITAL',
    name: 'Digital',
    type: 'online',
  },
  pipeline: {
    id: 'pipeline-1',
    code: 'PIPELINE_EMPRESTIMO_COM_GARANTIA',
    name: 'Pipeline - Empréstimo com Garantia',
    stageCode: 'ANALISE',
    stageName: 'Análise',
  },
  opportunity: {
    id: 'opportunity-1',
    code: 'OPP-1',
    name: 'Oportunidade Teste',
    pipelineId: 'pipeline-1',
    stageId: 'stage-1',
  },
  commercial: {
    productId: 'product-emprestimo-com-garantia',
    productCode: 'EMPRESTIMO_COM_GARANTIA',
    subproductId: 'subproduct-auto-equity',
    subproductCode: 'AUTO_EQUITY',
    modality: 'REFINANCIAMENTO',
    pipelineId: 'pipeline-1',
    pipelineCode: 'PIPELINE_EMPRESTIMO_COM_GARANTIA',
    commercialTableId: 'table-1',
    commercialTableCode: 'table-1',
    workflow: 'approval',
    segmentCode: 'FGTS',
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
    executionId: 'exec-1',
    correlationId: 'corr-1',
    requestId: 'req-1',
    snapshotId: 'snap-1',
    tenantId: 'tenant-1',
    performedBy: 'user-1',
    performedAt: '2026-07-09T00:00:00.000Z',
  },
};

const baseResult: SimulationResult = {
  ...baseContext,
  result: [
    {
      key: 'installmentAmount',
      label: 'Parcela',
      value: 2939.82,
      unit: 'BRL',
    },
  ],
  proposals: [
    {
      id: 'proposal-1',
      reference: 'prop-1',
      status: 'READY',
      provider: baseContext.provider,
      amount: 100000,
      term: 60,
      monthlyRate: 2.09,
      payload: { product: 'AUTO_EQUITY' },
    },
  ],
  ranking: {
    candidates: [
      {
        provider: baseContext.provider,
        score: 0.98,
        position: 1,
        reasons: ['Best fit'],
      },
    ],
    selected: baseContext.provider,
    selectedIndex: 0,
  },
  decision: {
    status: 'APPROVED',
    reasons: ['Eligible'],
    message: 'Approved',
    recommendedProvider: baseContext.provider,
  },
  selectedProvider: baseContext.provider,
  rejectionReasons: [],
  alerts: ['Check income docs'],
  warnings: ['Estimate only'],
  snapshot: {
    snapshotId: 'snap-1',
    snapshotVersion: '1',
    checksum: 'abc123',
    source: 'workspace',
    capturedAt: '2026-07-09T00:00:00.000Z',
  },
  proposalReference: {
    proposalId: 'proposal-1',
    proposalCode: 'PROP-1',
    proposalVersion: '1',
  },
  auditReference: {
    auditId: 'audit-1',
    auditCode: 'AUD-1',
  },
  executionId: 'exec-1',
  executionTimestamp: '2026-07-09T00:00:00.000Z',
  engineVersion: '3.2.0',
  catalogVersion: '3.1.0',
  policyVersion: '1.0.0',
  strategyVersion: '1.0.0',
  metadata: {
    compatibilityMode: 'CANONICAL',
    origin: 'engine',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  status: 'CALCULATED',
};

describe('simulation contracts', () => {
  it('exposes the canonical request shape without proposal or pdf imports', () => {
    expect(baseContext.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(baseContext.subproduct.code).toBe('AUTO_EQUITY');
    expect(contractSource).not.toMatch(/from\s+['"][^'"]*(proposal|pdf|react)[^'"]*['"]/i);
    expect(contractSource).not.toContain('proposalPdf');
    expect(contractSource).not.toContain('React');
  });

  it('can create immutable request and metadata envelopes', () => {
    const request = createSimulationRequest(baseContext);
    const metadata = createSimulationMetadata(baseContext.metadata);
    const execution = createSimulationExecutionContext(baseContext.execution!);

    expect(request).toEqual(baseContext);
    expect(request).not.toBe(baseContext);
    expect(request.participants).not.toBe(baseContext.participants);
    expect(metadata).toEqual(baseContext.metadata);
    expect(execution).toEqual(baseContext.execution);
    expect(createSimulationVersion(' 3.2.0 ')).toEqual({ value: '3.2.0' });
  });

  it('can create immutable result and audit envelopes', () => {
    const result = createSimulationResult(baseResult);
    const snapshot = createSimulationSnapshotReference(baseResult.snapshot);
    const audit = createSimulationAudit({
      executionId: 'exec-1',
      correlationId: 'corr-1',
      catalogVersion: '3.1.0',
      engineVersion: '3.2.0',
      policyVersion: '1.0.0',
      strategyVersion: '1.0.0',
      requestHash: 'hash-1',
      snapshotReference: baseResult.snapshot,
      auditReference: baseResult.auditReference,
      recordedAt: '2026-07-09T00:00:00.000Z',
    });

    expect(result).toEqual(baseResult);
    expect(result).not.toBe(baseResult);
    expect(result.result).not.toBe(baseResult.result);
    expect(snapshot).toEqual(baseResult.snapshot);
    expect(audit.snapshotReference).toEqual(baseResult.snapshot);
    expect(audit.auditReference).toEqual(baseResult.auditReference);
  });
});
