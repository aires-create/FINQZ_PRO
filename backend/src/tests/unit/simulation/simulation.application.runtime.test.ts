import { describe, expect, it } from 'vitest';

import type { MasterCatalogRuntimeContract } from '../../../modules/master-catalog/application/master-catalog.runtime.js';
import type { SimulationRequest, SimulationResult } from '../../../modules/simulation/contracts/simulation.contract.js';
import {
  SimulationApplicationPipeline,
  SimulationApplicationRuntime,
  SimulationApplicationService,
  InvalidCollateralError,
  InvalidSimulationRequestError,
  LegacyExecutionError,
  UnsupportedProductError,
  UnsupportedSubproductError,
} from '../../../modules/simulation/application/index.js';
import type {
  SimulationProductAdapter,
  SimulationProductContext,
  SimulationProductResolverContract,
} from '../../../modules/simulation/products/base/index.js';
import { createSimulationProductCapability, createSimulationProductValidationResult } from '../../../modules/simulation/products/base/index.js';
import { loanWithCollateralAdapter, simulationProductResolver } from '../../../modules/simulation/products/index.js';
import type { LoanWithCollateralSubflow } from '../../../modules/simulation/products/loan-with-collateral/subflows/index.js';

const buildRequest = (): SimulationRequest => ({
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
});

const buildRuntime = (resolver: SimulationProductResolverContract = simulationProductResolver) =>
  new SimulationApplicationRuntime({
    service: new SimulationApplicationService({
      pipeline: new SimulationApplicationPipeline({
        productResolver: resolver,
      }),
    }),
  });

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

const buildStubResult = (request: SimulationRequest): SimulationResult => ({
  ...request,
  result: [],
  proposals: [],
  ranking: {
    candidates: [],
  },
  decision: {
    status: 'PENDING',
    reasons: [],
  },
  rejectionReasons: [],
  alerts: [],
  warnings: [],
  snapshot: {
    snapshotId: request.execution?.snapshotId ?? 'snapshot-1',
    snapshotVersion: request.versioning.version,
    source: request.metadata.origin,
    capturedAt: request.metadata.createdAt,
  },
  proposalReference: {
    proposalId: 'proposal-1',
    proposalVersion: request.versioning.version,
  },
  auditReference: {
    auditId: 'execution-1-audit',
  },
  executionId: request.execution?.executionId ?? 'execution-1',
  executionTimestamp: request.metadata.createdAt,
  engineVersion: request.metadata.engineVersion,
  catalogVersion: request.metadata.catalogVersion,
  policyVersion: request.metadata.policyVersion,
  strategyVersion: request.metadata.strategyVersion,
  metadata: request.metadata,
  versioning: request.versioning,
  execution: request.execution,
  status: 'CALCULATED',
});

const buildStubAdapter = (overrides: Partial<SimulationProductAdapter> & {
  resolveSubflow?: (context: SimulationProductContext) => LoanWithCollateralSubflow | undefined;
} = {}): SimulationProductAdapter & {
  resolveSubflow?: (context: SimulationProductContext) => LoanWithCollateralSubflow | undefined;
} => {
  const request = buildRequest();
  const result = buildStubResult(request);

  return {
    kind: 'loan-with-collateral',
    metadata: loanWithCollateralAdapter.metadata,
    capability: createSimulationProductCapability({ names: ['vehicle', 'property', 'provider', 'guarantor'] }),
    identify: () => true,
    supports: () => true,
    validate: () => createSimulationProductValidationResult(true, []),
    normalize: async (context) => context,
    simulate: async () => result,
    buildProposal: () => null,
    buildRanking: () => ({ candidates: [] }),
    buildMetadata: (_context, simulationResult) => simulationResult.metadata,
    buildAudit: () => ({
      executionId: 'execution-1',
      correlationId: 'correlation-1',
      catalogVersion: '3.1.0',
      engineVersion: '3.2.0',
      policyVersion: '1.0.0',
      strategyVersion: '1.0.0',
      requestHash: 'request-hash',
      snapshotReference: result.snapshot,
      auditReference: result.auditReference,
      recordedAt: '2026-07-09T00:00:00.000Z',
    }),
    buildSnapshot: () => result.snapshot as never,
    buildExecutionEnvelope: () => ({
      executionId: 'execution-1',
      correlationId: 'correlation-1',
      requestHash: 'request-hash',
      request,
      legacyInput: undefined,
      legacyResult: undefined,
      canonicalResult: result,
      snapshotReference: result.snapshot,
      auditReference: result.auditReference,
      engineVersion: result.engineVersion,
      catalogVersion: result.catalogVersion,
      policyVersion: result.policyVersion,
      strategyVersion: result.strategyVersion,
      compatibilityMode: request.metadata.compatibilityMode,
      executionTimestamp: request.metadata.createdAt,
    } as never),
    buildSnapshotReference: () => result.snapshot,
    ...overrides,
  } as SimulationProductAdapter & {
    resolveSubflow?: (context: SimulationProductContext) => LoanWithCollateralSubflow | undefined;
  };
};

describe('Simulation Application Runtime', () => {
  it('executes the full loan-with-collateral application flow', async () => {
    const runtime = buildRuntime();

    const execution = await runtime.execute(buildRequest(), { masterCatalog: masterCatalogStub });

    expect(execution.context.productAdapter.kind).toBe('loan-with-collateral');
    expect(execution.context.subflow?.metadata.subproductCode).toBe('AUTO_EQUITY');
    expect(execution.result.status).toBe('CALCULATED');
    expect(execution.snapshot.snapshotId).toBe('snapshot-1');
    expect(execution.executionEnvelope.executionId).toBeDefined();
  });

  it('rejects unsupported products with a controlled error', async () => {
    const runtime = buildRuntime({
      resolve: () => undefined,
      resolveFromContext: () => undefined,
    });

    await expect(runtime.execute(buildRequest())).rejects.toBeInstanceOf(UnsupportedProductError);
  });

  it('rejects unsupported subproducts with a controlled error', async () => {
    const runtime = buildRuntime({
      resolveFromContext: () => buildStubAdapter({
        resolveSubflow: () => undefined,
      }),
      resolve: () => buildStubAdapter({
        resolveSubflow: () => undefined,
      }),
    });

    await expect(runtime.execute(buildRequest())).rejects.toBeInstanceOf(UnsupportedSubproductError);
  });

  it('rejects invalid collateral with a controlled error', async () => {
    const invalidSubflow: LoanWithCollateralSubflow = {
      metadata: {
        kind: 'auto-equity',
        productId: 'product-emprestimo-com-garantia',
        productCode: 'EMPRESTIMO_COM_GARANTIA',
        productName: 'Empréstimo com Garantia',
        productAliases: ['product-emprestimo-com-garantia'],
        subproductId: 'subproduct-auto-equity',
        subproductCode: 'AUTO_EQUITY',
        subproductName: 'Auto Equity',
        subproductAliases: ['auto-equity'],
        collateralKind: 'vehicle',
      },
      capability: createSimulationProductCapability({ names: ['vehicle'] }),
      identify: () => true,
      supports: () => true,
      validate: () => createSimulationProductValidationResult(false, [
        { code: 'COLLATERAL_MISSING', message: 'missing', severity: 'error' },
      ]),
      prepareContext: (context) => context,
    };

    const runtime = buildRuntime({
      resolveFromContext: () => buildStubAdapter({
        resolveSubflow: () => invalidSubflow,
      }),
      resolve: () => buildStubAdapter({
        resolveSubflow: () => invalidSubflow,
      }),
    });

    await expect(runtime.execute(buildRequest())).rejects.toBeInstanceOf(InvalidCollateralError);
  });

  it('rejects malformed requests before resolving the flow', async () => {
    const runtime = buildRuntime();

    await expect(runtime.execute({
      tenant: undefined,
    } as never)).rejects.toBeInstanceOf(InvalidSimulationRequestError);
  });

  it('wraps legacy execution failures as controlled errors', async () => {
    const failingAdapter = buildStubAdapter({
      simulate: async () => {
        throw new Error('boom');
      },
      resolveSubflow: () => ({
        metadata: {
          kind: 'auto-equity',
          productId: 'product-emprestimo-com-garantia',
          productCode: 'EMPRESTIMO_COM_GARANTIA',
          productName: 'Empréstimo com Garantia',
          productAliases: ['product-emprestimo-com-garantia'],
          subproductId: 'subproduct-auto-equity',
          subproductCode: 'AUTO_EQUITY',
          subproductName: 'Auto Equity',
          subproductAliases: ['auto-equity'],
          collateralKind: 'vehicle',
        },
        capability: createSimulationProductCapability({ names: ['vehicle'] }),
        identify: () => true,
        supports: () => true,
        validate: () => createSimulationProductValidationResult(true, []),
        prepareContext: (context) => context,
      }),
    });

    const runtime = buildRuntime({
      resolve: () => failingAdapter,
      resolveFromContext: () => failingAdapter,
    });

    await expect(runtime.execute(buildRequest(), { masterCatalog: masterCatalogStub })).rejects.toBeInstanceOf(LegacyExecutionError);
  });
});
