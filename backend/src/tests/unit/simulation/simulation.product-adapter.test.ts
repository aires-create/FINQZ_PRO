import { describe, expect, it } from 'vitest';

import type { MasterCatalogRuntimeContract } from '../../../modules/master-catalog/application/master-catalog.runtime.js';
import type { SimulationProductContext } from '../../../modules/simulation/products/base/index.js';
import {
  loanWithCollateralAdapter,
  simulationProductRegistry,
  simulationProductResolver,
} from '../../../modules/simulation/products/index.js';

const baseRequest: SimulationProductContext['request'] = {
  tenant: {
    id: 'tenant-1',
    code: 'TENANT_1',
    name: 'Tenant 1',
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
  },
  participants: [
    {
      id: 'customer-1',
      role: 'customer',
      name: 'Cliente Teste',
    },
  ],
  guarantees: [
    {
      id: 'vehicle-1',
      kind: 'vehicle',
      label: 'Veículo principal',
      value: 125000,
    },
  ],
  vehicle: {
    id: 'vehicle-1',
    kind: 'vehicle',
    label: 'Veículo principal',
    value: 125000,
    brand: 'CAOA',
    model: 'Tiggo',
  },
  income: {
    monthlyValue: 25000,
    currency: 'BRL',
    source: 'self_declared',
  },
  agreement: {
    id: 'agreement-1',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
  },
  provider: {
    id: 'provider-1',
    key: 'bank-1',
    code: 'BANK_1',
    name: 'Bank 1',
    type: 'bank',
  },
  commercializadora: undefined,
  bank: {
    id: 'provider-1',
    key: 'bank-1',
    code: 'BANK_1',
    name: 'Bank 1',
    type: 'bank',
  },
  corban: undefined,
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
    stageCode: 'SIMULATION',
    stageName: 'Simulação',
  },
  opportunity: {
    id: 'opportunity-1',
    code: 'OPP-1',
    name: 'Opportunity 1',
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
    executionId: 'execution-1',
    correlationId: 'correlation-1',
    requestId: 'request-1',
    snapshotId: 'snapshot-1',
    tenantId: 'tenant-1',
    performedBy: 'user-1',
    performedAt: '2026-07-09T00:00:00.000Z',
  },
};

const masterCatalogStub: MasterCatalogRuntimeContract = {
  metadata: {
    version: '3.1.0',
    compatibilityMode: 'CANONICAL',
    source: 'backend/master-catalog',
  },
  listSegments: async () => [],
  listProducts: async () => [
    {
      id: 'product-emprestimo-com-garantia',
      code: 'EMPRESTIMO_COM_GARANTIA',
      name: 'Empréstimo com Garantia',
      status: 'ACTIVE',
      displayOrder: 1,
      subproducts: [],
    },
  ],
  listSubproductsByProduct: async () => [
    {
      id: 'subproduct-auto-equity',
      code: 'AUTO_EQUITY',
      name: 'Auto Equity',
      status: 'ACTIVE',
      displayOrder: 1,
      modalities: [],
    },
  ],
  listModalitiesBySubproduct: async () => [],
  getCatalogTree: async () => ({
    segments: [],
    products: [],
  }),
  findProductByCode: async () => ({
    id: 'product-emprestimo-com-garantia',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
    status: 'ACTIVE',
    displayOrder: 1,
    subproducts: [],
  }),
  findSubproductByCode: async () => ({
    id: 'subproduct-auto-equity',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
    status: 'ACTIVE',
    displayOrder: 1,
    modalities: [],
  }),
  findModalityByCode: async () => null,
};

const baseContext: SimulationProductContext = {
  tenant: baseRequest.tenant,
  opportunity: baseRequest.opportunity,
  masterCatalog: masterCatalogStub,
  commercial: baseRequest.commercial,
  execution: baseRequest.execution,
  provider: baseRequest.provider,
  request: baseRequest,
  metadata: baseRequest.metadata,
  bridgeContext: {
    tenantId: 'tenant-1',
    opportunityId: 'opportunity-1',
    simulationId: 'snapshot-1',
    executionId: 'execution-1',
    correlationId: 'correlation-1',
    createdBy: 'user-1',
    source: 'workspace',
    compatibilityMode: 'CANONICAL',
    catalogVersion: '3.1.0',
    engineVersion: '3.2.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
    requestId: 'request-1',
    createdAt: '2026-07-09T00:00:00.000Z',
  },
};

describe('Loan With Collateral Product Adapter', () => {
  it('registers and resolves the official adapter for product and subproduct', () => {
    expect(simulationProductRegistry.list()).toContain(loanWithCollateralAdapter);
    expect(simulationProductResolver.resolve({
      id: 'product-emprestimo-com-garantia',
      code: 'EMPRESTIMO_COM_GARANTIA',
      subproduct: {
        id: 'subproduct-auto-equity',
        code: 'AUTO_EQUITY',
      },
    })).toBe(loanWithCollateralAdapter);
  });

  it('supports Empréstimo com Garantia with Auto Equity and normalizes using the master catalog runtime', async () => {
    expect(loanWithCollateralAdapter.supports(baseContext)).toBe(true);

    const normalized = await loanWithCollateralAdapter.normalize(baseContext);

    expect(normalized.request.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(normalized.request.subproduct.code).toBe('AUTO_EQUITY');
    expect(normalized.request.product.name).toBe('Empréstimo com Garantia');
    expect(normalized.request.subproduct.name).toBe('Auto Equity');
    expect(normalized.request).not.toBe(baseContext.request);
  });

  it('preserves the canonical request and returns a canonical result through the legacy engine bridge', async () => {
    const requestBefore = structuredClone(baseContext.request);

    const result = await loanWithCollateralAdapter.simulate(baseContext);

    expect(baseContext.request).toEqual(requestBefore);
    expect(result.product.code).toBe('EMPRESTIMO_COM_GARANTIA');
    expect(result.subproduct.code).toBe('AUTO_EQUITY');
    expect(result.executionId).toBe('execution-1');
    expect(result.snapshot.snapshotId).toBe('snapshot-1');
    expect(result.proposalReference.proposalVersion).toBe('3.2.0');
    expect(result.result.some((item) => item.key === 'installmentAmount')).toBe(true);
  });

  it('builds snapshot and execution envelope without recalculating finance', async () => {
    const result = await loanWithCollateralAdapter.simulate(baseContext);
    const snapshot = loanWithCollateralAdapter.buildSnapshot(baseContext, result);
    const envelope = loanWithCollateralAdapter.buildExecutionEnvelope(baseContext, result);

    expect(snapshot.request).toEqual(baseContext.request);
    expect(snapshot.result).toBe(result);
    expect(envelope.request).toEqual(baseContext.request);
    expect(envelope.canonicalResult).toBe(result);
    expect(envelope.snapshotReference.snapshotId).toBe('snapshot-1');
    expect(envelope.auditReference.auditId).toBe('execution-1-audit');
  });

  it('builds proposal, ranking, metadata and audit from the same canonical result', async () => {
    const result = await loanWithCollateralAdapter.simulate(baseContext);

    expect(loanWithCollateralAdapter.buildProposal(baseContext, result)).toEqual(result.proposals[0]);
    expect(loanWithCollateralAdapter.buildRanking(baseContext, result)).toBe(result.ranking);
    expect(loanWithCollateralAdapter.buildMetadata(baseContext, result).origin).toBe('workspace');

    const audit = loanWithCollateralAdapter.buildAudit(baseContext, result);
    expect(audit.requestHash).toBeDefined();
    expect(audit.snapshotReference.snapshotId).toBe('snapshot-1');
    expect(audit.recordedAt).toBe('2026-07-09T00:00:00.000Z');
  });
});
