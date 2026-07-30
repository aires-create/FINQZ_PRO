import { describe, expect, it, vi } from 'vitest';

import type { SimulationApplicationExecutionResult } from '../../../modules/simulation/application/simulation.application.context.js';
import type { SimulationApplicationRuntime } from '../../../modules/simulation/application/simulation.application.runtime.js';
import type { SimulationRequest, SimulationResult } from '../../../modules/simulation/contracts/simulation.contract.js';
import { SimulationRuntimeController } from '../../../modules/simulation/presentation/http/simulation-runtime.controller.js';

const createReplyMock = () => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };

  return reply as never;
};

const buildRequest = (): SimulationRequest => ({
  tenant: {
    id: 'tenant-1',
  },
  product: {
    id: 'product-emprestimo-com-garantia',
    code: 'EMPRESTIMO_COM_GARANTIA',
    name: 'Empréstimo com Garantia',
  },
  subproduct: {
    id: 'subproduct-auto-equity',
    productId: 'product-emprestimo-com-garantia',
    code: 'AUTO_EQUITY',
    name: 'Auto Equity',
    simulationEngine: 'auto-equity-engine',
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
  guarantees: [],
  vehicle: {
    id: 'vehicle-1',
    kind: 'vehicle',
    label: 'Veiculo principal',
    value: 125000,
  },
  income: {
    monthlyValue: 25000,
    currency: 'BRL',
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
  bank: {
    id: 'provider-1',
    key: 'bank-1',
    code: 'BANK_1',
    name: 'Bank 1',
    type: 'bank',
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
    origin: 'simulation-runtime-http',
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
    performedBy: 'user-1',
    performedAt: '2026-07-09T00:00:00.000Z',
  },
});

const buildResult = (request: SimulationRequest): SimulationResult => ({
  ...request,
  result: [
    {
      key: 'requestedAmount',
      label: 'Valor solicitado',
      value: 100000,
      unit: 'BRL',
    },
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
      provider: request.provider,
      amount: 100000,
      term: 60,
      monthlyRate: 2.09,
      payload: { product: 'AUTO_EQUITY' },
    },
  ],
  ranking: {
    candidates: [],
    selected: request.provider,
    selectedIndex: 0,
  },
  decision: {
    status: 'APPROVED',
    reasons: ['Eligible'],
    message: 'Approved',
    recommendedProvider: request.provider,
  },
  selectedProvider: request.provider,
  rejectionReasons: [],
  alerts: [],
  warnings: ['Estimate only'],
  snapshot: {
    snapshotId: 'snap-1',
    snapshotVersion: '1',
    checksum: 'abc123',
    source: 'simulation-runtime-http',
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
    origin: 'simulation-runtime-http',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    engineVersion: '3.2.0',
    catalogVersion: '3.1.0',
    policyVersion: '1.0.0',
    strategyVersion: '1.0.0',
  },
  status: 'CALCULATED',
});

describe('SimulationRuntimeController', () => {
  it('hidrata tenant, requestId e correlationId na execução oficial', async () => {
    const request = buildRequest();
    const executionResult: SimulationApplicationExecutionResult = {
      context: {
        request,
        executionId: 'exec-1',
        correlationId: 'corr-1',
        productAdapter: {} as never,
        bridgeContext: {
          tenantId: 'tenant-1',
          opportunityId: 'opportunity-1',
          simulationId: 'snap-1',
          executionId: 'exec-1',
          correlationId: 'corr-1',
          createdBy: 'user-1',
          source: 'simulation-runtime-http',
          compatibilityMode: 'CANONICAL',
          catalogVersion: '3.1.0',
          engineVersion: '3.2.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          requestId: 'req-1',
          createdAt: '2026-07-09T00:00:00.000Z',
        },
        result: buildResult(request),
        snapshot: {
          snapshotId: 'snap-1',
          tenantId: 'tenant-1',
          opportunityId: 'opportunity-1',
          simulationId: 'snap-1',
          executionId: 'exec-1',
          correlationId: 'corr-1',
          request,
          result: buildResult(request),
          catalogVersion: '3.1.0',
          engineVersion: '3.2.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          createdAt: '2026-07-09T00:00:00.000Z',
          createdBy: 'user-1',
          source: 'simulation-runtime-http',
          compatibilityMode: 'CANONICAL',
        },
        executionEnvelope: {
          executionId: 'exec-1',
          correlationId: 'corr-1',
          requestHash: 'hash-1',
          request,
          legacyInput: {} as never,
          legacyResult: {} as never,
          canonicalResult: buildResult(request),
          snapshotReference: {
            snapshotId: 'snap-1',
            snapshotVersion: '1',
          },
          auditReference: {
            auditId: 'audit-1',
            auditCode: 'AUD-1',
          },
          engineVersion: '3.2.0',
          catalogVersion: '3.1.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          compatibilityMode: 'CANONICAL',
          executionTimestamp: '2026-07-09T00:00:00.000Z',
        },
      },
      result: buildResult(request),
        snapshot: {
          snapshotId: 'snap-1',
          tenantId: 'tenant-1',
          opportunityId: 'opportunity-1',
          simulationId: 'snap-1',
          executionId: 'exec-1',
          correlationId: 'corr-1',
          request,
          result: buildResult(request),
          catalogVersion: '3.1.0',
          engineVersion: '3.2.0',
          policyVersion: '1.0.0',
          strategyVersion: '1.0.0',
          createdAt: '2026-07-09T00:00:00.000Z',
          createdBy: 'user-1',
          source: 'simulation-runtime-http',
          compatibilityMode: 'CANONICAL',
        },
      executionEnvelope: {
        executionId: 'exec-1',
        correlationId: 'corr-1',
        requestHash: 'hash-1',
        request,
        legacyInput: {} as never,
        legacyResult: {} as never,
        canonicalResult: buildResult(request),
        snapshotReference: {
          snapshotId: 'snap-1',
          snapshotVersion: '1',
        },
        auditReference: {
          auditId: 'audit-1',
          auditCode: 'AUD-1',
        },
        engineVersion: '3.2.0',
        catalogVersion: '3.1.0',
        policyVersion: '1.0.0',
        strategyVersion: '1.0.0',
        compatibilityMode: 'CANONICAL',
        executionTimestamp: '2026-07-09T00:00:00.000Z',
      },
    };

    const runtime = {
      execute: vi.fn(async () => executionResult),
    } as unknown as SimulationApplicationRuntime;

    const controller = new SimulationRuntimeController(runtime);
    const reply = createReplyMock();
    const responseRequest = {
      currentTenant: { tenantId: 'tenant-1', userId: 'user-1' },
      currentUser: { userId: 'user-1', tenantId: 'tenant-1' },
      requestId: 'req-1',
      correlationId: 'corr-1',
      body: {
        product: request.product,
        subproduct: request.subproduct,
        customer: request.customer,
        participants: request.participants,
        guarantees: request.guarantees,
        vehicle: request.vehicle,
        income: request.income,
        agreement: request.agreement,
        provider: request.provider,
        bank: request.bank,
        channel: request.channel,
        pipeline: request.pipeline,
        opportunity: request.opportunity,
        commercial: request.commercial,
        parameters: request.parameters,
        metadata: request.metadata,
        versioning: request.versioning,
        execution: request.execution,
      },
    } as never;

    await controller.execute(responseRequest, reply);

    expect((runtime.execute as any)).toHaveBeenCalledTimes(1);
    expect((runtime.execute as any)).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: { id: 'tenant-1' },
        product: expect.objectContaining({
          code: 'EMPRESTIMO_COM_GARANTIA',
        }),
        execution: expect.objectContaining({
          requestId: 'req-1',
          correlationId: 'corr-1',
        }),
      }),
      expect.objectContaining({
        bridgeContext: expect.objectContaining({
          tenantId: 'tenant-1',
          requestId: 'req-1',
          correlationId: 'corr-1',
        }),
      }),
    );
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          executionId: 'exec-1',
          correlationId: 'corr-1',
          tenant: { id: 'tenant-1' },
        }),
      }),
    );
    expect(JSON.stringify(reply.send.mock.calls[0][0])).not.toContain('legacyInput');
    expect(JSON.stringify(reply.send.mock.calls[0][0])).not.toContain('legacyResult');
  });

  it('retorna 403 quando o tenant não estiver presente', async () => {
    const runtime = {
      execute: vi.fn(),
    } as unknown as SimulationApplicationRuntime;
    const controller = new SimulationRuntimeController(runtime);
    const reply = createReplyMock();

    await controller.execute(
      {
        currentTenant: null,
        currentUser: null,
        body: buildRequest(),
      } as never,
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Missing tenant context',
        }),
      }),
    );
  });
});
