import type {
  SimulationAuditReference,
  SimulationDecision,
  SimulationProposal,
  SimulationRanking,
  SimulationResultItem,
  SimulationSnapshotReference,
  SimulationTenantContext,
  SimulationProductContext,
  SimulationSubproductContext,
} from '../../contracts/simulation.contract.js';
import type { SimulationCompatibilityMode, SimulationResultStatus } from '../../types/simulation.types.js';

export type SimulationRuntimeHttpHeadersContract = {
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
};

export type SimulationRuntimeHttpRequestBodyContract = {
  product: SimulationProductContext;
  subproduct: SimulationSubproductContext;
  customer: {
    id?: string;
    role: 'customer' | 'guarantor' | 'owner' | string;
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    tenantId?: string;
    metadata?: Record<string, unknown>;
  };
  participants: Array<{
    id?: string;
    role: string;
    name: string;
    document?: string;
    email?: string;
    phone?: string;
    tenantId?: string;
    metadata?: Record<string, unknown>;
  }>;
  guarantees: Array<{
    id?: string;
    kind: string;
    label: string;
    value?: number;
    priority?: number;
    asset?: {
      id?: string;
      kind: string;
      label: string;
      value?: number;
      brand?: string;
      model?: string;
      year?: number;
      plate?: string;
      chassi?: string;
      metadata?: Record<string, unknown>;
    };
    metadata?: Record<string, unknown>;
  }>;
  vehicle?: {
    id?: string;
    kind: string;
    label: string;
    value?: number;
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    chassi?: string;
    metadata?: Record<string, unknown>;
  };
  property?: {
    id?: string;
    kind: string;
    label: string;
    value?: number;
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    chassi?: string;
    metadata?: Record<string, unknown>;
  };
  income?: {
    monthlyValue: number;
    currency?: string;
    source?: string;
  };
  agreement?: {
    id?: string;
    code?: string;
    name?: string;
  };
  provider?: {
    id?: string;
    key?: string;
    code?: string;
    name?: string;
    type?: string;
    channel?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  commercializadora?: {
    id?: string;
    key?: string;
    code?: string;
    name?: string;
    type?: string;
    channel?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  bank?: {
    id?: string;
    key?: string;
    code?: string;
    name?: string;
    type?: string;
    channel?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  corban?: {
    id?: string;
    key?: string;
    code?: string;
    name?: string;
    type?: string;
    channel?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  channel?: {
    id?: string;
    code?: string;
    name?: string;
    type?: string;
  };
  pipeline?: {
    id?: string;
    code?: string;
    name?: string;
    stageCode?: string;
    stageName?: string;
  };
  opportunity?: {
    id?: string;
    code?: string;
    name?: string;
    pipelineId?: string;
    stageId?: string;
  };
  commercial?: {
    productId?: string;
    productCode?: string;
    subproductId?: string;
    subproductCode?: string;
    modality?: string;
    pipelineId?: string;
    pipelineCode?: string;
    commercialTableId?: string;
    commercialTableCode?: string;
    workflow?: string;
    segmentCode?: string;
  };
  parameters: {
    requestedAmount?: number;
    term?: number;
    monthlyRate?: number;
    downPayment?: number;
    fees?: number;
    ltv?: number;
    rentCompromise?: number;
    [key: string]: unknown;
  };
  metadata: {
    compatibilityMode: SimulationCompatibilityMode;
    origin?: string;
    createdAt: string;
    updatedAt?: string;
    engineVersion: string;
    catalogVersion: string;
    policyVersion: string;
    strategyVersion: string;
  };
  versioning: {
    version: string;
    revision?: number;
  };
  execution?: {
    executionId?: string;
    correlationId?: string;
    requestId?: string;
    snapshotId?: string;
    tenantId?: string;
    performedBy?: string;
    performedAt?: string;
  };
};

export type SimulationRuntimeHttpExecutionDataContract = {
  requestId?: string | null;
  executionId: string;
  correlationId: string;
  tenant: SimulationTenantContext;
  product: SimulationProductContext;
  subproduct: SimulationSubproductContext;
  status: SimulationResultStatus;
  decision: SimulationDecision;
  result: SimulationResultItem[];
  proposals: SimulationProposal[];
  ranking: SimulationRanking;
  warnings: string[];
  rejectionReasons: string[];
  snapshotReference: SimulationSnapshotReference;
  auditReference: SimulationAuditReference;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
  executionTimestamp: string;
  compatibilityMode: SimulationCompatibilityMode;
};

export type SimulationRuntimeHttpSuccessResponseContract = {
  success: true;
  data: SimulationRuntimeHttpExecutionDataContract;
};

export type SimulationRuntimeHttpErrorContract = {
  requestId: string;
  message: string;
  code?: string;
  errors?: string[];
};

export type SimulationRuntimeHttpPermissionMap = {
  executeSimulation: 'simulation:execute';
};

export type SimulationRuntimeHttpRouteContract = {
  method: 'POST';
  path: '/runtime';
  permission: SimulationRuntimeHttpPermissionMap['executeSimulation'];
  body: SimulationRuntimeHttpRequestBodyContract;
  response: SimulationRuntimeHttpSuccessResponseContract;
  headers?: SimulationRuntimeHttpHeadersContract;
};

export type SimulationRuntimeHttpRouteInventory = ReadonlyArray<
  Pick<SimulationRuntimeHttpRouteContract, 'method' | 'path' | 'permission'>
>;

export const SIMULATION_RUNTIME_HTTP_ROUTE_INVENTORY = [
  {
    method: 'POST',
    path: '/runtime',
    permission: 'simulation:execute',
  },
] as const satisfies SimulationRuntimeHttpRouteInventory;
