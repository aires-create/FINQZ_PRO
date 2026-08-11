import type {
  SimulationRuntimeEvidenceComparisonStatus,
  SimulationRuntimeEvidenceDivergenceCategory,
  SimulationRuntimeEvidenceInput,
} from '../../domain/simulation-runtime-evidence.types.js';

export type SimulationRuntimeEvidenceHttpRequestBodyContract = {
  evidenceId: string;
  campaignId: string;
  timestamp: string;
  environment: string;
  tenantIdHash?: string | null | undefined;
  opportunityIdHash?: string | null | undefined;
  requestId: string;
  correlationId: string;
  executionId: string;
  productCode: string;
  subproductCode: string;
  legacyStatus?: string | null | undefined;
  canonicalStatus: string;
  comparisonStatus: SimulationRuntimeEvidenceComparisonStatus;
  divergenceCategory: SimulationRuntimeEvidenceDivergenceCategory;
  divergenceCount: number;
  financialCriticalCount: number;
  financialMinorCount: number;
  structuralCount: number;
  missingCanonicalFieldCount: number;
  missingLegacyFieldCount: number;
  mappingFailure: boolean;
  runtimeFailure: boolean;
  unsupportedScenario: boolean;
  legacyDurationMs: number | null;
  runtimeDurationMs: number | null;
  fallbackUsed: boolean;
  shadowMode: true;
  comparatorVersion: string;
  contractVersion: string;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
};

export type SimulationRuntimeEvidenceHttpResponseDataContract = Pick<
  SimulationRuntimeEvidenceInput,
  | 'evidenceId'
  | 'campaignId'
  | 'requestId'
  | 'correlationId'
  | 'executionId'
  | 'productCode'
  | 'subproductCode'
  | 'comparisonStatus'
  | 'divergenceCategory'
  | 'shadowMode'
> & {
  timestamp: string;
  receivedAt: string;
};

export type SimulationRuntimeEvidenceHttpSuccessResponseContract = {
  success: true;
  data: SimulationRuntimeEvidenceHttpResponseDataContract;
};

export type SimulationRuntimeEvidenceHttpErrorContract = {
  requestId: string;
  message: string;
  code?: string;
  errors?: string[];
};

export type SimulationRuntimeEvidenceHttpPermissionMap = {
  writeEvidence: 'simulation:evidence:write';
};

export type SimulationRuntimeEvidenceHttpRouteContract = {
  method: 'POST';
  path: '/runtime-evidence';
  permission: SimulationRuntimeEvidenceHttpPermissionMap['writeEvidence'];
  body: SimulationRuntimeEvidenceHttpRequestBodyContract;
  response: SimulationRuntimeEvidenceHttpSuccessResponseContract;
};

export type SimulationRuntimeEvidenceHttpRouteInventory = ReadonlyArray<
  Pick<SimulationRuntimeEvidenceHttpRouteContract, 'method' | 'path' | 'permission'>
>;

export const SIMULATION_RUNTIME_EVIDENCE_HTTP_ROUTE_INVENTORY = [
  {
    method: 'POST',
    path: '/runtime-evidence',
    permission: 'simulation:evidence:write',
  },
] as const satisfies SimulationRuntimeEvidenceHttpRouteInventory;
