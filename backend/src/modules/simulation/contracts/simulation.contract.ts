import type {
  SimulationAssetKind,
  SimulationCollateralKind,
  SimulationCompatibilityMode,
  SimulationDecisionStatus,
  SimulationPartyRole,
  SimulationProposalStatus,
  SimulationResultStatus,
} from '../types/simulation.types.js';

export interface SimulationTenantContext {
  id: string;
  code?: string;
  name?: string;
}

export interface SimulationProductContext {
  id: string;
  code: string;
  name: string;
  slug?: string;
  category?: string;
  type?: string;
  order?: number;
}

export interface SimulationSubproductContext {
  id: string;
  productId?: string;
  code: string;
  name: string;
  slug?: string;
  category?: string;
  simulationEngine?: string;
  proposal?: string;
  provider?: string;
  workflow?: string;
  status?: string;
}

export interface SimulationParticipant {
  id?: string;
  role: SimulationPartyRole;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationAsset {
  id?: string;
  kind: SimulationAssetKind;
  label: string;
  value?: number;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  chassi?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationCollateral {
  id?: string;
  kind: SimulationCollateralKind;
  label: string;
  value?: number;
  priority?: number;
  asset?: SimulationAsset;
  metadata?: Record<string, unknown>;
}

export interface SimulationCommercialContext {
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
}

export interface SimulationProviderContext {
  id?: string;
  key?: string;
  code?: string;
  name?: string;
  type?: string;
  channel?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SimulationChannelContext {
  id?: string;
  code?: string;
  name?: string;
  type?: string;
}

export interface SimulationAgreementContext {
  id?: string;
  code?: string;
  name?: string;
}

export interface SimulationPipelineContext {
  id?: string;
  code?: string;
  name?: string;
  stageCode?: string;
  stageName?: string;
}

export interface SimulationOpportunityContext {
  id?: string;
  code?: string;
  name?: string;
  pipelineId?: string;
  stageId?: string;
}

export interface SimulationIncomeContext {
  monthlyValue: number;
  currency?: string;
  source?: string;
}

export interface SimulationParameters {
  requestedAmount?: number;
  term?: number;
  monthlyRate?: number;
  downPayment?: number;
  fees?: number;
  ltv?: number;
  rentCompromise?: number;
  [key: string]: unknown;
}

export interface SimulationMetadata {
  compatibilityMode: SimulationCompatibilityMode;
  origin?: string;
  createdAt: string;
  updatedAt?: string;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
}

export interface SimulationVersioning {
  version: string;
  revision?: number;
}

export interface SimulationExecutionContext {
  executionId: string;
  correlationId: string;
  requestId?: string;
  snapshotId?: string;
  tenantId?: string;
  performedBy?: string;
  performedAt?: string;
}

export interface SimulationContext {
  tenant: SimulationTenantContext;
  product: SimulationProductContext;
  subproduct: SimulationSubproductContext;
  customer: SimulationParticipant;
  participants: SimulationParticipant[];
  guarantees: SimulationCollateral[];
  vehicle?: SimulationAsset;
  property?: SimulationAsset;
  income?: SimulationIncomeContext;
  agreement?: SimulationAgreementContext;
  provider?: SimulationProviderContext;
  commercializadora?: SimulationProviderContext;
  bank?: SimulationProviderContext;
  corban?: SimulationProviderContext;
  channel?: SimulationChannelContext;
  pipeline?: SimulationPipelineContext;
  opportunity?: SimulationOpportunityContext;
  commercial?: SimulationCommercialContext;
  parameters?: SimulationParameters;
}

export interface SimulationRequest extends SimulationContext {
  metadata: SimulationMetadata;
  versioning: SimulationVersioning;
  execution?: SimulationExecutionContext;
}

export interface SimulationResultItem {
  key: string;
  label: string;
  value: number | string | boolean | null;
  unit?: string;
  reference?: string;
}

export interface SimulationProposal {
  id: string;
  reference: string;
  status: SimulationProposalStatus;
  provider?: SimulationProviderContext;
  amount?: number;
  term?: number;
  monthlyRate?: number;
  payload?: Record<string, unknown>;
}

export interface SimulationRankingCandidate {
  provider: SimulationProviderContext;
  score: number;
  position: number;
  reasons: string[];
}

export interface SimulationRanking {
  candidates: SimulationRankingCandidate[];
  selected?: SimulationProviderContext;
  selectedIndex?: number;
}

export interface SimulationDecision {
  status: SimulationDecisionStatus;
  reasons: string[];
  message?: string;
  recommendedProvider?: SimulationProviderContext;
}

export interface SimulationSnapshotReference {
  snapshotId: string;
  snapshotVersion: string;
  checksum?: string;
  source?: string;
  capturedAt?: string;
}

export interface SimulationProposalReference {
  proposalId: string;
  proposalCode?: string;
  proposalVersion?: string;
}

export interface SimulationAuditReference {
  auditId: string;
  auditCode?: string;
}

export interface SimulationAudit {
  executionId: string;
  correlationId: string;
  catalogVersion: string;
  engineVersion: string;
  policyVersion: string;
  strategyVersion: string;
  requestHash: string;
  snapshotReference: SimulationSnapshotReference;
  auditReference: SimulationAuditReference;
  recordedAt: string;
}

export interface SimulationResult extends SimulationContext {
  result: SimulationResultItem[];
  proposals: SimulationProposal[];
  ranking: SimulationRanking;
  decision: SimulationDecision;
  selectedProvider?: SimulationProviderContext;
  rejectionReasons: string[];
  alerts: string[];
  warnings: string[];
  snapshot: SimulationSnapshotReference;
  proposalReference: SimulationProposalReference;
  auditReference: SimulationAuditReference;
  executionId: string;
  executionTimestamp: string;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
  metadata: SimulationMetadata;
  versioning?: SimulationVersioning;
  execution?: SimulationExecutionContext;
  status: SimulationResultStatus;
}
